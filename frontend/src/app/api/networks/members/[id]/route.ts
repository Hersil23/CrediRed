import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Sale from '@/lib/models/Sale';
import Client from '@/lib/models/Client';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    const statusCheck = await checkStatus(authUser);
    if (statusCheck) return statusCheck;

    const { id } = await params;
    const member = await User.findById(id).select('-password');
    if (!member) return NextResponse.json({ message: 'Miembro no encontrado' }, { status: 404 });

    if (String(member.networkId) !== String(authUser.networkId) && String(member.parentUser) !== String(authUser._id)) {
      return NextResponse.json({ message: 'No tienes acceso a este miembro' }, { status: 403 });
    }

    const [totalSales, pendingSales, totalClients] = await Promise.all([
      Sale.aggregate([{ $match: { seller: member._id } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Sale.countDocuments({ seller: member._id, status: { $in: ['pendiente', 'vencido'] } }),
      Client.countDocuments({ owner: member._id })
    ]);

    return NextResponse.json({
      member,
      stats: { totalVendido: totalSales[0]?.total || 0, ventasPendientes: pendingSales, totalClientes: totalClients }
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    const statusCheck = await checkStatus(authUser);
    if (statusCheck) return statusCheck;

    const { id } = await params;
    const member = await User.findById(id);
    if (!member) return NextResponse.json({ message: 'Miembro no encontrado' }, { status: 404 });

    const pendingDebts = await Sale.countDocuments({ buyer: member._id, status: { $in: ['pendiente', 'vencido'] } });
    if (pendingDebts > 0) {
      return NextResponse.json({ message: 'No se puede eliminar: tiene deudas pendientes' }, { status: 400 });
    }

    await User.updateMany({ parentUser: member._id }, { parentUser: null, networkId: null, isIndependent: true });
    member.parentUser = null;
    member.networkId = null;
    member.isIndependent = true;
    member.role = 'emprendedor';
    await member.save();

    return NextResponse.json({ message: 'Miembro removido de la red' });
  } catch (error) {
    return handleError(error);
  }
}
