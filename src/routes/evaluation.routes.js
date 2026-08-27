import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.post('/create/:bienCode', asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Evaluation created', data: {} });
}));

router.get('/list', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

export default router;
