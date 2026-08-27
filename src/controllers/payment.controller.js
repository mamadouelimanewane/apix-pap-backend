import Payment from '../models/Payment.model.js';
import Compensation from '../models/Compensation.model.js';
import PAP from '../models/PAP.model.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

export const paymentController = {
  // Lister les paiements d'un PAP
  listPaymentsByPAP: asyncHandler(async (req, res) => {
    const { papCode } = req.params;
    const { page = 1, limit = 20, status, paymentMethod } = req.query;

    // Vérifier que le PAP existe
    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const query = { papCode };
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const skip = (page - 1) * limit;
    const payments = await Payment.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v')
      .sort({ initiationDate: -1 });

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  }),

  // Obtenir les détails d'un paiement
  getPaymentById: asyncHandler(async (req, res) => {
    const payment = await Payment.findOne({ paymentCode: req.params.paymentCode })
      .select('-__v');

    if (!payment) {
      throw new ApiError(404, `Paiement ${req.params.paymentCode} non trouvé`);
    }

    res.json({
      success: true,
      data: payment
    });
  }),

  // Initier un paiement pour une compensation
  initiatePayment: asyncHandler(async (req, res) => {
    const { compensationCode } = req.params;
    const { papCode } = req.params;
    const { amount, paymentMethod, reference, notes } = req.body;

    // Vérifier que la compensation existe et est approuvée
    const compensation = await Compensation.findOne({ compensationCode });
    if (!compensation) {
      throw new ApiError(404, `Compensation ${compensationCode} non trouvée`);
    }

    if (compensation.status !== 'approved') {
      throw new ApiError(400, 'Seules les compensations approuvées peuvent être payées');
    }

    if (!amount || !paymentMethod) {
      throw new ApiError(400, 'Montant et méthode de paiement sont obligatoires');
    }

    const payment = new Payment({
      papCode,
      compensationCode,
      amount,
      paymentMethod,
      status: 'initiated',
      initiationDate: new Date(),
      reference,
      notes,
      createdBy: req.user.id
    });

    await payment.save();

    // Mettre à jour la compensation
    compensation.status = 'paid';
    await compensation.save();

    // Mettre à jour le PAP - phase 4 (Paiement)
    const pap = await PAP.findOne({ papCode });
    if (pap) {
      pap.workflowPhase = 4;
      pap.actualCompensation = (pap.actualCompensation || 0) + amount;
      pap.paymentStatus = 'initiated';
      pap.paymentMethod = paymentMethod;
      pap.paymentDate = new Date();
      await pap.save();
    }

    res.status(201).json({
      success: true,
      message: 'Paiement initié avec succès',
      data: payment
    });
  }),

  // Confirmer un paiement
  confirmPayment: asyncHandler(async (req, res) => {
    const { paymentCode } = req.params;
    const { reference, notes } = req.body;

    const payment = await Payment.findOne({ paymentCode });
    if (!payment) {
      throw new ApiError(404, `Paiement ${paymentCode} non trouvé`);
    }

    if (payment.status !== 'initiated') {
      throw new ApiError(400, 'Seuls les paiements initiés peuvent être confirmés');
    }

    payment.status = 'confirmed';
    payment.confirmationDate = new Date();
    if (reference) payment.reference = reference;
    if (notes) payment.notes = notes;

    await payment.save();

    // Mettre à jour le PAP
    const pap = await PAP.findOne({ papCode: payment.papCode });
    if (pap) {
      pap.paymentStatus = 'confirmed';
      await pap.save();
    }

    res.json({
      success: true,
      message: 'Paiement confirmé avec succès',
      data: payment
    });
  }),

  // Finaliser un paiement
  completePayment: asyncHandler(async (req, res) => {
    const { paymentCode } = req.params;
    const { reference, notes } = req.body;

    const payment = await Payment.findOne({ paymentCode });
    if (!payment) {
      throw new ApiError(404, `Paiement ${paymentCode} non trouvé`);
    }

    if (payment.status !== 'confirmed' && payment.status !== 'initiated') {
      throw new ApiError(400, 'Seuls les paiements confirmés ou initiés peuvent être finalisés');
    }

    payment.status = 'completed';
    payment.completionDate = new Date();
    if (reference) payment.reference = reference;
    if (notes) payment.notes = notes;

    await payment.save();

    // Mettre à jour le PAP - phase 5 (Réclamations/Clôture)
    const pap = await PAP.findOne({ papCode: payment.papCode });
    if (pap) {
      pap.paymentStatus = 'completed';
      pap.workflowPhase = 5; // Réclamations
      await pap.save();
    }

    res.json({
      success: true,
      message: 'Paiement finalisé avec succès',
      data: payment
    });
  }),

  // Échouer un paiement
  failPayment: asyncHandler(async (req, res) => {
    const { paymentCode } = req.params;
    const { notes } = req.body;

    const payment = await Payment.findOne({ paymentCode });
    if (!payment) {
      throw new ApiError(404, `Paiement ${paymentCode} non trouvé`);
    }

    payment.status = 'failed';
    if (notes) payment.notes = notes;

    await payment.save();

    // Remettre la compensation à approuvée
    const compensation = await Compensation.findOne({ compensationCode: payment.compensationCode });
    if (compensation) {
      compensation.status = 'approved';
      await compensation.save();
    }

    // Mettre à jour le PAP
    const pap = await PAP.findOne({ papCode: payment.papCode });
    if (pap) {
      pap.paymentStatus = 'failed';
      await pap.save();
    }

    res.json({
      success: true,
      message: 'Paiement marqué comme échoué',
      data: payment
    });
  }),

  // Obtenir les statistiques des paiements
  getPaymentStats: asyncHandler(async (req, res) => {
    const { papCode } = req.params;

    // Vérifier que le PAP existe
    const pap = await PAP.findOne({ papCode });
    if (!pap) {
      throw new ApiError(404, `PAP ${papCode} non trouvé`);
    }

    const stats = await Payment.aggregate([
      { $match: { papCode } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const methodStats = await Payment.aggregate([
      { $match: { papCode } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const total = await Payment.countDocuments({ papCode });
    const completed = stats.find(s => s._id === 'completed');

    res.json({
      success: true,
      data: {
        total,
        byStatus: stats,
        byMethod: methodStats,
        totalCompletedAmount: completed ? completed.totalAmount : 0
      }
    });
  })
};

export default paymentController;
