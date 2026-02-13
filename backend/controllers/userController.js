const User = require('../models/User');
const Sale = require('../models/Sale');

// GET /api/users — Superadmin: listar todos los usuarios
exports.getAllUsers = async (req, res, next) => {
  try {
    const { status, role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter)
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('networkId');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile — Actualizar perfil propio
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, email, preferredCurrency, defaultCreditTerm } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Ese correo ya está en uso' });
      user.email = email;
    }
    if (preferredCurrency) user.preferredCurrency = preferredCurrency;
    if (defaultCreditTerm) user.defaultCreditTerm = defaultCreditTerm;

    await user.save();
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/password — Cambiar contraseña
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/whatsapp-templates — Actualizar plantillas WhatsApp
exports.updateWhatsappTemplates = async (req, res, next) => {
  try {
    const user = req.user;
    const templates = req.body.templates;

    if (templates) {
      user.whatsappTemplates = { ...user.whatsappTemplates.toObject(), ...templates };
      await user.save();
    }

    res.json({ whatsappTemplates: user.whatsappTemplates });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/block — Superadmin: bloquear usuario
exports.blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.status = 'blocked';
    await user.save();

    res.json({ message: 'Usuario bloqueado', user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/unblock — Superadmin: desbloquear usuario
exports.unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Restaurar a active o trial según corresponda
    if (user.subscription && user.subscription.endDate && new Date() < user.subscription.endDate) {
      user.status = 'active';
    } else if (user.trialEndsAt && new Date() < user.trialEndsAt) {
      user.status = 'trial';
    } else {
      user.status = 'expired';
    }
    await user.save();

    res.json({ message: 'Usuario desbloqueado', user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/subscription — Superadmin: activar suscripción
exports.activateSubscription = async (req, res, next) => {
  try {
    const { months = 1 } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    user.subscription = { startDate, endDate };
    user.status = 'active';
    await user.save();

    res.json({ message: `Suscripción activada por ${months} mes(es)`, user });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id — Superadmin: eliminar usuario
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Verificar deudas pendientes
    const pendingDebts = await Sale.countDocuments({
      $or: [
        { buyer: user._id, status: 'pendiente' },
        { buyer: user._id, status: 'vencido' }
      ]
    });

    if (pendingDebts > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar: el usuario tiene deudas pendientes'
      });
    }

    // Los subordinados quedan como independientes
    await User.updateMany(
      { parentUser: user._id },
      { parentUser: null, networkId: null, isIndependent: true }
    );

    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
};
