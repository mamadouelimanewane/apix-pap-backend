import express from 'express';
import PAP from '../models/PAP.model.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Middleware
router.use(authenticate);

// GET /api/pap/list
router.get('/list', asyncHandler(async (req, res) => {
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
}));

// GET /api/pap/:papCode
router.get('/:papCode', asyncHandler(async (req, res) => {
  const pap = await PAP.findOne({ papCode: req.params.papCode });

  if (!pap) {
    throw new ApiError(404, 'PAP not found');
  }

  res.json({
    success: true,
    data: pap
  });
}));

// POST /api/pap/create
router.post('/create', authorize(['admin', 'chef_projet', 'gestionnaire']), asyncHandler(async (req, res) => {
  const { nom, prenom, dateNaissance, zone, secteur, email, telephone } = req.body;

  if (!nom || !zone) {
    throw new ApiError(400, 'Nom and zone are required');
  }

  const pap = new PAP({
    nom,
    prenom,
    dateNaissance,
    zone,
    secteur,
    email,
    telephone,
    createdBy: req.user.id
  });

  await pap.save();

  res.status(201).json({
    success: true,
    message: 'PAP created successfully',
    data: pap
  });
}));

// PUT /api/pap/:papCode
router.put('/:papCode', authorize(['admin', 'chef_projet', 'gestionnaire']), asyncHandler(async (req, res) => {
  const { nom, prenom, zone, secteur, status, notes } = req.body;

  const pap = await PAP.findOne({ papCode: req.params.papCode });
  if (!pap) {
    throw new ApiError(404, 'PAP not found');
  }

  // Update fields
  if (nom) pap.nom = nom;
  if (prenom) pap.prenom = prenom;
  if (zone) pap.zone = zone;
  if (secteur) pap.secteur = secteur;
  if (status) pap.status = status;
  if (notes) pap.notes = notes;

  pap.lastUpdatedBy = req.user.id;
  await pap.save();

  res.json({
    success: true,
    message: 'PAP updated successfully',
    data: pap
  });
}));

// GET /api/pap/search
router.get('/search', asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    throw new ApiError(400, 'Search query must be at least 2 characters');
  }

  const paps = await PAP.find({
    $or: [
      { papCode: new RegExp(q, 'i') },
      { nom: new RegExp(q, 'i') },
      { prenom: new RegExp(q, 'i') }
    ]
  }).limit(20);

  res.json({
    success: true,
    data: paps
  });
}));

export default router;
