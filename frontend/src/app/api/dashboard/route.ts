import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import Client from '@/lib/models/Client';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const userId = user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    await Sale.updateMany(
      { seller: userId, status: 'pendiente', 'creditTerm.dueDate': { $lt: now } },
      { status: 'vencido' }
    );

    const [
      ventasMesActual, ventasMesAnterior, porCobrar, cobrado,
      inventario, totalClientes, clientesMorosos,
      ventasActivas, ventasSaldadas, ventasVencidas, clientesNuevos, productoMasVendido
    ] = await Promise.all([
      Sale.aggregate([{ $match: { seller: userId, createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      Sale.aggregate([{ $match: { seller: userId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Sale.aggregate([{ $match: { seller: userId, status: { $in: ['pendiente', 'vencido'] } } }, { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } }]),
      Sale.aggregate([
        { $match: { seller: userId } },
        { $lookup: { from: 'payments', localField: '_id', foreignField: 'sale', as: 'payments', pipeline: [{ $match: { createdAt: { $gte: startOfMonth } } }] } },
        { $unwind: '$payments' },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } }
      ]),
      Product.aggregate([{ $match: { owner: userId } }, { $group: { _id: null, totalItems: { $sum: '$quantity' }, totalValue: { $sum: { $multiply: ['$price', '$quantity'] } } } }]),
      Client.countDocuments({ owner: userId }),
      Sale.distinct('client', { seller: userId, status: 'vencido', client: { $ne: null } }),
      Sale.countDocuments({ seller: userId, status: 'pendiente' }),
      Sale.countDocuments({ seller: userId, status: 'saldado' }),
      Sale.countDocuments({ seller: userId, status: 'vencido' }),
      Client.countDocuments({ owner: userId, createdAt: { $gte: startOfMonth } }),
      Sale.aggregate([
        { $match: { seller: userId } }, { $unwind: '$items' },
        { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' } } },
        { $sort: { totalQty: -1 } }, { $limit: 1 }
      ])
    ]);

    return NextResponse.json({
      ventas: {
        mesActual: ventasMesActual[0]?.total || 0, mesAnterior: ventasMesAnterior[0]?.total || 0,
        cantidadMesActual: ventasMesActual[0]?.count || 0,
        activas: ventasActivas, saldadas: ventasSaldadas, vencidas: ventasVencidas
      },
      cobros: { porCobrar: porCobrar[0]?.total || 0, cobradoMes: cobrado[0]?.total || 0, morosos: clientesMorosos.length },
      inventario: { totalItems: inventario[0]?.totalItems || 0, totalValue: inventario[0]?.totalValue || 0 },
      clientes: { total: totalClientes, morosos: clientesMorosos.length, nuevos: clientesNuevos },
      productoTop: productoMasVendido[0]?._id || null
    });
  } catch (error) {
    return handleError(error);
  }
}
