import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { analyticsController } from '../controllers/analytics.controller.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize(['admin', 'chef_projet', 'gestionnaire'])); // Analytics pour admin/chefs

router.get('/dashboard', analyticsController.getDashboard);
router.get('/phase-progress', analyticsController.getPhaseProgress);
router.get('/zone-report', analyticsController.getZoneReport);
router.get('/sector-report', analyticsController.getSectorReport);
router.get('/property-report', analyticsController.getPropertyReport);
router.get('/trend-data', analyticsController.getTrendData);
router.get('/alerts', analyticsController.getAlerts);

export default router;
