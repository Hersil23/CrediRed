import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import '@/lib/models/User';
import { getAuthUser, unauthorized } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: user._id }).populate('relatedUser', 'name role').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Notification.countDocuments({ user: user._id }),
      Notification.countDocuments({ user: user._id, read: false })
    ]);

    return NextResponse.json({ notifications, unreadCount, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleError(error);
  }
}
