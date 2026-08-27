import Evaluation from '../models/Evaluation.model.js';
import Bien from '../models/Bien.model.js';
import PAP from '../models/PAP.model.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

export const evaluationController = {
  // Lister les évaluations d'un PAP
  listEvaluationsByPAP: asyncHandler(async (req, res) => {
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
    const evaluations = await Evaluation.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .sort({ date: -1 });

    const total = await Evaluation.countDocuments(query);

    res.json({
      success: true,
      data: evaluations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }),

  // Obtenir les détails d'une évaluation
  getEvaluationById: asyncHandler(async (req, res) => {
    const evaluation = await Evaluation.findOne({ evaluationCode: req.params.evaluationCode })
      .select('-__v');

    if (!evaluation) {
      throw new ApiError(404, `Évaluation ${req.params.evaluationCode} non trouvée`);
    }

    res.json({
      success: true,
      data: evaluation
    });
  }),

  // Créer une évaluation pour un bien
  createEvaluation: asyncHandler(async (req, res) => {
    const { bienCode, papCode } = req.params;
    const { estimatedValue, condition, evaluator, details, photos } = req.body;

    // Vérifier que le bien existe
    const bien = await Bien.findOne({ bienCode });
    if (!bien) {
      throw new ApiError(404, `Bien ${bienCode} non trouvé`);
    }

    if (!estimatedValue || !condition) {
      throw new ApiError(400, 'Valeur estimée et condition sont obligatoires');
    }

    const evaluation = new Evaluation({
      papCode,
      bienCode,
      estimatedValue,
      condition,
      evaluator: evaluator || req.user.nom,
      details,
      photos,
      date: new Date(),
      status: 'pending',
      createdBy: req.user.id
    });

    await evaluation.save();

    // Mettre à jour le bien avec l'évaluation
    bien.evaluation = evaluation._id;
    bien.estimatedValue = estimatedValue;
    bien.status = 'evaluated';
    await bien.save();

    res.status(201).json({
      success: true,
      message: 'Évaluation créée avec succès',
      data: evaluation
    });
  }),

  // Approuver une évaluation
  approveEvaluation: asyncHandler(async (req, res) => {
    const { notes } = req.body;

    const evaluation = await Evaluation.findOne({ evaluationCode: req.params.evaluationCode });
    if (!evaluation) {
      throw new ApiError(404, `Évaluation ${req.params.evaluationCode} non trouvée`);
    }

    if (evaluation.status !== 'pending') {
      throw new ApiError(400, 'Seules les évaluations en attente peuvent être approuvées');
    }

    evaluation.status = 'approved';
    evaluation.approvedBy = req.user.id;
    evaluation.approvalDate = new Date();
    if (notes) evaluation.notes = notes;

    await evaluation.save();

    // Mettre à jour le PAP - phase 2 (Évaluation)
    const pap = await PAP.findOne({ papCode: evaluation.papCode });
    if (pap) {
      pap.workflowPhase = 2;
      await pap.save();
    }

    res.json({
      success: true,
      message: 'Évaluation approuvée avec succès',
      data: evaluation
    });
  }),

  // Rejeter une évaluation
  rejectEvaluation: asyncHandler(async (req, res) => {
    const { notes } = req.body;

    const evaluation = await Evaluation.findOne({ evaluationCode: req.params.evaluationCode });
    if (!evaluation) {
      throw new ApiError(404, `Évaluation ${req.params.evaluationCode} non trouvée`);
    }

    if (evaluation.status !== 'pending') {
      throw new ApiError(400, 'Seules les évaluations en attente peuvent être rejetées');
    }

    evaluation.status = 'rejected';
    evaluation.approvedBy = req.user.id;
    evaluation.approvalDate = new Date();
    if (notes) evaluation.notes = notes;

    await evaluation.save();

    // Mettre à jour le bien - revenir à non_evaluated
    const bien = await Bien.findOne({ bienCode: evaluation.bienCode });
    if (bien) {
      bien.status = 'non_evaluated';
      bien.evaluation = null;
      await bien.save();
    }

    res.json({
      success: true,
      message: 'Évaluation rejetée avec succès',
      data: evaluation
    });
  }),

  // Obtenir les statistiques des évaluations
  getEvaluationStats: asyncHandler(async (req, res) => {
    const { papCode } = req.params;

    // Vérifier que le PAP existe
    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const stats = await Evaluation.aggregate([
      { $match: { papCode } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$estimatedValue' },
          avgValue: { $avg: '$estimatedValue' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const conditionStats = await Evaluation.aggregate([
      { $match: { papCode } },
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Evaluation.countDocuments({ papCode });
    const approved = stats.find(s => s._id === 'approved');
    const totalApprovedValue = approved ? approved.totalValue : 0;

    res.json({
      success: true,
      data: {
        total,
        byStatus: stats,
        byCondition: conditionStats,
        totalApprovedValue
      }
    });
  })
};

export default evaluationController;
