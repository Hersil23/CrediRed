const Client = require('../models/Client');
const User = require('../models/User');
const Sale = require('../models/Sale');

// POST /api/clients
exports.createClient = async (req, res, next) => {
  try {
    // Verificar límite de trial (máximo 6 clientes)
    if (req.user.status === 'trial') {
      const clientCount = await Client.countDocuments({ owner: req.user._id });
      if (clientCount >= 6) {
        return res.status(400).json({
          message: 'Límite de clientes alcanzado en período de prueba (máx. 6)',
          code: 'TRIAL_LIMIT'
        });
      }
    }

    const { name, cedula, phone } = req.body;

    const client = await Client.create({
      name,
      cedula,
      phone,
      owner: req.user._id
    });

    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
};

// GET /api/clients
exports.getMyClients = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = { owner: req.user._id };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cedula: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(filter).sort({ createdAt: -1 });
    res.json({ clients });
  } catch (error) {
    next(error);
  }
};

// GET /api/clients/:id
exports.getClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, owner: req.user._id });
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Historial de ventas del cliente
    const sales = await Sale.find({ client: client._id }).sort({ createdAt: -1 });

    res.json({ client, sales });
  } catch (error) {
    next(error);
  }
};

// PUT /api/clients/:id
exports.updateClient = async (req, res, next) => {
  try {
    const { name, cedula, phone } = req.body;
    const client = await Client.findOne({ _id: req.params.id, owner: req.user._id });

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    if (name) client.name = name;
    if (cedula) client.cedula = cedula;
    if (phone) client.phone = phone;

    await client.save();
    res.json({ client });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/clients/:id
exports.deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, owner: req.user._id });
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Verificar si tiene deudas pendientes
    const pendingSales = await Sale.countDocuments({
      client: client._id,
      status: { $in: ['pendiente', 'vencido'] }
    });

    if (pendingSales > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar: el cliente tiene deudas pendientes'
      });
    }

    await Client.findByIdAndDelete(client._id);
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    next(error);
  }
};
