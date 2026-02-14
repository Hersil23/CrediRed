import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
import generateToken from '@/lib/utils/generateToken';
import sendEmail from '@/lib/utils/sendEmail';
import { welcomeEmail, newNetworkMemberEmail } from '@/lib/utils/emailTemplates';
import { handleError } from '@/lib/middleware/errorHandler';

const ROLE_HIERARCHY: Record<string, string> = {
  empresarial: 'gerente',
  gerente: 'lider',
  lider: 'distribuidor',
  distribuidor: 'emprendedor',
  emprendedor: 'emprendedor'
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, phone, password, inviteCode } = await req.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'Ya existe una cuenta con ese correo' }, { status: 400 });
    }

    let role = 'emprendedor';
    let parentUser = null;
    let networkId = null;
    let isIndependent = true;

    if (inviteCode) {
      const inviter = await User.findOne({ inviteCode });
      if (!inviter) {
        return NextResponse.json({ message: 'Código de invitación inválido' }, { status: 400 });
      }

      if (inviter.status === 'trial') {
        const hierarchy = ['empresarial', 'gerente', 'lider', 'distribuidor'];
        if (hierarchy.includes(inviter.role)) {
          const inviteCount = await User.countDocuments({ parentUser: inviter._id });
          if (inviteCount >= 3) {
            return NextResponse.json({ message: 'Este usuario ha alcanzado el límite de invitaciones en trial' }, { status: 400 });
          }
        }
      }

      role = ROLE_HIERARCHY[inviter.role];
      parentUser = inviter._id;
      networkId = inviter.networkId;
      isIndependent = false;

      if (inviter.isIndependent) {
        isIndependent = true;
        networkId = null;
      }
    }

    const user = await User.create({ name, email, phone, password, role, parentUser, networkId, isIndependent });

    if (parentUser) {
      await Notification.create({
        user: parentUser,
        type: 'new_member',
        title: 'Nuevo miembro en tu red',
        message: `${name} se unió a tu red`,
        relatedUser: user._id
      });

      // Email al sponsor
      try {
        const sponsor = await User.findById(parentUser);
        if (sponsor?.email) {
          const sponsorEmail = newNetworkMemberEmail({
            sponsorName: sponsor.name,
            newMemberName: name,
            newMemberRole: role
          });
          await sendEmail({ to: sponsor.email, ...sponsorEmail });
        }
      } catch (emailError) {
        console.error('Error enviando email al sponsor:', emailError);
      }
    }

    // Email de bienvenida
    try {
      const welcome = welcomeEmail({ name });
      await sendEmail({ to: email, ...welcome });
    } catch (emailError) {
      console.error('Error enviando email de bienvenida:', emailError);
    }

    const token = generateToken(user._id.toString());

    return NextResponse.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email, phone: user.phone,
        role: user.role, status: user.status, isIndependent: user.isIndependent,
        inviteCode: user.inviteCode, trialEndsAt: user.trialEndsAt
      }
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
