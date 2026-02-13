const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  cedula: {
    type: String,
    required: [true, 'La cédula es obligatoria'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Cédula única por owner
clientSchema.index({ cedula: 1, owner: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);
