import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import Sale from '@/lib/models/Sale';
import Notification from '@/lib/models/Notification';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';
import { toUSD } from '@/lib/utils/exchangeRate';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { saleId, amount, currency } = await req.json();

    const sale = await Sale.findById(saleId);
    if (!sale) return NextResponse.json({ message: 'Venta no encontrada' }, { status: 404 });

    const amountUSD = await toUSD(amount, currency || 'USD');
    const remaining = sale.totalAmount - sale.paidAmount;

    if (amountUSD > remaining + 0.01) {
      return NextResponse.json({ message: `El monto excede la deuda pendiente ($${remaining.toFixed(2)} USD)` }, { status: 400 });
    }

    const payment = await Payment.create({ sale: sale._id, amount: amountUSD, paidBy: sale.buyer || sale.client, registeredBy: user._id });

    sale.paidAmount += amountUSD;
    if (sale.paidAmount >= sale.totalAmount - 0.01) {
      sale.paidAmount = sale.totalAmount;
      sale.status = 'saldado';
    }
    await sale.save();

    if (String(sale.seller) !== String(user._id)) {
      await Notification.create({
        user: sale.seller, type: 'payment_received', title: 'Abono recibido',
        message: `Se registró un abono de $${amountUSD.toFixed(2)} USD`, relatedSale: sale._id
      });
    }

    return NextResponse.json({
      payment,
      sale: { id: sale._id, totalAmount: sale.totalAmount, paidAmount: sale.paidAmount, remaining: sale.totalAmount - sale.paidAmount, status: sale.status }
    }, { status: 201 });
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
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const mySales = await Sale.find({ seller: user._id }).select('_id');
    const saleIds = mySales.map(s => s._id);

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find({ sale: { $in: saleIds } })
        .populate('sale', 'totalAmount paidAmount status type')
        .populate('registeredBy', 'name')
        .skip(skip).limit(limit).sort({ createdAt: -1 }),
      Payment.countDocuments({ sale: { $in: saleIds } })
    ]);

    return NextResponse.json({ payments, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(error);
  }
}
