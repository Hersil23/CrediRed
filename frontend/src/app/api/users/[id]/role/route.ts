import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized, checkRole } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();
    const roleCheck = checkRole(authUser, 'superadmin');
    if (roleCheck) return roleCheck;

    const { id } = await params;
    const { role } = await req.json();

    const validRoles = ['empresarial', 'gerente', 'lider', 'distribuidor', 'emprendedor'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: 'Rol inválido' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });

    user.role = role;
    await user.save();

    return NextResponse.json({ message: `Rol actualizado a ${role}`, user });
  } catch (error) {
    return handleError(error);
  }
}
