import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import '@/lib/models/Client';
import '@/lib/models/User';
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
    const sale = await Sale.findById(id)
      .populate('client', 'name cedula phone')
      .populate('buyer', 'name phone role')
      .populate('seller', 'name phone');

    if (!sale) return NextResponse.json({ message: 'Venta no encontrada' }, { status: 404 });

    return NextResponse.json({ sale });
  } catch (error) {
    return handleError(error);
  }
}
