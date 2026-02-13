import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import generateToken from '@/lib/utils/generateToken';
import { handleError } from '@/lib/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    if (user.status === 'trial' && user.trialEndsAt && new Date() > user.trialEndsAt) {
      user.status = 'expired';
      await user.save();
    }

    if (user.status === 'blocked') {
      return NextResponse.json({ message: 'Tu cuenta ha sido bloqueada' }, { status: 403 });
    }

    const token = generateToken(user._id.toString());

    return NextResponse.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email, phone: user.phone,
        role: user.role, status: user.status, isIndependent: user.isIndependent,
        networkId: user.networkId, inviteCode: user.inviteCode,
        preferredCurrency: user.preferredCurrency, trialEndsAt: user.trialEndsAt,
        subscription: user.subscription
      }
    });
  } catch (error) {
    return handleError(error);
  }
}
