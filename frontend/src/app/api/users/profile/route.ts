import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { name, phone, email, preferredCurrency, defaultCreditTerm } = await req.json();

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return NextResponse.json({ message: 'Ese correo ya está en uso' }, { status: 400 });
      user.email = email;
    }
    if (preferredCurrency) user.preferredCurrency = preferredCurrency;
    if (defaultCreditTerm) user.defaultCreditTerm = defaultCreditTerm;

    await user.save();
    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}
