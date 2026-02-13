import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSubordinates = async (parentId: any): Promise<any[]> => {
  const directReports = await User.find({ parentUser: parentId }).select('-password').lean();
  const result = [];
  for (const member of directReports) {
    const children = await getSubordinates(member._id);
    result.push({ ...member, subordinates: children });
  }
  return result;
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const members = await getSubordinates(user._id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flatMembers: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flatten = (arr: any[]) => {
      arr.forEach(m => {
        flatMembers.push(m);
        if (m.subordinates) flatten(m.subordinates);
      });
    };
    flatten(members);

    const stats = {
      total: flatMembers.length,
      activos: flatMembers.filter(m => m.status === 'active').length,
      trial: flatMembers.filter(m => m.status === 'trial').length,
      inactivos: flatMembers.filter(m => m.status === 'expired' || m.status === 'blocked').length
    };

    return NextResponse.json({ members, stats });
  } catch (error) {
    return handleError(error);
  }
}
