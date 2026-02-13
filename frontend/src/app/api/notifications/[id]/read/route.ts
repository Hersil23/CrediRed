import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { getAuthUser, unauthorized } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: user._id },
      { read: true },
      { new: true }
    );

    if (!notification) return NextResponse.json({ message: 'Notificación no encontrada' }, { status: 404 });

    return NextResponse.json({ notification });
  } catch (error) {
    return handleError(error);
  }
}
