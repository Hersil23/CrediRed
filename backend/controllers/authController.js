const crypto = require('crypto');
const User = require('../models/User');
const Network = require('../models/Network');
const Notification = require('../models/Notification');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const { welcomeEmail, resetPasswordEmail, newNetworkMemberEmail } = require('../utils/emailTemplates');

const ROLE_HIERARCHY = {
  empresarial: 'gerente',
  gerente: 'lider',
  lider: 'distribuidor',
  distribuidor: 'emprendedor',
  emprendedor: 'emprendedor'
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, inviteCode } = req.body;

    // Verificar si ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Ya existe una cuenta con ese correo' });
    }

    let role = 'emprendedor';
    let parentUser = null;
    let networkId = null;
    let isIndependent = true;

    // Si viene con código de invitación
    if (inviteCode) {
      const inviter = await User.findOne({ inviteCode });
      if (!inviter) {
        return res.status(400).json({ message: 'Código de invitación inválido' });
      }

      // Verificar límite de invitaciones en trial
      if (inviter.status === 'trial') {
        const hierarchy = ['empresarial', 'gerente', 'lider', 'distribuidor'];
        if (hierarchy.includes(inviter.role)) {
          const inviteCount = await User.countDocuments({ parentUser: inviter._id });
          if (inviteCount >= 3) {
            return res.status(400).json({ message: 'Este usuario ha alcanzado el límite de invitaciones en trial' });
          }
        }
      }

      role = ROLE_HIERARCHY[inviter.role];
      parentUser = inviter._id;
      networkId = inviter.networkId;
      isIndependent = false;

      // Si el que invita es empresarial y no tiene red, algo está mal
      // Si el que invita es emprendedor independiente, el nuevo entra como emprendedor en la misma "no-red"
      if (inviter.isIndependent) {
        isIndependent = true;
        networkId = null;
      }
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      parentUser,
      networkId,
      isIndependent
    });

    // Si se registra como empresarial (registro libre, luego se promueve) — por ahora no aplica
    // Los empresariales se crean manualmente o por flujo especial

    // Notificar al que invitó
    if (parentUser) {
      await Notification.create({
        user: parentUser,
        type: 'new_member',
        title: 'Nuevo miembro en tu red',
        message: `${name} se unió a tu red`,
        relatedUser: user._id
      });

      // Email al sponsor
      try {
        const sponsor = await User.findById(parentUser);
        if (sponsor && sponsor.email) {
          const sponsorEmail = newNetworkMemberEmail({
            sponsorName: sponsor.name,
            newMemberName: name,
            newMemberRole: role
          });
          await sendEmail({ to: sponsor.email, ...sponsorEmail });
        }
      } catch (emailError) {
        console.error('Error enviando email al sponsor:', emailError.message);
      }
    }

    // Email de bienvenida
    try {
      const welcome = welcomeEmail({ name });
      await sendEmail({ to: email, ...welcome });
    } catch (emailError) {
      console.error('Error enviando email de bienvenida:', emailError.message);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isIndependent: user.isIndependent,
        inviteCode: user.inviteCode,
        trialEndsAt: user.trialEndsAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Verificar si el trial expiró
    if (user.status === 'trial' && user.trialEndsAt && new Date() > user.trialEndsAt) {
      user.status = 'expired';
      await user.save();
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Tu cuenta ha sido bloqueada' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isIndependent: user.isIndependent,
        networkId: user.networkId,
        inviteCode: user.inviteCode,
        preferredCurrency: user.preferredCurrency,
        trialEndsAt: user.trialEndsAt,
        subscription: user.subscription
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('networkId');
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No existe una cuenta con ese correo' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutos
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      const resetEmail = resetPasswordEmail({ name: user.name, resetUrl });
      await sendEmail({ to: user.email, ...resetEmail });

      res.json({ message: 'Se envió un correo con las instrucciones' });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Error al enviar el correo' });
    }
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({ token, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
};
