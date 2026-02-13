import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Network from '@/lib/models/Network';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { name } = await req.json();

    const existingNetwork = await Network.findOne({ owner: user._id });
    if (existingNetwork) {
      return NextResponse.json({ message: 'Ya tienes una red creada' }, { status: 400 });
    }

    const network = await Network.create({ name, owner: user._id });

    user.networkId = network._id;
    user.isIndependent = false;
    user.role = 'empresarial';
    await user.save();

    return NextResponse.json({ network }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
