import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { bienController } from '../controllers/bien.controller.js';

const router = express.Router();
router.use(authenticate);

router.get('/list/:papCode', bienController.listBiensByPAP);
router.get('/stats/:papCode', bienController.getBienStats);
router.get('/:bienCode', bienController.getBienById);
router.post('/create/:papCode', authorize(['admin', 'chef_projet', 'gestionnaire']), bienController.createBien);
router.put('/:bienCode', authorize(['admin', 'chef_projet', 'gestionnaire']), bienController.updateBien);
router.delete('/:bienCode', authorize(['admin', 'chef_projet']), bienController.deleteBien);

export default router;
