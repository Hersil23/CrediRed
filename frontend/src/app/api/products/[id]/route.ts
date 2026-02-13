import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { id } = await params;
    const product = await Product.findOne({ _id: id, owner: user._id });
    if (!product) return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });

    return NextResponse.json({ product });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { id } = await params;
    const { name, quantity, price } = await req.json();
    const product = await Product.findOne({ _id: id, owner: user._id });
    if (!product) return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });

    if (name) product.name = name;
    if (quantity !== undefined) product.quantity = quantity;
    if (price !== undefined) product.price = price;
    await product.save();

    return NextResponse.json({ product });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { id } = await params;
    const product = await Product.findOneAndDelete({ _id: id, owner: user._id });
    if (!product) return NextResponse.json({ message: 'Producto no encontrado' }, { status: 404 });

    return NextResponse.json({ message: 'Producto eliminado' });
  } catch (error) {
    return handleError(error);
  }
}
