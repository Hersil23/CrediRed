const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Conectar a MongoDB
connectDB();

// Seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: { message: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos' }
});
app.use('/api/', limiter);

// Rate limit más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Demasiados intentos, intenta de nuevo en 15 minutos' }
});

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Ruta de salud
app.get('/', (req, res) => {
  res.json({ message: 'CrediRed API funcionando', version: '1.0.0' });
});

// Ruta de tasas de cambio (pública)
const { getRates } = require('./utils/exchangeRate');
app.get('/api/exchange-rates', async (req, res) => {
  try {
    const rates = await getRates();
    res.json({ rates });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tasas de cambio' });
  }
});

// Rutas
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/networks', require('./routes/networks'));
app.use('/api/products', require('./routes/products'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Error handler global
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
