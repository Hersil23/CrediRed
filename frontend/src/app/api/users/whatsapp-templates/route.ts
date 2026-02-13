import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { templates } = await req.json();
    if (templates) {
      user.whatsappTemplates = { ...user.whatsappTemplates.toObject(), ...templates };
      await user.save();
    }

    return NextResponse.json({ whatsappTemplates: user.whatsappTemplates });
  } catch (error) {
    return handleError(error);
  }
}
