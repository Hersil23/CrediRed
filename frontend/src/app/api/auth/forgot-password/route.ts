import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import sendEmail from '@/lib/utils/sendEmail';
import { handleError } from '@/lib/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: 'No existe una cuenta con ese correo' }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'CrediRed - Recuperar contraseña',
        html: `<h2>Recuperar contraseña</h2><p>Hola ${user.name},</p><p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${resetUrl}" style="background:#10B981;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Restablecer contraseña</a></p><p>Este enlace expira en 30 minutos.</p><p>Si no solicitaste esto, ignora este correo.</p><br><p>— El equipo de CrediRed</p>`
      });

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
