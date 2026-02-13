const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');

// POST /api/products — Agregar producto al inventario
exports.createProduct = async (req, res, next) => {
  try {
    const { name, quantity, price } = req.body;

    const product = await Product.create({
      name,
      quantity,
      price,
      owner: req.user._id,
      networkId: req.user.networkId
    });

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products — Mis productos
exports.getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const { name, quantity, price } = req.body;
    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (name) product.name = name;
    if (quantity !== undefined) product.quantity = quantity;
    if (price !== undefined) product.price = price;

    await product.save();
    res.json({ product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/:id/assign — Asignar mercancía a alguien de la red
exports.assignProduct = async (req, res, next) => {
  try {
    const { buyerId, quantity, price } = req.body;

    const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'No tienes suficiente stock' });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer) {
      return res.status(404).json({ message: 'Usuario destino no encontrado' });
    }

    // Descontar del inventario del vendedor
    product.quantity -= quantity;
    await product.save();

    // Agregar al inventario del comprador (buscar si ya tiene ese producto)
    let buyerProduct = await Product.findOne({
      name: product.name,
      owner: buyerId,
      networkId: req.user.networkId
    });

    if (buyerProduct) {
      buyerProduct.quantity += quantity;
      buyerProduct.price = price || buyerProduct.price;
      await buyerProduct.save();
    } else {
      buyerProduct = await Product.create({
        name: product.name,
        quantity,
        price: price || product.price,
        owner: buyerId,
        networkId: req.user.networkId
      });
    }

    // Notificar al comprador
    await Notification.create({
      user: buyerId,
      type: 'new_merchandise',
      title: 'Mercancía asignada',
      message: `${req.user.name} te asignó ${quantity} unidad(es) de ${product.name}`,
      relatedUser: req.user._id
    });

    res.json({
      message: 'Mercancía asignada exitosamente',
      sellerProduct: product,
      buyerProduct
    });
  } catch (error) {
    next(error);
  }
};
