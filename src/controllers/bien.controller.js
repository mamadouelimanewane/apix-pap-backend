import Bien from '../models/Bien.model.js';
import PAP from '../models/PAP.model.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

export const bienController = {
  // Lister les biens d'un PAP
  listBiensByPAP: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { page = 1, limit = 20, type, status } = req.query;

    // Vérifier que le PAP existe
    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const query = { papCode };
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const biens = await Bien.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .sort({ createdAt: -1 });

    const total = await Bien.countDocuments(query);

    res.json({
      success: true,
      data: biens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }),

  // Obtenir les détails d'un bien
  getBienById: asyncHandler(async (req, res) => {
    const bien = await Bien.findOne({ bienCode: req.params.bienCode })
      .populate('evaluation')
      .select('-__v');

    if (!bien) {
      throw new ApiError(404, `Bien ${req.params.bienCode} non trouvé`);
    }

    res.json({
      success: true,
      data: bien
    });
  }),

  // Créer un nouveau bien pour un PAP
  createBien: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { type, adresse, zone, superficie, description, photos } = req.body;

    // Vérifier que le PAP existe
    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    if (!type || !superficie) {
      throw new ApiError(400, 'Type et superficie sont obligatoires');
    }

    const bien = new Bien({
      papCode,
      type,
      adresse: adresse || `Bien non nommé`,
      zone: zone || pap.zone,
      superficie,
      description,
      photos,
      createdBy: req.user.id,
      status: 'non_evaluated'
    });

    await bien.save();

    // Mettre à jour le nombre de propriétés du PAP
    pap.numberOfProperties = (pap.numberOfProperties || 0) + 1;
    await pap.save();

    res.status(201).json({
      success: true,
      message: 'Bien créé avec succès',
      data: bien
    });
  }),

  // Mettre à jour un bien
  updateBien: asyncHandler(async (req, res) => {
    const { type, adresse, zone, superficie, description, photos, status, notes } = req.body;

    const bien = await Bien.findOne({ bienCode: req.params.bienCode });
    if (!bien) {
      throw new ApiError(404, `Bien ${req.params.bienCode} non trouvé`);
    }

    if (type) bien.type = type;
    if (adresse) bien.adresse = adresse;
    if (zone) bien.zone = zone;
    if (superficie) bien.superficie = superficie;
    if (description) bien.description = description;
    if (photos) bien.photos = photos;
    if (status) bien.status = status;
    if (notes) bien.notes = notes;

    await bien.save();

    res.json({
      success: true,
      message: 'Bien mis à jour avec succès',
      data: bien
    });
  }),

  // Supprimer un bien
  deleteBien: asyncHandler(async (req, res) => {
    const bien = await Bien.findOne({ bienCode: req.params.bienCode });

    if (!bien) {
      throw new ApiError(404, `Bien ${req.params.bienCode} non trouvé`);
    }

    await Bien.deleteOne({ bienCode: req.params.bienCode });

    // Mettre à jour le nombre de propriétés du PAP
    const pap = await PAP.findOne({ papCode: bien.papCode });
    if (pap) {
      pap.numberOfProperties = Math.max(0, (pap.numberOfProperties || 1) - 1);
      await pap.save();
    }

    res.json({
      success: true,
      message: 'Bien supprimé avec succès'
    });
  }),

  // Obtenir les statistiques des biens
  getBienStats: asyncHandler(async (req, res) => {
    const { papCode } = req.params;

    // Vérifier que le PAP existe
    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const stats = await Bien.aggregate([
      { $match: { papCode } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const typeStats = await Bien.aggregate([
      { $match: { papCode } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSuperficie: { $sum: '$superficie' },
          avgValue: { $avg: '$estimatedValue' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = await Bien.countDocuments({ papCode });

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

export default bienController;
