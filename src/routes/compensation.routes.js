import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { compensationController } from '../controllers/compensation.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/list/:papCode', compensationController.listCompensationsByPAP);
router.get('/stats/:papCode', compensationController.getCompensationStats);
router.get('/:compensationCode', compensationController.getCompensationById);
router.post('/propose/:papCode/:bienCode', authorize(['admin', 'chef_projet', 'gestionnaire']), compensationController.proposeCompensation);
router.post('/review/:compensationCode', authorize(['admin', 'chef_projet']), compensationController.reviewCompensation);
router.post('/approve/:compensationCode', authorize(['admin', 'chef_projet']), compensationController.approveCompensation);
router.post('/reject/:compensationCode', authorize(['admin', 'chef_projet']), compensationController.rejectCompensation);

export default router;
