import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { id } = await params;
    const { buyerId, quantity, price } = await req.json();

    const product = await Product.findOne({ _id: id, owner: user._id });
    if (!product) return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });

    if (product.quantity < quantity) {
      return NextResponse.json({ message: 'No tienes suficiente stock' }, { status: 400 });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer) return NextResponse.json({ message: 'Usuario destino no encontrado' }, { status: 404 });

    product.quantity -= quantity;
    await product.save();

    let buyerProduct = await Product.findOne({ name: product.name, owner: buyerId, networkId: user.networkId });

    if (buyerProduct) {
      buyerProduct.quantity += quantity;
      buyerProduct.price = price || buyerProduct.price;
      await buyerProduct.save();
    } else {
      buyerProduct = await Product.create({
        name: product.name, quantity, price: price || product.price,
        owner: buyerId, networkId: user.networkId
      });
    }

    await Notification.create({
      user: buyerId, type: 'new_merchandise', title: 'Mercancía asignada',
      message: `${user.name} te asignó ${quantity} unidad(es) de ${product.name}`,
      relatedUser: user._id
    });

    return NextResponse.json({ message: 'Mercancía asignada exitosamente', sellerProduct: product, buyerProduct });
  } catch (error) {
    return handleError(error);
  }
}
