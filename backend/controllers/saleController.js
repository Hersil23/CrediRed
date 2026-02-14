const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Client = require('../models/Client');
const User = require('../models/User');
const Notification = require('../models/Notification');
const calculateDueDate = require('../utils/calculateDueDate');
const { toUSD } = require('../utils/exchangeRate');
const sendEmail = require('../utils/sendEmail');
const { saleConfirmationEmail, networkSaleEmail } = require('../utils/emailTemplates');

// POST /api/sales
exports.createSale = async (req, res, next) => {
  try {
    const {
      type, // detal | red
      paymentType, // contado | credito
      clientId, // para detal
      buyerId, // para red
      items, // [{ productId, quantity, unitPrice }]
      currency, // moneda en que se ingresa
      creditTerm // { unit, quantity } - solo para crédito
    } = req.body;

    // Validar tipo
    if (type === 'detal' && !clientId) {
      return res.status(400).json({ message: 'Debe seleccionar un cliente' });
    }
    if (type === 'red' && !buyerId) {
      return res.status(400).json({ message: 'Debe seleccionar un miembro de la red' });
    }

    // Procesar items: verificar stock y convertir precios a USD
    const saleItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, owner: req.user._id });
      if (!product) {
        return res.status(404).json({ message: `Producto no encontrado: ${item.productId}` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({ message: `Stock insuficiente de ${product.name}` });
      }

      // Convertir precio a USD
      const unitPriceUSD = await toUSD(item.unitPrice, currency || 'USD');
      const itemTotal = unitPriceUSD * item.quantity;

      saleItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: unitPriceUSD
      });

      totalAmount += itemTotal;

      // Descontar inventario
      product.quantity -= item.quantity;
      await product.save();
    }

    // Calcular fecha de vencimiento si es crédito
    let creditData = {};
    if (paymentType === 'credito') {
      const term = creditTerm || req.user.defaultCreditTerm;
      creditData = {
        unit: term.unit,
        quantity: term.quantity,
        dueDate: calculateDueDate(term.unit, term.quantity)
      };
    }

    const sale = await Sale.create({
      seller: req.user._id,
      client: type === 'detal' ? clientId : undefined,
      buyer: type === 'red' ? buyerId : undefined,
      type,
      paymentType,
      items: saleItems,
      totalAmount,
      creditTerm: paymentType === 'credito' ? creditData : undefined,
      status: paymentType === 'contado' ? 'saldado' : 'pendiente',
      paidAmount: paymentType === 'contado' ? totalAmount : 0,
      networkId: req.user.networkId
    });

    // Si es venta de red, agregar inventario al comprador
    if (type === 'red') {
      for (const item of saleItems) {
        let buyerProduct = await Product.findOne({
          name: item.productName,
          owner: buyerId,
          networkId: req.user.networkId
        });

        if (buyerProduct) {
          buyerProduct.quantity += item.quantity;
          await buyerProduct.save();
        } else {
          await Product.create({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice,
            owner: buyerId,
            networkId: req.user.networkId
          });
        }
      }

      // Notificar al comprador
      await Notification.create({
        user: buyerId,
        type: 'new_merchandise',
        title: 'Mercancía recibida',
        message: `${req.user.name} te asignó mercancía por $${totalAmount.toFixed(2)}`,
        relatedSale: sale._id,
        relatedUser: req.user._id
      });

      // Email al comprador de red
      try {
        const buyer = await User.findById(buyerId);
        if (buyer && buyer.email) {
          const netEmail = networkSaleEmail({
            buyerName: buyer.name,
            sellerName: req.user.name,
            items: saleItems,
            totalAmount,
            paymentType,
            creditTerm: paymentType === 'credito' ? creditData : undefined
          });
          await sendEmail({ to: buyer.email, ...netEmail });
        }
      } catch (emailError) {
        console.error('Error enviando email de mercancía al comprador:', emailError.message);
      }
    }

    // Email de confirmación al vendedor
    try {
      let clientOrBuyerName = '';
      if (type === 'detal' && clientId) {
        const client = await Client.findById(clientId);
        clientOrBuyerName = client ? client.name : 'Cliente';
      } else if (type === 'red' && buyerId) {
        const buyer = await User.findById(buyerId);
        clientOrBuyerName = buyer ? buyer.name : 'Comprador';
      }

      const saleEmail = saleConfirmationEmail({
        sellerName: req.user.name,
        clientOrBuyerName,
        type,
        paymentType,
        items: saleItems,
        totalAmount,
        creditTerm: paymentType === 'credito' ? creditData : undefined
      });
      await sendEmail({ to: req.user.email, ...saleEmail });
    } catch (emailError) {
      console.error('Error enviando email de confirmación de venta:', emailError.message);
    }

    res.status(201).json({ sale });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales
exports.getMySales = async (req, res, next) => {
  try {
    const { type, status, paymentType, page = 1, limit = 20 } = req.query;
    const filter = { seller: req.user._id };

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (paymentType) filter.paymentType = paymentType;

    // Actualizar ventas vencidas
    await Sale.updateMany(
      {
        seller: req.user._id,
        status: 'pendiente',
        'creditTerm.dueDate': { $lt: new Date() }
      },
      { status: 'vencido' }
    );

    const skip = (page - 1) * limit;
    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('client', 'name cedula phone')
        .populate('buyer', 'name phone role')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Sale.countDocuments(filter)
    ]);

    res.json({
      sales,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales/:id
exports.getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('client', 'name cedula phone')
      .populate('buyer', 'name phone role')
      .populate('seller', 'name phone');

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    res.json({ sale });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales/collections — Cobros pendientes
exports.getPendingCollections = async (req, res, next) => {
  try {
    // Actualizar ventas vencidas primero
    await Sale.updateMany(
      {
        seller: req.user._id,
        status: 'pendiente',
        'creditTerm.dueDate': { $lt: new Date() }
      },
      { status: 'vencido' }
    );

    const sales = await Sale.find({
      seller: req.user._id,
      paymentType: 'credito',
      status: { $in: ['pendiente', 'vencido'] }
    })
      .populate('client', 'name cedula phone')
      .populate('buyer', 'name phone role')
      .sort({ 'creditTerm.dueDate': 1 });

    const summary = {
      totalPorCobrar: sales.reduce((sum, s) => sum + (s.totalAmount - s.paidAmount), 0),
      pendientes: sales.filter(s => s.status === 'pendiente').length,
      vencidas: sales.filter(s => s.status === 'vencido').length
    };

    res.json({ sales, summary });
  } catch (error) {
    next(error);
  }
};
