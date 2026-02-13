import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import '@/lib/models/Client';
import '@/lib/models/User';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    await Sale.updateMany(
      { seller: user._id, status: 'pendiente', 'creditTerm.dueDate': { $lt: new Date() } },
      { status: 'vencido' }
    );

    const sales = await Sale.find({
      seller: user._id, paymentType: 'credito', status: { $in: ['pendiente', 'vencido'] }
    })
      .populate('client', 'name cedula phone')
      .populate('buyer', 'name phone role')
      .sort({ 'creditTerm.dueDate': 1 });

    const summary = {
      totalPorCobrar: sales.reduce((sum, s) => sum + (s.totalAmount - s.paidAmount), 0),
      pendientes: sales.filter(s => s.status === 'pendiente').length,
      vencidas: sales.filter(s => s.status === 'vencido').length
    };

    return NextResponse.json({ sales, summary });
  } catch (error) {
    return handleError(error);
  }
}
