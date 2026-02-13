import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Sale from '@/lib/models/Sale';
import '@/lib/models/Network';
import { getAuthUser, unauthorized, checkRole } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    const roleCheck = checkRole(authUser, 'superadmin');
    if (roleCheck) return roleCheck;

    const { id } = await params;
    const user = await User.findById(id).select('-password').populate('networkId');
    if (!user) return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    const roleCheck = checkRole(authUser, 'superadmin');
    if (roleCheck) return roleCheck;

    const { id } = await params;
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });

    const pendingDebts = await Sale.countDocuments({
      $or: [{ buyer: user._id, status: 'pendiente' }, { buyer: user._id, status: 'vencido' }]
    });

    if (pendingDebts > 0) {
      return NextResponse.json({ message: 'No se puede eliminar: el usuario tiene deudas pendientes' }, { status: 400 });
    }

    await User.updateMany({ parentUser: user._id }, { parentUser: null, networkId: null, isIndependent: true });
    await User.findByIdAndDelete(user._id);

    return NextResponse.json({ message: 'Usuario eliminado' });
  } catch (error) {
    return handleError(error);
  }
}
