import mongoose from 'mongoose';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

// Modèle Message temporaire
const MessageSchema = new mongoose.Schema({
  messageCode: { type: String, unique: true, required: true },
  papCode: { type: String, index: true },
  fromUser: { type: String, required: true },
  toUser: { type: String, required: true },
  subject: String,
  content: { type: String, required: true },
  type: { type: String, enum: ['message', 'notification', 'alert'], default: 'message' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  attachments: [String],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

MessageSchema.pre('save', async function (next) {
  if (!this.messageCode) {
    const count = await this.constructor.countDocuments();
    this.messageCode = `MSG-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Message = mongoose.model('Message', MessageSchema);

export const communicationController = {
  // Lister les messages d'un utilisateur
  listMessages: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { page = 1, limit = 20, isRead, type } = req.query;
    const userId = req.user.id || req.user.email;

    const query = { toUser: userId };
    if (papCode) query.papCode = papCode;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (type) query.type = type;

    const skip = (page - 1) * limit;
    const messages = await Message.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .sort({ createdAt: -1 });

    const total = await Message.countDocuments(query);
    const unreadCount = await Message.countDocuments({ ...query, isRead: false });

    res.json({
      success: true,
      data: messages,
      stats: { unreadCount, total },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }),

  // Obtenir les détails d'un message
  getMessageById: asyncHandler(async (req, res) => {
    const message = await Message.findOne({ messageCode: req.params.messageCode })
      .select('-__v');

    if (!message) {
      throw new ApiError(404, `Message ${req.params.messageCode} non trouvé`);
    }

    // Marquer comme lu
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({
      success: true,
      data: message
    });
  }),

  // Envoyer un message
  sendMessage: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { toUser, subject, content, type, priority, attachments } = req.body;

    if (!toUser || !content) {
      throw new ApiError(400, 'Destinataire et contenu sont obligatoires');
    }

    const message = new Message({
      papCode,
      fromUser: req.user.nom || req.user.email,
      toUser,
      subject: subject || 'Sans sujet',
      content,
      type: type || 'message',
      priority: priority || 'medium',
      attachments: attachments || [],
      isRead: false
    });

    await message.save();

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: message
    });
  }),

  // Marquer un message comme lu
  markAsRead: asyncHandler(async (req, res) => {
    const { messageCode } = req.params;

    const message = await Message.findOne({ messageCode });
    if (!message) {
      throw new ApiError(404, `Message ${messageCode} non trouvé`);
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message marqué comme lu',
      data: message
    });
  }),

  // Supprimer un message
  deleteMessage: asyncHandler(async (req, res) => {
    const { messageCode } = req.params;

    const message = await Message.findOne({ messageCode });
    if (!message) {
      throw new ApiError(404, `Message ${messageCode} non trouvé`);
    }

    await Message.deleteOne({ messageCode });

    res.json({
      success: true,
      message: 'Message supprimé avec succès'
    });
  }),

  // Obtenir les notifications
  getNotifications: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { limit = 10, priority } = req.query;
    const userId = req.user.id || req.user.email;

    const query = {
      toUser: userId,
      type: 'notification'
    };
    if (papCode) query.papCode = papCode;
    if (priority) query.priority = priority;

    const notifications = await Message.find(query)
      .limit(parseInt(limit))
      .select('-__v')
      .sort({ createdAt: -1 });

    const stats = await Message.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: notifications,
      stats
    });
  }),

  // Créer une notification
  createNotification: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { toUser, subject, content, priority } = req.body;

    if (!toUser || !content) {
      throw new ApiError(400, 'Destinataire et contenu sont obligatoires');
    }

    const notification = new Message({
      papCode,
      fromUser: 'SYSTEM',
      toUser,
      subject: subject || 'Notification',
      content,
      type: 'notification',
      priority: priority || 'medium',
      isRead: false
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification créée avec succès',
      data: notification
    });
  }),

  // Statistiques de communication
  getCommunicationStats: asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.email;

    const stats = await Message.aggregate([
      { $match: { toUser: userId } },
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ],
          unread: [
            { $match: { isRead: false } },
            { $count: 'count' }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byType: stats[0].byType,
        byPriority: stats[0].byPriority,
        unreadCount: stats[0].unread[0]?.count || 0,
        totalCount: stats[0].total[0]?.count || 0
      }
    });
  })
};

export default communicationController;
