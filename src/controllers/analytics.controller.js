import PAP from '../models/PAP.model.js';
import Bien from '../models/Bien.model.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const analyticsController = {
  // Dashboard principal
  getDashboard: asyncHandler(async (req, res) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Statistiques globales PAP
    const papStats = await PAP.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byZone: [
            { $group: { _id: '$zone', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          bySector: [
            { $group: { _id: '$secteur', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byPhase: [
            { $group: { _id: '$workflowPhase', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
          recent: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    // Statistiques moyennes de compensation
    const compensationStats = await PAP.aggregate([
      {
        $facet: {
          avgEstimated: [
            { $group: { _id: null, avg: { $avg: '$estimatedCompensation' } } }
          ],
          avgActual: [
            { $group: { _id: null, avg: { $avg: '$actualCompensation' } } }
          ],
          totalEstimated: [
            { $group: { _id: null, total: { $sum: '$estimatedCompensation' } } }
          ],
          totalActual: [
            { $group: { _id: null, total: { $sum: '$actualCompensation' } } }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalPAPs: papStats[0].total[0]?.count || 0,
          recentAdded: papStats[0].recent[0]?.count || 0,
          avgCompensationEstimated: Math.round(compensationStats[0].avgEstimated[0]?.avg || 0),
          avgCompensationActual: Math.round(compensationStats[0].avgActual[0]?.avg || 0),
          totalEstimated: Math.round(compensationStats[0].totalEstimated[0]?.total || 0),
          totalActual: Math.round(compensationStats[0].totalActual[0]?.total || 0)
        },
        byStatus: papStats[0].byStatus,
        byZone: papStats[0].byZone,
        bySector: papStats[0].bySector,
        byPhase: papStats[0].byPhase.map(p => ({
          phase: p._id,
          count: p.count,
          name: ['', 'Enregistrement', 'Évaluation', 'Compensation', 'Paiement', 'Réclamations', 'Clôture'][p._id]
        }))
      }
    });
  }),

  // Rapport de progression des phases
  getPhaseProgress: asyncHandler(async (req, res) => {
    const stats = await PAP.aggregate([
      {
        $group: {
          _id: '$workflowPhase',
          count: { $sum: 1 },
          avgDaysInPhase: { $avg: { $subtract: [new Date(), '$createdAt'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const phases = [
      { phase: 1, name: 'Enregistrement' },
      { phase: 2, name: 'Évaluation' },
      { phase: 3, name: 'Compensation' },
      { phase: 4, name: 'Paiement' },
      { phase: 5, name: 'Réclamations' },
      { phase: 6, name: 'Clôture' }
    ];

    const phaseData = phases.map(p => {
      const stat = stats.find(s => s._id === p.phase);
      return {
        phase: p.phase,
        name: p.name,
        count: stat?.count || 0,
        avgDaysInPhase: stat ? Math.round(stat.avgDaysInPhase / (1000 * 60 * 60 * 24)) : 0
      };
    });

    res.json({
      success: true,
      data: phaseData
    });
  }),

  // Rapport de zones géographiques
  getZoneReport: asyncHandler(async (req, res) => {
    const stats = await PAP.aggregate([
      {
        $match: { zone: { $ne: null } }
      },
      {
        $group: {
          _id: '$zone',
          totalPAPs: { $sum: 1 },
          byStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          },
          avgCompensation: { $avg: '$estimatedCompensation' },
          totalCompensation: { $sum: '$estimatedCompensation' }
        }
      },
      { $sort: { totalPAPs: -1 } }
    ]);

    // Agréger les status par zone
    const zoneData = stats.map(zone => {
      const statusGroups = {};
      zone.byStatus.forEach(item => {
        statusGroups[item.status] = (statusGroups[item.status] || 0) + item.count;
      });

      return {
        zone: zone._id,
        totalPAPs: zone.totalPAPs,
        byStatus: statusGroups,
        avgCompensation: Math.round(zone.avgCompensation || 0),
        totalCompensation: Math.round(zone.totalCompensation || 0)
      };
    });

    res.json({
      success: true,
      data: zoneData
    });
  }),

  // Rapport secteur
  getSectorReport: asyncHandler(async (req, res) => {
    const stats = await PAP.aggregate([
      {
        $match: { secteur: { $ne: null } }
      },
      {
        $group: {
          _id: '$secteur',
          totalPAPs: { $sum: 1 },
          properties: { $sum: '$numberOfProperties' },
          avgCompensation: { $avg: '$estimatedCompensation' },
          totalCompensation: { $sum: '$estimatedCompensation' },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalPAPs: -1 } }
    ]);

    res.json({
      success: true,
      data: stats.map(s => ({
        sector: s._id,
        totalPAPs: s.totalPAPs,
        properties: s.properties,
        avgCompensation: Math.round(s.avgCompensation || 0),
        totalCompensation: Math.round(s.totalCompensation || 0),
        completionRate: Math.round((s.completed / s.totalPAPs) * 100)
      }))
    });
  }),

  // Rapport de biens
  getPropertyReport: asyncHandler(async (req, res) => {
    const stats = await Bien.aggregate([
      {
        $facet: {
          byType: [
            { $group: { _id: '$type', count: { $sum: 1 }, totalArea: { $sum: '$superficie' } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 }, avgValue: { $avg: '$estimatedValue' } } }
          ],
          total: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                totalArea: { $sum: '$superficie' },
                totalValue: { $sum: '$estimatedValue' }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: stats[0].total[0] || { total: 0, totalArea: 0, totalValue: 0 },
        byType: stats[0].byType,
        byStatus: stats[0].byStatus.map(s => ({
          ...s,
          avgValue: Math.round(s.avgValue || 0)
        }))
      }
    });
  }),

  // Tendances temporelles
  getTrendData: asyncHandler(async (req, res) => {
    const { period = '30' } = req.query; // days
    const daysBack = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const dailyStats = await PAP.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          created: { $sum: 1 },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          compensation: { $sum: '$actualCompensation' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: dailyStats.map(stat => ({
        date: stat._id,
        created: stat.created,
        paid: stat.paid,
        compensation: Math.round(stat.compensation || 0)
      }))
    });
  }),

  // Alertes et anomalies
  getAlerts: asyncHandler(async (req, res) => {
    const alerts = [];

    // PAPs sans bien enregistré
    const papsWithoutProperty = await PAP.countDocuments({ numberOfProperties: 0 });
    if (papsWithoutProperty > 0) {
      alerts.push({
        type: 'warning',
        title: 'PAPs sans propriété',
        message: `${papsWithoutProperty} PAPs n'ont pas de propriété enregistrée`,
        count: papsWithoutProperty
      });
    }

    // PAPs sans évaluation avancée
    const papsByPhase = await PAP.aggregate([
      { $group: { _id: '$workflowPhase', count: { $sum: 1 } } }
    ]);
    const stuck = papsByPhase.find(p => p._id === 1);
    if (stuck && stuck.count > 5) {
      alerts.push({
        type: 'warning',
        title: 'Blocage en phase 1',
        message: `${stuck.count} PAPs sont bloqués en phase d'enregistrement`,
        count: stuck.count
      });
    }

    // Compensation non validée
    const bienStats = await Bien.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const evaluated = bienStats.find(s => s._id === 'evaluated');
    if (evaluated && evaluated.count > 10) {
      alerts.push({
        type: 'info',
        title: 'Compensations en attente',
        message: `${evaluated.count} biens évalués en attente de compensation`,
        count: evaluated.count
      });
    }

    res.json({
      success: true,
      data: alerts
    });
  })
};

export default analyticsController;
