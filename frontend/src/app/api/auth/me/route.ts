import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import '@/lib/models/Network';
import { getAuthUser, unauthorized } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    if (!authUser) return unauthorized();

    const user = await User.findById(authUser._id).populate('networkId');
    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}
