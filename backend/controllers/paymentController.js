const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const User = require('../models/User');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const { toUSD } = require('../utils/exchangeRate');
const sendEmail = require('../utils/sendEmail');
const { paymentReceivedEmail, debtSettledEmail } = require('../utils/emailTemplates');

// POST /api/payments
exports.createPayment = async (req, res, next) => {
  try {
    const { saleId, amount, currency } = req.body;

    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Convertir a USD
    const amountUSD = await toUSD(amount, currency || 'USD');

    const remaining = sale.totalAmount - sale.paidAmount;
    if (amountUSD > remaining + 0.01) {
      return res.status(400).json({
        message: `El monto excede la deuda pendiente ($${remaining.toFixed(2)} USD)`
      });
    }

    const payment = await Payment.create({
      sale: sale._id,
      amount: amountUSD,
      paidBy: sale.buyer || sale.client,
      registeredBy: req.user._id
    });

    // Actualizar monto pagado en la venta
    sale.paidAmount += amountUSD;

    // Si pagó todo, marcar como saldado
    if (sale.paidAmount >= sale.totalAmount - 0.01) {
      sale.paidAmount = sale.totalAmount;
      sale.status = 'saldado';
    }

    await sale.save();

    // Notificar al vendedor si no es él quien registra
    if (String(sale.seller) !== String(req.user._id)) {
      await Notification.create({
        user: sale.seller,
        type: 'payment_received',
        title: 'Abono recibido',
        message: `Se registró un abono de $${amountUSD.toFixed(2)} USD`,
        relatedSale: sale._id
      });
    }

    // Email al vendedor
    try {
      const seller = await User.findById(sale.seller);
      if (seller && seller.email) {
        const remaining = sale.totalAmount - sale.paidAmount;

        if (sale.status === 'saldado') {
          // Obtener nombre del cliente/comprador
          let clientOrBuyerName = 'Cliente';
          if (sale.buyer) {
            const buyer = await User.findById(sale.buyer);
            if (buyer) clientOrBuyerName = buyer.name;
          } else if (sale.client) {
            const client = await Client.findById(sale.client);
            if (client) clientOrBuyerName = client.name;
          }

          const settledEmail = debtSettledEmail({
            sellerName: seller.name,
            totalAmount: sale.totalAmount,
            clientOrBuyerName
          });
          await sendEmail({ to: seller.email, ...settledEmail });
        } else {
          const payEmail = paymentReceivedEmail({
            sellerName: seller.name,
            amount: amountUSD,
            totalAmount: sale.totalAmount,
            paidAmount: sale.paidAmount,
            remaining
          });
          await sendEmail({ to: seller.email, ...payEmail });
        }
      }
    } catch (emailError) {
      console.error('Error enviando email de pago:', emailError.message);
    }

    res.status(201).json({
      payment,
      sale: {
        id: sale._id,
        totalAmount: sale.totalAmount,
        paidAmount: sale.paidAmount,
        remaining: sale.totalAmount - sale.paidAmount,
        status: sale.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/sale/:saleId — Historial de pagos de una venta
exports.getPaymentsBySale = async (req, res, next) => {
  try {
    const payments = await Payment.find({ sale: req.params.saleId })
      .populate('registeredBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments — Todos mis pagos recibidos
exports.getMyPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Obtener IDs de mis ventas
    const mySales = await Sale.find({ seller: req.user._id }).select('_id');
    const saleIds = mySales.map(s => s._id);

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find({ sale: { $in: saleIds } })
        .populate('sale', 'totalAmount paidAmount status type')
        .populate('registeredBy', 'name')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Payment.countDocuments({ sale: { $in: saleIds } })
    ]);

    res.json({
      payments,
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
