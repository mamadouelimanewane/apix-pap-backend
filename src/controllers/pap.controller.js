import PAP from '../models/PAP.model.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

export const papController = {
  // Lister tous les PAPs avec filtres et pagination
  listPAPs: asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, zone, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (zone) query.zone = zone;
    if (search) {
      query.$or = [
        { papCode: new RegExp(search, 'i') },
        { nom: new RegExp(search, 'i') },
        { prenom: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;
    const paps = await PAP.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .sort({ createdAt: -1 });

    const total = await PAP.countDocuments(query);

    res.json({
      success: true,
      data: paps,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }),

  // Obtenir les détails d'un PAP
  getPAPById: asyncHandler(async (req, res) => {
    const pap = await PAP.findOne({ papCode: req.params.papCode }).select('-__v');

    if (!pap) {
      throw new ApiError(404, `PAP ${req.params.papCode} non trouvé`);
    }

    res.json({
      success: true,
      data: pap
    });
  }),

  // Créer un nouveau PAP
  createPAP: asyncHandler(async (req, res) => {
    const { nom, prenom, dateNaissance, zone, secteur, email, telephone, adresse } = req.body;

    if (!nom || !zone) {
      throw new ApiError(400, 'Nom et zone sont obligatoires');
    }

    const pap = new PAP({
      nom,
      prenom,
      dateNaissance,
      zone,
      secteur,
      email,
      telephone,
      adresse,
      createdBy: req.user.id,
      status: 'registered'
    });

    await pap.save();

    res.status(201).json({
      success: true,
      message: 'PAP créé avec succès',
      data: pap
    });
  }),

  // Mettre à jour un PAP
  updatePAP: asyncHandler(async (req, res) => {
    const { nom, prenom, zone, secteur, status, notes, adresse, telephone, email } = req.body;

    const pap = await PAP.findOne({ papCode: req.params.papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${req.params.papCode} non trouvé`);
    }

    // Mise à jour des champs
    if (nom) pap.nom = nom;
    if (prenom) pap.prenom = prenom;
    if (zone) pap.zone = zone;
    if (secteur) pap.secteur = secteur;
    if (status) pap.status = status;
    if (notes) pap.notes = notes;
    if (adresse) pap.adresse = adresse;
    if (telephone) pap.telephone = telephone;
    if (email) pap.email = email;

    pap.lastUpdatedBy = req.user.id;
    await pap.save();

    res.json({
      success: true,
      message: 'PAP mis à jour avec succès',
      data: pap
    });
  }),

  // Rechercher des PAPs
  searchPAPs: asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || q.length < 2) {
      throw new ApiError(400, 'Requête de recherche minimale 2 caractères');
    }

    const paps = await PAP.find({
      $or: [
        { papCode: new RegExp(q, 'i') },
        { nom: new RegExp(q, 'i') },
        { prenom: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { telephone: new RegExp(q, 'i') }
      ]
    })
      .select('-__v')
      .limit(20);

    res.json({
      success: true,
      data: paps
    });
  }),

  // Obtenir les statistiques des PAPs
  getPAPStats: asyncHandler(async (req, res) => {
    const stats = await PAP.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const zoneStats = await PAP.aggregate([
      {
        $group: {
          _id: '$zone',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const total = await PAP.countDocuments();

    res.json({
      success: true,
      data: {
        total,
        byStatus: stats,
        byZone: zoneStats
      }
    });
  }),

  // Supprimer un PAP (soft delete - marquer comme archivé)
  deletePAP: asyncHandler(async (req, res) => {
    const pap = await PAP.findOne({ papCode: req.params.papCode });

    if (!pap) {
      throw new ApiError(404, `PAP ${req.params.papCode} non trouvé`);
    }

    pap.status = 'closed';
    pap.lastUpdatedBy = req.user.id;
    await pap.save();

    res.json({
      success: true,
      message: 'PAP archivé avec succès',
      data: pap
    });
  })
};

export default papController;
