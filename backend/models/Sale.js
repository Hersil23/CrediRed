const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    default: null
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: ['detal', 'red'],
    required: true
  },
  paymentType: {
    type: String,
    enum: ['contado', 'credito'],
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  creditTerm: {
    unit: {
      type: String,
      enum: ['quincena', 'semana']
    },
    quantity: Number,
    dueDate: Date
  },
  status: {
    type: String,
    enum: ['pendiente', 'saldado', 'vencido'],
    default: 'pendiente'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  networkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Network',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema);
