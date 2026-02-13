import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import Notification from '@/lib/models/Notification';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';
import calculateDueDate from '@/lib/utils/calculateDueDate';
import { toUSD } from '@/lib/utils/exchangeRate';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { type, paymentType, clientId, buyerId, items, currency, creditTerm } = await req.json();

    if (type === 'detal' && !clientId) return NextResponse.json({ message: 'Debe seleccionar un cliente' }, { status: 400 });
    if (type === 'red' && !buyerId) return NextResponse.json({ message: 'Debe seleccionar un miembro de la red' }, { status: 400 });

    const saleItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, owner: user._id });
      if (!product) return NextResponse.json({ message: `Producto no encontrado: ${item.productId}` }, { status: 404 });
      if (product.quantity < item.quantity) return NextResponse.json({ message: `Stock insuficiente de ${product.name}` }, { status: 400 });

      const unitPriceUSD = await toUSD(item.unitPrice, currency || 'USD');
      const itemTotal = unitPriceUSD * item.quantity;

      saleItems.push({ product: product._id, productName: product.name, quantity: item.quantity, unitPrice: unitPriceUSD });
      totalAmount += itemTotal;

      product.quantity -= item.quantity;
      await product.save();
    }

    let creditData = {};
    if (paymentType === 'credito') {
      const term = creditTerm || user.defaultCreditTerm;
      creditData = { unit: term.unit, quantity: term.quantity, dueDate: calculateDueDate(term.unit, term.quantity) };
    }

    const sale = await Sale.create({
      seller: user._id, client: type === 'detal' ? clientId : undefined,
      buyer: type === 'red' ? buyerId : undefined, type, paymentType,
      items: saleItems, totalAmount,
      creditTerm: paymentType === 'credito' ? creditData : undefined,
      status: paymentType === 'contado' ? 'saldado' : 'pendiente',
      paidAmount: paymentType === 'contado' ? totalAmount : 0,
      networkId: user.networkId
    });

    if (type === 'red') {
      for (const item of saleItems) {
        let buyerProduct = await Product.findOne({ name: item.productName, owner: buyerId, networkId: user.networkId });
        if (buyerProduct) {
          buyerProduct.quantity += item.quantity;
          await buyerProduct.save();
        } else {
          await Product.create({ name: item.productName, quantity: item.quantity, price: item.unitPrice, owner: buyerId, networkId: user.networkId });
        }
      }
      await Notification.create({
        user: buyerId, type: 'new_merchandise', title: 'Mercancía recibida',
        message: `${user.name} te asignó mercancía por $${totalAmount.toFixed(2)}`,
        relatedSale: sale._id, relatedUser: user._id
      });
    }

    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const paymentType = searchParams.get('paymentType');
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { seller: user._id };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (paymentType) filter.paymentType = paymentType;

    await Sale.updateMany(
      { seller: user._id, status: 'pendiente', 'creditTerm.dueDate': { $lt: new Date() } },
      { status: 'vencido' }
    );

    const skip = (page - 1) * limit;
    const [sales, total] = await Promise.all([
      Sale.find(filter).populate('client', 'name cedula phone').populate('buyer', 'name phone role').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Sale.countDocuments(filter)
    ]);

    return NextResponse.json({ sales, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(error);
  }
}
