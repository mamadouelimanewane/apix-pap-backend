import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { evaluationController } from '../controllers/evaluation.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/list/:papCode', evaluationController.listEvaluationsByPAP);
router.get('/stats/:papCode', evaluationController.getEvaluationStats);
router.get('/:evaluationCode', evaluationController.getEvaluationById);
router.post('/create/:papCode/:bienCode', authorize(['admin', 'chef_projet', 'gestionnaire']), evaluationController.createEvaluation);
router.post('/approve/:evaluationCode', authorize(['admin', 'chef_projet']), evaluationController.approveEvaluation);
router.post('/reject/:evaluationCode', authorize(['admin', 'chef_projet']), evaluationController.rejectEvaluation);

export default router;
