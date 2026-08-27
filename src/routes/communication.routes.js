import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/messages/:papCode', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

router.get('/notifications', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

export default router;
