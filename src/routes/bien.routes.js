import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// Stub routes - to be implemented
router.get('/list/:papCode', asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Get biens - To be implemented', data: [] });
}));

router.get('/:bienCode', asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Get bien - To be implemented', data: null });
}));

router.post('/create/:papCode', asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, message: 'Bien created - To be implemented', data: null });
}));

router.put('/:bienCode', asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Bien updated - To be implemented', data: null });
}));

export default router;
