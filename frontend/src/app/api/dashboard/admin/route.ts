import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Network from '@/lib/models/Network';
import { getAuthUser, unauthorized, checkRole } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const roleCheck = checkRole(user, 'superadmin');
    if (roleCheck) return roleCheck;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, trialUsers, expiredUsers, blockedUsers, totalNetworks, newUsersMonth] = await Promise.all([
      User.countDocuments({ role: { $ne: 'superadmin' } }),
      User.countDocuments({ status: 'active', role: { $ne: 'superadmin' } }),
      User.countDocuments({ status: 'trial' }),
      User.countDocuments({ status: 'expired' }),
      User.countDocuments({ status: 'blocked' }),
      Network.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfMonth }, role: { $ne: 'superadmin' } })
    ]);

    return NextResponse.json({
      usuarios: { total: totalUsers, activos: activeUsers, trial: trialUsers, expirados: expiredUsers, bloqueados: blockedUsers, nuevosEsteMes: newUsersMonth },
      redes: { total: totalNetworks },
      ingresos: { estimadoMensual: activeUsers * 7 }
    });
  } catch (error) {
    return handleError(error);
  }
}
