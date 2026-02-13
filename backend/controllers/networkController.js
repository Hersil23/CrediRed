const User = require('../models/User');
const Network = require('../models/Network');
const Sale = require('../models/Sale');

// POST /api/networks — Crear red (solo empresarial)
exports.createNetwork = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = req.user;

    // Verificar que no tenga red ya
    const existingNetwork = await Network.findOne({ owner: user._id });
    if (existingNetwork) {
      return res.status(400).json({ message: 'Ya tienes una red creada' });
    }

    const network = await Network.create({
      name,
      owner: user._id
    });

    // Actualizar usuario
    user.networkId = network._id;
    user.isIndependent = false;
    user.role = 'empresarial';
    await user.save();

    res.status(201).json({ network });
  } catch (error) {
    next(error);
  }
};

// GET /api/networks/mine — Obtener mi red
exports.getMyNetwork = async (req, res, next) => {
  try {
    const network = await Network.findOne({
      $or: [
        { owner: req.user._id },
        { _id: req.user.networkId }
      ]
    });

    if (!network) {
      return res.status(404).json({ message: 'No perteneces a ninguna red' });
    }

    res.json({ network });
  } catch (error) {
    next(error);
  }
};

// GET /api/networks/members — Obtener miembros de mi red (árbol hacia abajo)
exports.getNetworkMembers = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Buscar recursivamente todos los subordinados
    const getSubordinates = async (parentId) => {
      const directReports = await User.find({ parentUser: parentId })
        .select('-password')
        .lean();

      const result = [];
      for (const member of directReports) {
        const children = await getSubordinates(member._id);
        result.push({ ...member, subordinates: children });
      }
      return result;
    };

    const members = await getSubordinates(userId);

    // Contar totales por nivel
    const flatMembers = [];
    const flatten = (arr) => {
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

    res.json({ members, stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/networks/members/:id — Detalle de un miembro
exports.getNetworkMemberDetail = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id).select('-password');
    if (!member) {
      return res.status(404).json({ message: 'Miembro no encontrado' });
    }

    // Verificar que sea parte de mi red
    if (String(member.networkId) !== String(req.user.networkId) && String(member.parentUser) !== String(req.user._id)) {
      return res.status(403).json({ message: 'No tienes acceso a este miembro' });
    }

    // Estadísticas del miembro
    const [totalSales, pendingSales, totalClients] = await Promise.all([
      Sale.aggregate([
        { $match: { seller: member._id } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Sale.countDocuments({ seller: member._id, status: { $in: ['pendiente', 'vencido'] } }),
      require('../models/Client').countDocuments({ owner: member._id })
    ]);

    res.json({
      member,
      stats: {
        totalVendido: totalSales[0]?.total || 0,
        ventasPendientes: pendingSales,
        totalClientes: totalClients
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/networks/level-names — Actualizar nombres de niveles (solo empresarial)
exports.updateLevelNames = async (req, res, next) => {
  try {
    const network = await Network.findOne({ owner: req.user._id });
    if (!network) {
      return res.status(404).json({ message: 'No tienes una red' });
    }

    const { levelNames } = req.body;
    if (levelNames) {
      network.levelNames = { ...network.levelNames.toObject(), ...levelNames };
      await network.save();
    }

    res.json({ network });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/networks/members/:id — Eliminar miembro de la red
exports.removeMember = async (req, res, next) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Miembro no encontrado' });
    }

    // Verificar deudas pendientes
    const pendingDebts = await Sale.countDocuments({
      buyer: member._id,
      status: { $in: ['pendiente', 'vencido'] }
    });

    if (pendingDebts > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar: tiene deudas pendientes'
      });
    }

    // Los subordinados del eliminado quedan como independientes
    await User.updateMany(
      { parentUser: member._id },
      { parentUser: null, networkId: null, isIndependent: true }
    );

    // El miembro queda como independiente
    member.parentUser = null;
    member.networkId = null;
    member.isIndependent = true;
    member.role = 'emprendedor';
    await member.save();

    res.json({ message: 'Miembro removido de la red' });
  } catch (error) {
    next(error);
  }
};
