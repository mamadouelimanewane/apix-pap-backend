import mongoose from 'mongoose';
import PAP from '../models/PAP.model.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

// Modèle Workflow temporaire
const WorkflowSchema = new mongoose.Schema({
  workflowCode: { type: String, unique: true, required: true },
  papCode: { type: String, required: true, index: true },
  currentPhase: { type: Number, default: 1, min: 1, max: 6 },
  phases: [
    {
      phase: Number,
      name: String,
      status: { type: String, enum: ['pending', 'in_progress', 'completed', 'rejected'], default: 'pending' },
      startDate: Date,
      endDate: Date,
      notes: String
    }
  ],
  history: [
    {
      phase: Number,
      action: String,
      status: String,
      timestamp: { type: Date, default: Date.now },
      userId: String,
      notes: String
    }
  ],
  isCompleted: { type: Boolean, default: false },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

WorkflowSchema.pre('save', async function (next) {
  if (!this.workflowCode) {
    const count = await this.constructor.countDocuments();
    this.workflowCode = `WF-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Workflow = mongoose.model('Workflow', WorkflowSchema);

const PHASE_NAMES = {
  1: 'Enregistrement',
  2: 'Évaluation',
  3: 'Compensation',
  4: 'Paiement',
  5: 'Réclamations',
  6: 'Clôture'
};

export const workflowController = {
  // Obtenir le workflow d'un PAP
  getWorkflowByPAP: asyncHandler(async (req, res) => {
    const { papCode } = req.params;

    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    let workflow = await Workflow.findOne({ papCode });

    if (!workflow) {
      // Créer un nouveau workflow si n'existe pas
      workflow = new Workflow({
        papCode,
        currentPhase: 1,
        phases: Object.keys(PHASE_NAMES).map(phase => ({
          phase: parseInt(phase),
          name: PHASE_NAMES[phase],
          status: 'pending'
        }))
      });
      await workflow.save();
    }

    res.json({
      success: true,
      data: workflow
    });
  }),

  // Démarrer une phase
  startPhase: asyncHandler(async (req, res) => {
    const { papCode, phase } = req.params;
    const { notes } = req.body;

    if (!phase || phase < 1 || phase > 6) {
      throw new ApiError(400, 'Phase invalide (1-6)');
    }

    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    let workflow = await Workflow.findOne({ papCode });
    if (!workflow) {
      throw new ApiError(404, 'Workflow non trouvé');
    }

    const phaseIndex = workflow.phases.findIndex(p => p.phase === parseInt(phase));
    if (phaseIndex === -1) {
      throw new ApiError(400, 'Phase non trouvée');
    }

    workflow.phases[phaseIndex].status = 'in_progress';
    workflow.phases[phaseIndex].startDate = new Date();
    workflow.currentPhase = parseInt(phase);

    workflow.history.push({
      phase: parseInt(phase),
      action: 'START',
      status: 'in_progress',
      userId: req.user.id || req.user.email,
      notes
    });

    await workflow.save();
    pap.workflowPhase = parseInt(phase);
    await pap.save();

    res.json({
      success: true,
      message: `Phase ${phase} démarrée`,
      data: workflow
    });
  }),

  // Compléter une phase
  completePhase: asyncHandler(async (req, res) => {
    const { papCode, phase } = req.params;
    const { notes } = req.body;

    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const workflow = await Workflow.findOne({ papCode });
    if (!workflow) {
      throw new ApiError(404, 'Workflow non trouvé');
    }

    const phaseIndex = workflow.phases.findIndex(p => p.phase === parseInt(phase));
    if (phaseIndex === -1) {
      throw new ApiError(400, 'Phase non trouvée');
    }

    if (workflow.phases[phaseIndex].status !== 'in_progress') {
      throw new ApiError(400, 'Cette phase n\'est pas en cours');
    }

    workflow.phases[phaseIndex].status = 'completed';
    workflow.phases[phaseIndex].endDate = new Date();

    workflow.history.push({
      phase: parseInt(phase),
      action: 'COMPLETE',
      status: 'completed',
      userId: req.user.id || req.user.email,
      notes
    });

    // Passer à la phase suivante automatiquement
    if (parseInt(phase) < 6) {
      const nextPhase = parseInt(phase) + 1;
      const nextPhaseIndex = workflow.phases.findIndex(p => p.phase === nextPhase);
      if (nextPhaseIndex > -1) {
        workflow.phases[nextPhaseIndex].status = 'pending';
        workflow.currentPhase = nextPhase;
        pap.workflowPhase = nextPhase;
      }
    } else {
      // Phase 6 = fin du workflow
      workflow.isCompleted = true;
      workflow.completedAt = new Date();
      pap.status = 'closed';
      pap.workflowPhase = 6;
    }

    await workflow.save();
    await pap.save();

    res.json({
      success: true,
      message: `Phase ${phase} complétée`,
      data: workflow
    });
  }),

  // Rejeter une phase
  rejectPhase: asyncHandler(async (req, res) => {
    const { papCode, phase } = req.params;
    const { reason } = req.body;

    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const workflow = await Workflow.findOne({ papCode });
    if (!workflow) {
      throw new ApiError(404, 'Workflow non trouvé');
    }

    const phaseIndex = workflow.phases.findIndex(p => p.phase === parseInt(phase));
    if (phaseIndex === -1) {
      throw new ApiError(400, 'Phase non trouvée');
    }

    workflow.phases[phaseIndex].status = 'rejected';
    workflow.phases[phaseIndex].notes = reason || 'Rejeté';

    workflow.history.push({
      phase: parseInt(phase),
      action: 'REJECT',
      status: 'rejected',
      userId: req.user.id || req.user.email,
      notes: reason
    });

    await workflow.save();

    res.json({
      success: true,
      message: `Phase ${phase} rejetée`,
      data: workflow
    });
  }),

  // Obtenir l'historique du workflow
  getWorkflowHistory: asyncHandler(async (req, res) => {
    const { papCode } = req.params;

    const workflow = await Workflow.findOne({ papCode });
    if (!workflow) {
      throw new ApiError(404, 'Workflow non trouvé');
    }

    res.json({
      success: true,
      data: {
        papCode,
        currentPhase: workflow.currentPhase,
        isCompleted: workflow.isCompleted,
        history: workflow.history.sort((a, b) => b.timestamp - a.timestamp)
      }
    });
  }),

  // Obtenir les statistiques du workflow
  getWorkflowStats: asyncHandler(async (req, res) => {
    const stats = await Workflow.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$isCompleted', count: { $sum: 1 } } }
          ],
          byPhase: [
            { $group: { _id: '$currentPhase', count: { $sum: 1 } } }
          ],
          avgDuration: [
            { $match: { isCompleted: true } },
            {
              $group: {
                _id: null,
                avgDays: {
                  $avg: {
                    $divide: [
                      { $subtract: ['$completedAt', '$createdAt'] },
                      1000 * 60 * 60 * 24
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: await Workflow.countDocuments(),
        completed: stats[0].byStatus.find(s => s._id === true)?.count || 0,
        inProgress: stats[0].byStatus.find(s => s._id === false)?.count || 0,
        byPhase: stats[0].byPhase,
        avgDurationDays: Math.round(stats[0].avgDuration[0]?.avgDays || 0)
      }
    });
  })
};

export default workflowController;
