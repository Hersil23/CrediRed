const checkStatus = async (req, res, next) => {
  const user = req.user;

  // Superadmin siempre tiene acceso
  if (user.role === 'superadmin') return next();

  // Verificar si el trial expiró
  if (user.status === 'trial' && user.trialEndsAt && new Date() > user.trialEndsAt) {
    user.status = 'expired';
    await user.save();
    return res.status(403).json({
      message: 'Tu período de prueba ha expirado',
      code: 'TRIAL_EXPIRED'
    });
  }

  if (user.status === 'expired') {
    return res.status(403).json({
      message: 'Tu suscripción ha expirado',
      code: 'SUBSCRIPTION_EXPIRED'
    });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({
      message: 'Tu cuenta ha sido bloqueada',
      code: 'ACCOUNT_BLOCKED'
    });
  }

  next();
};

module.exports = checkStatus;
