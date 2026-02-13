import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/Network';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const network = await Network.findOne({
      $or: [{ owner: user._id }, { _id: user.networkId }]
    });

    if (!network) {
      return NextResponse.json({ message: 'No perteneces a ninguna red' }, { status: 404 });
    }

    return NextResponse.json({ network });
  } catch (error) {
    return handleError(error);
  }
}
