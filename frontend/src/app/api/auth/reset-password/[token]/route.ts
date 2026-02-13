export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import generateToken from '@/lib/utils/generateToken';
import { handleError } from '@/lib/middleware/errorHandler';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json({ message: 'Token inválido o expirado' }, { status: 400 });
    }

    const { password } = await req.json();
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const jwtToken = generateToken(user._id.toString());
    return NextResponse.json({ token: jwtToken, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    return handleError(error);
  }
}
