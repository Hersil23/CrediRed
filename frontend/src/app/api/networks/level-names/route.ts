import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/Network';
import { getAuthUser, unauthorized, checkStatus, checkRole } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;
    const roleCheck = checkRole(user, 'empresarial');
    if (roleCheck) return roleCheck;

    const network = await Network.findOne({ owner: user._id });
    if (!network) return NextResponse.json({ message: 'No tienes una red' }, { status: 404 });

    const { levelNames } = await req.json();
    if (levelNames) {
      network.levelNames = { ...network.levelNames.toObject(), ...levelNames };
      await network.save();
    }

    return NextResponse.json({ network });
  } catch (error) {
    return handleError(error);
  }
}
