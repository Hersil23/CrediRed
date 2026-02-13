import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { getAuthUser, unauthorized } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    await Notification.updateMany({ user: user._id, read: false }, { read: true });
    return NextResponse.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    return handleError(error);
  }
}
