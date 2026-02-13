import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['superadmin', 'empresarial', 'gerente', 'lider', 'distribuidor', 'emprendedor'],
    default: 'emprendedor'
  },
  status: {
    type: String,
    enum: ['active', 'trial', 'expired', 'blocked'],
    default: 'trial'
  },
  parentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  networkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Network',
    default: null
  },
  inviteCode: {
    type: String,
    unique: true
  },
  isIndependent: {
    type: Boolean,
    default: true
  },
  preferredCurrency: {
    type: String,
    enum: ['USD', 'COP', 'VES'],
    default: 'USD'
  },
  defaultCreditTerm: {
    unit: {
      type: String,
      enum: ['quincena', 'semana'],
      default: 'quincena'
    },
    quantity: {
      type: Number,
      default: 1
    }
  },
  subscription: {
    startDate: { type: Date },
    endDate: { type: Date }
  },
  trialEndsAt: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  whatsappTemplates: {
    ventaContado: {
      type: String,
      default: 'Hola {nombre}, gracias por tu compra en CrediRed. Detalle: {producto} x{cantidad} - ${monto}. Pago: Contado. Gracias por tu preferencia.'
    },
    ventaCredito: {
      type: String,
      default: 'Hola {nombre}, gracias por tu compra. Detalle: {producto} x{cantidad} - ${monto}. Plazo de pago: {fechaLimite}. Saldo pendiente: ${pendiente}. Cualquier duda estamos a la orden.'
    },
    abonoRecibido: {
      type: String,
      default: 'Hola {nombre}, se registró tu abono de ${monto}. Saldo restante: ${pendiente}. Fecha límite: {fechaLimite}. Gracias.'
    },
    deudaSaldada: {
      type: String,
      default: 'Hola {nombre}, tu deuda ha sido saldada por completo. Monto total pagado: ${monto}. Gracias por tu puntualidad.'
    },
    recordatorioCobro: {
      type: String,
      default: 'Hola {nombre}, te recordamos que tienes un saldo pendiente de ${monto} con vencimiento el {fechaLimite}. Agradecemos tu pronto pago.'
    },
    deudaVencida: {
      type: String,
      default: 'Hola {nombre}, tu deuda de ${monto} venció el {fechaLimite}. Por favor comunícate para coordinar el pago. Gracias.'
    }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.pre('save', function() {
  if (!this.inviteCode) {
    this.inviteCode = this._id.toString().slice(-6) + Math.random().toString(36).slice(2, 8);
  }
});

userSchema.pre('save', function() {
  if (this.isNew && this.status === 'trial' && !this.trialEndsAt) {
    this.trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
