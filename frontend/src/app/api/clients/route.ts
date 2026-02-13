import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/lib/models/Client';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    if (user.status === 'trial') {
      const clientCount = await Client.countDocuments({ owner: user._id });
      if (clientCount >= 6) {
        return NextResponse.json({ message: 'Límite de clientes alcanzado en período de prueba (máx. 6)', code: 'TRIAL_LIMIT' }, { status: 400 });
      }
    }

    const { name, cedula, phone } = await req.json();
    const client = await Client.create({ name, cedula, phone, owner: user._id });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { owner: user._id };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cedula: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({ clients });
  } catch (error) {
    return handleError(error);
  }
}
