import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { reclamationController } from '../controllers/reclamation.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/list/:papCode', reclamationController.listReclamationsByPAP);
router.get('/stats/:papCode', reclamationController.getReclamationStats);
router.get('/:reclamationCode', reclamationController.getReclamationById);
router.post('/create/:papCode', reclamationController.createReclamation);
router.post('/review/:reclamationCode', authorize(['admin', 'chef_projet']), reclamationController.reviewReclamation);
router.post('/resolve/:reclamationCode', authorize(['admin', 'chef_projet']), reclamationController.resolveReclamation);
router.post('/reject/:reclamationCode', authorize(['admin', 'chef_projet']), reclamationController.rejectReclamation);

export default router;
