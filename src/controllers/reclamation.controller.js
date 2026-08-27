import mongoose from 'mongoose';
import PAP from '../models/PAP.model.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

// Modèle Reclamation temporaire (avant création de model complet)
const ReclamationSchema = new mongoose.Schema({
  reclamationCode: { type: String, unique: true, required: true },
  papCode: { type: String, required: true, index: true },
  type: { type: String, enum: ['evaluation', 'compensation', 'payment', 'autre'], required: true },
  subject: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['pending', 'reviewing', 'resolved', 'rejected'], default: 'pending', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  createdBy: mongoose.Schema.Types.ObjectId,
  reviewedBy: mongoose.Schema.Types.ObjectId,
  resolution: String,
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date
}, { timestamps: true });

ReclamationSchema.pre('save', async function (next) {
  if (!this.reclamationCode) {
    const count = await this.constructor.countDocuments({ papCode: this.papCode });
    this.reclamationCode = `REC-${this.papCode}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

const Reclamation = mongoose.model('Reclamation', ReclamationSchema);

export const reclamationController = {
  // Lister les réclamations d'un PAP
  listReclamationsByPAP: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { page = 1, limit = 20, status, type, priority } = req.query;

    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const query = { papCode };
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;
    const reclamations = await Reclamation.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .sort({ createdAt: -1 });

    const total = await Reclamation.countDocuments(query);

    res.json({
      success: true,
      data: reclamations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }),

  // Obtenir les détails d'une réclamation
  getReclamationById: asyncHandler(async (req, res) => {
    const reclamation = await Reclamation.findOne({ reclamationCode: req.params.reclamationCode })
      .select('-__v');

    if (!reclamation) {
      throw new ApiError(404, `Réclamation ${req.params.reclamationCode} non trouvée`);
    }

    res.json({
      success: true,
      data: reclamation
    });
  }),

  // Créer une réclamation
  createReclamation: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { type, subject, description, priority } = req.body;

    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    if (!type || !subject) {
      throw new ApiError(400, 'Type et sujet sont obligatoires');
    }

    const reclamation = new Reclamation({
      papCode,
      type,
      subject,
      description,
      priority: priority || 'medium',
      status: 'pending',
      createdBy: req.user.id
    });

    await reclamation.save();

    // Mettre à jour le PAP - phase 5 (Réclamations)
    pap.workflowPhase = 5;
    await pap.save();

    res.status(201).json({
      success: true,
      message: 'Réclamation créée avec succès',
      data: reclamation
    });
  }),

  // Examiner une réclamation
  reviewReclamation: asyncHandler(async (req, res) => {
    const { reclamationCode } = req.params;
    const { notes } = req.body;

    const reclamation = await Reclamation.findOne({ reclamationCode });
    if (!reclamation) {
      throw new ApiError(404, `Réclamation ${reclamationCode} non trouvée`);
    }

    if (reclamation.status !== 'pending') {
      throw new ApiError(400, 'Seules les réclamations en attente peuvent être examinées');
    }

    reclamation.status = 'reviewing';
    reclamation.reviewedBy = req.user.id;
    if (notes) reclamation.resolution = notes;

    await reclamation.save();

    res.json({
      success: true,
      message: 'Réclamation en cours d\'examen',
      data: reclamation
    });
  }),

  // Résoudre une réclamation
  resolveReclamation: asyncHandler(async (req, res) => {
    const { reclamationCode } = req.params;
    const { resolution } = req.body;

    const reclamation = await Reclamation.findOne({ reclamationCode });
    if (!reclamation) {
      throw new ApiError(404, `Réclamation ${reclamationCode} non trouvée`);
    }

    if (!resolution) {
      throw new ApiError(400, 'La résolution est obligatoire');
    }

    reclamation.status = 'resolved';
    reclamation.resolution = resolution;
    reclamation.reviewedBy = req.user.id;
    reclamation.resolvedAt = new Date();

    await reclamation.save();

    res.json({
      success: true,
      message: 'Réclamation résolue avec succès',
      data: reclamation
    });
  }),

  // Rejeter une réclamation
  rejectReclamation: asyncHandler(async (req, res) => {
    const { reclamationCode } = req.params;
    const { reason } = req.body;

    const reclamation = await Reclamation.findOne({ reclamationCode });
    if (!reclamation) {
      throw new ApiError(404, `Réclamation ${reclamationCode} non trouvée`);
    }

    reclamation.status = 'rejected';
    reclamation.resolution = reason || 'Réclamation rejetée';
    reclamation.reviewedBy = req.user.id;
    reclamation.resolvedAt = new Date();

    await reclamation.save();

    res.json({
      success: true,
      message: 'Réclamation rejetée',
      data: reclamation
    });
  }),

  // Statistiques des réclamations
  getReclamationStats: asyncHandler(async (req, res) => {
    const { papCode } = req.params;

    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const stats = await Reclamation.aggregate([
      { $match: { papCode } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const typeStats = await Reclamation.aggregate([
      { $match: { papCode } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Reclamation.countDocuments({ papCode });

    res.json({
      success: true,
      data: {
        total,
        byStatus: stats,
        byType: typeStats
      }
    });
  })
};

export default reclamationController;
