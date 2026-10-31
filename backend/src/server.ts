import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/database.js';
import { initMongoDB } from './db/mongodb.js';
import { initSocket } from './socket.js';
import { metricsMiddleware, getMetrics } from './monitoring/metrics.js';
import authRoutes from './routes/authRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Initialize WebSockets
const io = initSocket(httpServer, CLIENT_ORIGIN);

// CORS Configuration
app.use(
  cors({
    origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Prometheus Metrics Middleware (observes HTTP duration and counts)
app.use(metricsMiddleware);

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

// Prometheus Scrape Endpoint
app.get('/metrics', getMetrics);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SentinelAI Core Engine API',
    version: '1.0.0',
    monitoring: 'Prometheus metrics active on /metrics',
    websockets: 'Socket.IO live telemetry online',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Error Handler
app.use(errorHandler);

// Initialize Databases and Start Server
export const startServer = async () => {
  try {
    // Attempt MongoDB connection if configured
    await initMongoDB();

    // Initialize SQLite primary / fallback database
    await initDatabase();

    httpServer.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🛡️  SentinelAI Backend API is running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
      console.log(`📊 Prometheus Metrics: http://localhost:${PORT}/metrics`);
      console.log(`⚡ WebSocket Stream: ws://localhost:${PORT}`);
      console.log(`🚀 CORS allowed for: ${CLIENT_ORIGIN}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize SentinelAI backend:', error);
    process.exit(1);
  }
};

const isEntryPoint = process.argv[1] && /server\.(ts|js)$/.test(process.argv[1]);
if (isEntryPoint) {
  startServer();
}

export { app, httpServer, io };
