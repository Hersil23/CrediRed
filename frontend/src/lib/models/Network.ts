import mongoose from 'mongoose';

const networkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la red es obligatorio'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  levelNames: {
    level1: { type: String, default: 'Empresarial' },
    level2: { type: String, default: 'Gerente' },
    level3: { type: String, default: 'Líder' },
    level4: { type: String, default: 'Distribuidor' },
    level5: { type: String, default: 'Emprendedor' }
  }
}, {
  timestamps: true
});

export default mongoose.models.Network || mongoose.model('Network', networkSchema);
