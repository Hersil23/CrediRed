import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Sale from '@/lib/models/Sale';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSubordinateIds = async (parentId: any): Promise<any[]> => {
  const children = await User.find({ parentUser: parentId }).select('_id');
  let ids = children.map(c => c._id);
  for (const child of children) {
    const grandChildren = await getSubordinateIds(child._id);
    ids = ids.concat(grandChildren);
  }
  return ids;
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const subordinateIds = await getSubordinateIds(user._id);

    if (subordinateIds.length === 0) {
      return NextResponse.json({ message: 'No tienes miembros en tu red', stats: null });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalVendidoRed, porCobrarRed, miembrosActivos, miembrosInactivos, topVendedor, topMoroso] = await Promise.all([
      Sale.aggregate([{ $match: { seller: { $in: subordinateIds }, createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Sale.aggregate([{ $match: { seller: { $in: subordinateIds }, status: { $in: ['pendiente', 'vencido'] } } }, { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } }]),
      User.countDocuments({ _id: { $in: subordinateIds }, status: { $in: ['active', 'trial'] } }),
      User.countDocuments({ _id: { $in: subordinateIds }, status: { $in: ['expired', 'blocked'] } }),
      Sale.aggregate([
        { $match: { seller: { $in: subordinateIds }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$seller', total: { $sum: '$totalAmount' } } },
        { $sort: { total: -1 } }, { $limit: 1 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' }, { $project: { name: '$user.name', total: 1 } }
      ]),
      Sale.aggregate([
        { $match: { seller: { $in: subordinateIds }, status: 'vencido' } },
        { $group: { _id: '$seller', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 1 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' }, { $project: { name: '$user.name', count: 1 } }
      ])
    ]);

    return NextResponse.json({
      red: { totalMiembros: subordinateIds.length, activos: miembrosActivos, inactivos: miembrosInactivos },
      ventas: { totalVendidoMes: totalVendidoRed[0]?.total || 0, porCobrar: porCobrarRed[0]?.total || 0 },
      topVendedor: topVendedor[0] || null, topMoroso: topMoroso[0] || null
    });
  } catch (error) {
    return handleError(error);
  }
}
