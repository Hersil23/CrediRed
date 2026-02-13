const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'El monto es obligatorio'],
    min: 0
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
