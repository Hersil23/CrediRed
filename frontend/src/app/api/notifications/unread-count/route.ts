import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { getAuthUser, unauthorized } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const count = await Notification.countDocuments({ user: user._id, read: false });
    return NextResponse.json({ count });
  } catch (error) {
    return handleError(error);
  }
}
