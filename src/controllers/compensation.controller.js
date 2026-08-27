import Compensation from '../models/Compensation.model.js';
import Bien from '../models/Bien.model.js';
import Evaluation from '../models/Evaluation.model.js';
import PAP from '../models/PAP.model.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

export const compensationController = {
  // Lister les compensations d'un PAP
  listCompensationsByPAP: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    // Vérifier que le PAP existe
    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const query = { papCode };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const compensations = await Compensation.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .sort({ proposalDate: -1 });

    const total = await Compensation.countDocuments(query);

    res.json({
      success: true,
      data: compensations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }),

  // Obtenir les détails d'une compensation
  getCompensationById: asyncHandler(async (req, res) => {
    const compensation = await Compensation.findOne({ compensationCode: req.params.compensationCode })
      .select('-__v');

    if (!compensation) {
      throw new ApiError(404, `Compensation ${req.params.compensationCode} non trouvée`);
    }

    res.json({
      success: true,
      data: compensation
    });
  }),

  // Proposer une compensation pour un bien
  proposeCompensation: asyncHandler(async (req, res) => {
    const { bienCode, papCode } = req.params;
    const { proposedAmount, notes } = req.body;

    // Vérifier que le bien existe et est évalué
    const bien = await Bien.findOne({ bienCode });
    if (!bien) {
      throw new ApiError(404, `Bien ${bienCode} non trouvé`);
    }

    if (bien.status !== 'evaluated') {
      throw new ApiError(400, 'Le bien doit être évalué avant de proposer une compensation');
    }

    if (!proposedAmount) {
      throw new ApiError(400, 'Le montant proposé est obligatoire');
    }

    // Vérifier que l'évaluation existe
    const evaluation = await Evaluation.findOne({ bienCode });
    if (!evaluation) {
      throw new ApiError(404, 'Pas d\'évaluation trouvée pour ce bien');
    }

    const compensation = new Compensation({
      papCode,
      bienCode,
      evaluatedValue: evaluation.estimatedValue,
      proposedAmount,
      status: 'proposed',
      proposalDate: new Date(),
      currency: 'XOF',
      notes,
      createdBy: req.user.id
    });

    await compensation.save();

    // Mettre à jour le bien
    bien.status = 'compensated';
    await bien.save();

    res.status(201).json({
      success: true,
      message: 'Compensation proposée avec succès',
      data: compensation
    });
  }),

  // Approuver une compensation
  approveCompensation: asyncHandler(async (req, res) => {
    const { approvedAmount, notes } = req.body;

    const compensation = await Compensation.findOne({ compensationCode: req.params.compensationCode });
    if (!compensation) {
      throw new ApiError(404, `Compensation ${req.params.compensationCode} non trouvée`);
    }

    if (compensation.status !== 'proposed' && compensation.status !== 'reviewed') {
      throw new ApiError(400, 'Seules les compensations proposées ou examinées peuvent être approuvées');
    }

    if (!approvedAmount) {
      throw new ApiError(400, 'Le montant approuvé est obligatoire');
    }

    compensation.status = 'approved';
    compensation.approvedAmount = approvedAmount;
    compensation.approvalDate = new Date();
    compensation.approvedBy = req.user.id;
    if (notes) compensation.notes = notes;

    await compensation.save();

    // Mettre à jour le PAP - phase 3 (Compensation)
    const pap = await PAP.findOne({ papCode: compensation.papCode });
    if (pap) {
      pap.workflowPhase = 3;
      pap.estimatedCompensation = (pap.estimatedCompensation || 0) + approvedAmount;
      await pap.save();
    }

    res.json({
      success: true,
      message: 'Compensation approuvée avec succès',
      data: compensation
    });
  }),

  // Examiner une compensation
  reviewCompensation: asyncHandler(async (req, res) => {
    const { reviewedAmount, notes } = req.body;

    const compensation = await Compensation.findOne({ compensationCode: req.params.compensationCode });
    if (!compensation) {
      throw new ApiError(404, `Compensation ${req.params.compensationCode} non trouvée`);
    }

    if (compensation.status !== 'proposed') {
      throw new ApiError(400, 'Seules les compensations proposées peuvent être examinées');
    }

    compensation.status = 'reviewed';
    if (reviewedAmount) compensation.proposedAmount = reviewedAmount;
    compensation.reviewDate = new Date();
    compensation.reviewedBy = req.user.id;
    if (notes) compensation.notes = notes;

    await compensation.save();

    res.json({
      success: true,
      message: 'Compensation examinée avec succès',
      data: compensation
    });
  }),

  // Rejeter une compensation
  rejectCompensation: asyncHandler(async (req, res) => {
    const { notes } = req.body;

    const compensation = await Compensation.findOne({ compensationCode: req.params.compensationCode });
    if (!compensation) {
      throw new ApiError(404, `Compensation ${req.params.compensationCode} non trouvée`);
    }

    if (compensation.status !== 'proposed' && compensation.status !== 'reviewed') {
      throw new ApiError(400, 'Seules les compensations proposées ou examinées peuvent être rejetées');
    }

    compensation.status = 'rejected';
    if (notes) compensation.notes = notes;

    await compensation.save();

    // Mettre à jour le bien - revenir à evaluated
    const bien = await Bien.findOne({ bienCode: compensation.bienCode });
    if (bien) {
      bien.status = 'evaluated';
      await bien.save();
    }

    res.json({
      success: true,
      message: 'Compensation rejetée avec succès',
      data: compensation
    });
  }),

  // Obtenir les statistiques des compensations
  getCompensationStats: asyncHandler(async (req, res) => {
    const { papCode } = req.params;

    // Vérifier que le PAP existe
    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const stats = await Compensation.aggregate([
      { $match: { papCode } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalProposed: { $sum: '$proposedAmount' },
          totalApproved: { $sum: { $ifNull: ['$approvedAmount', 0] } },
          avgAmount: { $avg: '$proposedAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const total = await Compensation.countDocuments({ papCode });
    const approved = stats.find(s => s._id === 'approved');

    res.json({
      success: true,
      data: {
        total,
        byStatus: stats,
        totalProposedAmount: stats.reduce((sum, s) => sum + (s.totalProposed || 0), 0),
        totalApprovedAmount: approved ? approved.totalApproved : 0
      }
    });
  })
};

export default compensationController;
