import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Sale from '@/lib/models/Sale';
import Client from '@/lib/models/Client';
import Payment from '@/lib/models/Payment';
import { getAuthUser, unauthorized, checkRole } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    const roleCheck = checkRole(authUser, 'superadmin');
    if (roleCheck) return roleCheck;

    const { id } = await params;
    const user = await User.findById(id).select('-password');
    if (!user) return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });

    const [
      totalVentas,
      ventasPendientes,
      ventasVencidas,
      totalClientes,
      totalCobrado,
      subordinados
    ] = await Promise.all([
      Sale.aggregate([
        { $match: { seller: user._id } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Sale.countDocuments({ seller: user._id, status: 'pendiente' }),
      Sale.countDocuments({ seller: user._id, status: 'vencido' }),
      Client.countDocuments({ owner: user._id }),
      Payment.aggregate([
        { $lookup: { from: 'sales', localField: 'sale', foreignField: '_id', as: 'saleData' } },
        { $unwind: '$saleData' },
        { $match: { 'saleData.seller': user._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ parentUser: user._id })
    ]);

    return NextResponse.json({
      user,
      stats: {
        totalVendido: totalVentas[0]?.total || 0,
        cantidadVentas: totalVentas[0]?.count || 0,
        ventasPendientes,
        ventasVencidas,
        totalClientes,
        totalCobrado: totalCobrado[0]?.total || 0,
        subordinados
      }
    });
  } catch (error) {
    return handleError(error);
  }
}
