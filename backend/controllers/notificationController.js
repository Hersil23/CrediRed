const Notification = require('../models/Notification');

// GET /api/notifications
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: req.user._id })
        .populate('relatedUser', 'name role')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Notification.countDocuments({ user: req.user._id }),
      Notification.countDocuments({ user: req.user._id, read: false })
    ]);

    res.json({
      notifications,
      unreadCount,
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

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    res.json({ notification });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    next(error);
  }
};
