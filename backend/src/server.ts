import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/authRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// CORS Configuration
app.use(
  cors({
    origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json());

// Request logger for development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SentinelAI Core Engine API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Error Handler
app.use(errorHandler);

// Initialize DB and Start Server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🛡️  SentinelAI Backend API is running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`🚀 CORS allowed for: ${CLIENT_ORIGIN}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize SentinelAI backend:', error);
    process.exit(1);
  }
};

startServer();
