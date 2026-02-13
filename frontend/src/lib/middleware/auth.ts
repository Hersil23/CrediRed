import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAuthUser(req: NextRequest): Promise<any> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    await connectDB();
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id);
    return user;
  } catch {
    return null;
  }
}

export function unauthorized(message = 'No autorizado') {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = 'No tienes permisos para esta acción', code?: string) {
  return NextResponse.json({ message, ...(code ? { code } : {}) }, { status: 403 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkStatus(user: any): Promise<NextResponse | null> {
  if (user.role === 'superadmin') return null;

  if (user.status === 'trial' && user.trialEndsAt && new Date() > user.trialEndsAt) {
    user.status = 'expired';
    await user.save();
    return forbidden('Tu período de prueba ha expirado', 'TRIAL_EXPIRED');
  }

  if (user.status === 'expired') {
    return forbidden('Tu suscripción ha expirado', 'SUBSCRIPTION_EXPIRED');
  }

  if (user.status === 'blocked') {
    return forbidden('Tu cuenta ha sido bloqueada', 'ACCOUNT_BLOCKED');
  }

  return null;
}

export function checkRole(user: { role: string }, ...roles: string[]): NextResponse | null {
  if (!roles.includes(user.role)) {
    return forbidden('No tienes permisos para esta acción');
  }
  return null;
}
