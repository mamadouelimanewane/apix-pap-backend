import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logger.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import papRoutes from './routes/pap.routes.js';
import bienRoutes from './routes/bien.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';
import compensationRoutes from './routes/compensation.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reclamationRoutes from './routes/reclamation.routes.js';
import communicationRoutes from './routes/communication.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Logging
app.use(morgan('combined'));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Documentation
if (process.env.ENABLE_API_DOCS === 'true') {
  app.get('/api/docs', (req, res) => {
    res.json({
      version: '1.0.0',
      title: 'APIX-PAP API',
      description: 'Backend API pour gestion des PAP',
      baseURL: `http://${process.env.HOST}:${process.env.PORT}/api`,
      endpoints: {
        auth: '/api/auth',
        pap: '/api/pap',
        bien: '/api/bien',
        evaluation: '/api/evaluation',
        compensation: '/api/compensation',
        payment: '/api/payment',
        reclamation: '/api/reclamation',
        communication: '/api/communications',
        workflow: '/api/workflow',
        analytics: '/api/analytics'
      }
    });
  });
}

// ============================================================================
// ROUTES
// ============================================================================

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/pap', papRoutes);
app.use('/api/bien', bienRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/compensation', compensationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reclamation', reclamationRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/analytics', analyticsRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// DATABASE & SERVER START
// ============================================================================

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Start server
    app.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║       🚀 APIX-PAP Backend Server Running      ║
╠════════════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV.padEnd(40)}║
║  Host:        ${`${HOST}:${PORT}`.padEnd(40)}║
║  Database:    MongoDB                         ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
