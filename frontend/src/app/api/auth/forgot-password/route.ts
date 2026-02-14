export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import sendEmail from '@/lib/utils/sendEmail';
import { resetPasswordEmail } from '@/lib/utils/emailTemplates';
import { handleError } from '@/lib/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'No existe una cuenta con ese correo' }, { status: 404 });
    }

    const resetToken = randomBytes(32).toString('hex');
    user.resetPasswordToken = createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      const resetEmail = resetPasswordEmail({ name: user.name, resetUrl });
      await sendEmail({ to: user.email, ...resetEmail });

      return NextResponse.json({ message: 'Se envió un correo con las instrucciones' });
    } catch {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return NextResponse.json({ message: 'Error al enviar el correo' }, { status: 500 });
    }
  } catch (error) {
    return handleError(error);
  }
}
