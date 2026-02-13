const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: 0
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  networkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Network',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
