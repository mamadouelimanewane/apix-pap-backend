import express from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Demo users
const DEMO_USERS = {
  'admin@apix.sn': {
    id: '1',
    nom: 'Administrateur',
    email: 'admin@apix.sn',
    role: 'admin',
    password: 'password'
  },
  'chef@apix.sn': {
    id: '2',
    nom: 'Chef Projet',
    email: 'chef@apix.sn',
    role: 'chef_projet',
    password: 'password'
  },
  'gestionnaire@apix.sn': {
    id: '3',
    nom: 'Gestionnaire PAP',
    email: 'gestionnaire@apix.sn',
    role: 'gestionnaire',
    password: 'password'
  },
  'agent@apix.sn': {
    id: '4',
    nom: 'Agent Terrain',
    email: 'agent@apix.sn',
    role: 'agent_terrain',
    password: 'password'
  }
};

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password required');
  }

  const user = DEMO_USERS[email];
  if (!user || user.password !== password) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      nom: user.nom,
      email: user.email,
      role: user.role
    }
  });
}));

// GET /api/auth/profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = DEMO_USERS[req.user.email] || {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  };

  res.json({
    success: true,
    user
  });
}));

// POST /api/auth/logout
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

export default router;
