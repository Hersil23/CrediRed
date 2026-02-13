const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Client = require('../models/Client');
const User = require('../models/User');
const Payment = require('../models/Payment');

// GET /api/dashboard — Dashboard personal
exports.getMyDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Actualizar ventas vencidas
    await Sale.updateMany(
      { seller: userId, status: 'pendiente', 'creditTerm.dueDate': { $lt: now } },
      { status: 'vencido' }
    );

    const [
      ventasMesActual,
      ventasMesAnterior,
      porCobrar,
      cobrado,
      inventario,
      totalClientes,
      clientesMorosos,
      ventasActivas,
      ventasSaldadas,
      ventasVencidas,
      clientesNuevos,
      productoMasVendido
    ] = await Promise.all([
      // Total vendido este mes
      Sale.aggregate([
        { $match: { seller: userId, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      // Total vendido mes anterior
      Sale.aggregate([
        { $match: { seller: userId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // Total por cobrar
      Sale.aggregate([
        { $match: { seller: userId, status: { $in: ['pendiente', 'vencido'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } }
      ]),
      // Total cobrado este mes
      Sale.aggregate([
        { $match: { seller: userId } },
        {
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'sale',
            as: 'payments',
            pipeline: [{ $match: { createdAt: { $gte: startOfMonth } } }]
          }
        },
        { $unwind: '$payments' },
        { $group: { _id: null, total: { $sum: '$payments.amount' } } }
      ]),
      // Inventario (cantidad y valor)
      Product.aggregate([
        { $match: { owner: userId } },
        { $group: { _id: null, totalItems: { $sum: '$quantity' }, totalValue: { $sum: { $multiply: ['$price', '$quantity'] } } } }
      ]),
      // Total clientes
      Client.countDocuments({ owner: userId }),
      // Clientes morosos (con ventas vencidas)
      Sale.distinct('client', { seller: userId, status: 'vencido', client: { $ne: null } }),
      // Ventas activas (pendientes)
      Sale.countDocuments({ seller: userId, status: 'pendiente' }),
      // Ventas saldadas
      Sale.countDocuments({ seller: userId, status: 'saldado' }),
      // Ventas vencidas
      Sale.countDocuments({ seller: userId, status: 'vencido' }),
      // Clientes nuevos este mes
      Client.countDocuments({ owner: userId, createdAt: { $gte: startOfMonth } }),
      // Producto más vendido
      Sale.aggregate([
        { $match: { seller: userId } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName', totalQty: { $sum: '$items.quantity' } } },
        { $sort: { totalQty: -1 } },
        { $limit: 1 }
      ])
    ]);

    res.json({
      ventas: {
        mesActual: ventasMesActual[0]?.total || 0,
        mesAnterior: ventasMesAnterior[0]?.total || 0,
        cantidadMesActual: ventasMesActual[0]?.count || 0,
        activas: ventasActivas,
        saldadas: ventasSaldadas,
        vencidas: ventasVencidas
      },
      cobros: {
        porCobrar: porCobrar[0]?.total || 0,
        cobradoMes: cobrado[0]?.total || 0,
        morosos: clientesMorosos.length
      },
      inventario: {
        totalItems: inventario[0]?.totalItems || 0,
        totalValue: inventario[0]?.totalValue || 0
      },
      clientes: {
        total: totalClientes,
        morosos: clientesMorosos.length,
        nuevos: clientesNuevos
      },
      productoTop: productoMasVendido[0]?.name || null
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/network — Dashboard de la red (para superiores)
exports.getNetworkDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Obtener todos los subordinados recursivamente
    const getSubordinateIds = async (parentId) => {
      const children = await User.find({ parentUser: parentId }).select('_id');
      let ids = children.map(c => c._id);
      for (const child of children) {
        const grandChildren = await getSubordinateIds(child._id);
        ids = ids.concat(grandChildren);
      }
      return ids;
    };

    const subordinateIds = await getSubordinateIds(userId);

    if (subordinateIds.length === 0) {
      return res.json({ message: 'No tienes miembros en tu red', stats: null });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalVendidoRed,
      porCobrarRed,
      miembrosActivos,
      miembrosInactivos,
      topVendedor,
      topMoroso
    ] = await Promise.all([
      // Total vendido por la red este mes
      Sale.aggregate([
        { $match: { seller: { $in: subordinateIds }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // Total por cobrar en la red
      Sale.aggregate([
        { $match: { seller: { $in: subordinateIds }, status: { $in: ['pendiente', 'vencido'] } } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } } } }
      ]),
      // Miembros activos
      User.countDocuments({ _id: { $in: subordinateIds }, status: { $in: ['active', 'trial'] } }),
      // Miembros inactivos
      User.countDocuments({ _id: { $in: subordinateIds }, status: { $in: ['expired', 'blocked'] } }),
      // Persona que más vende
      Sale.aggregate([
        { $match: { seller: { $in: subordinateIds }, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$seller', total: { $sum: '$totalAmount' } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', total: 1 } }
      ]),
      // Persona con más ventas vencidas
      Sale.aggregate([
        { $match: { seller: { $in: subordinateIds }, status: 'vencido' } },
        { $group: { _id: '$seller', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', count: 1 } }
      ])
    ]);

    res.json({
      red: {
        totalMiembros: subordinateIds.length,
        activos: miembrosActivos,
        inactivos: miembrosInactivos
      },
      ventas: {
        totalVendidoMes: totalVendidoRed[0]?.total || 0,
        porCobrar: porCobrarRed[0]?.total || 0
      },
      topVendedor: topVendedor[0] || null,
      topMoroso: topMoroso[0] || null
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/admin — Dashboard del superadmin
exports.getSuperadminDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      trialUsers,
      expiredUsers,
      blockedUsers,
      totalNetworks,
      newUsersMonth,
      subscriptionRevenue
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'superadmin' } }),
      User.countDocuments({ status: 'active', role: { $ne: 'superadmin' } }),
      User.countDocuments({ status: 'trial' }),
      User.countDocuments({ status: 'expired' }),
      User.countDocuments({ status: 'blocked' }),
      require('../models/Network').countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfMonth }, role: { $ne: 'superadmin' } }),
      // Ingresos estimados: usuarios activos * $7
      User.countDocuments({ status: 'active', role: { $ne: 'superadmin' } })
    ]);

    res.json({
      usuarios: {
        total: totalUsers,
        activos: activeUsers,
        trial: trialUsers,
        expirados: expiredUsers,
        bloqueados: blockedUsers,
        nuevosEsteMes: newUsersMonth
      },
      redes: {
        total: totalNetworks
      },
      ingresos: {
        estimadoMensual: subscriptionRevenue * 7
      }
    });
  } catch (error) {
    next(error);
  }
};
