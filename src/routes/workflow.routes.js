import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { workflowController } from '../controllers/workflow.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/:papCode', workflowController.getWorkflowByPAP);
router.get('/stats/all', workflowController.getWorkflowStats);
router.get('/history/:papCode', workflowController.getWorkflowHistory);
router.post('/start/:papCode/:phase', authorize(['admin', 'chef_projet']), workflowController.startPhase);
router.post('/complete/:papCode/:phase', authorize(['admin', 'chef_projet']), workflowController.completePhase);
router.post('/reject/:papCode/:phase', authorize(['admin', 'chef_projet']), workflowController.rejectPhase);

export default router;
