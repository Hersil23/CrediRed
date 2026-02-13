const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

const seedSuperadmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');

    const existing = await User.findOne({ role: 'superadmin' });
    if (existing) {
      console.log('Superadmin ya existe:', existing.email);
      process.exit(0);
    }

    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'admin@credired.app',
      phone: '+1234567890',
      password: 'admin123456',
      role: 'superadmin',
      status: 'active',
      isIndependent: false
    });

    console.log('Superadmin creado exitosamente:');
    console.log('  Email:', superadmin.email);
    console.log('  Password: admin123456');
    console.log('  IMPORTANTE: Cambiar la contraseña después del primer login');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedSuperadmin();
