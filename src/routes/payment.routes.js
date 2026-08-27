import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { paymentController } from '../controllers/payment.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/list/:papCode', paymentController.listPaymentsByPAP);
router.get('/stats/:papCode', paymentController.getPaymentStats);
router.get('/:paymentCode', paymentController.getPaymentById);
router.post('/initiate/:papCode/:compensationCode', authorize(['admin', 'chef_projet']), paymentController.initiatePayment);
router.post('/confirm/:paymentCode', authorize(['admin', 'chef_projet']), paymentController.confirmPayment);
router.post('/complete/:paymentCode', authorize(['admin', 'chef_projet']), paymentController.completePayment);
router.post('/fail/:paymentCode', authorize(['admin', 'chef_projet']), paymentController.failPayment);

export default router;
