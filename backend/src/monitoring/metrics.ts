import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create a dedicated Registry
export const register = new client.Registry();

// Enable collection of default Node.js runtime metrics (CPU, Memory, Event Loop)
client.collectDefaultMetrics({
  register,
  prefix: 'sentinel_node_',
});

/**
 * Custom Prometheus Metric Types:
 * 1. Counter: Monotonically increasing value (Total HTTP requests, Threats blocked)
 * 2. Gauge: Value that can go up or down (Active incidents, Active agents, Score)
 * 3. Histogram: Samples observations in configurable buckets (Request durations)
 */

// 1. Counter: HTTP Requests Total
export const httpRequestCounter = new client.Counter({
  name: 'sentinel_http_requests_total',
  help: 'Total number of HTTP requests processed by SentinelAI API',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// 1. Counter: Threats Blocked Total
export const threatsBlockedCounter = new client.Counter({
  name: 'sentinel_threats_blocked_total',
  help: 'Total number of cyber threats neutralized by SentinelAI autonomous engine',
  labelNames: ['vector', 'severity'],
  registers: [register],
});

// 2. Gauge: Active Incidents Count
export const activeIncidentsGauge = new client.Gauge({
  name: 'sentinel_active_incidents',
  help: 'Current count of active or investigating security incidents',
  registers: [register],
});
activeIncidentsGauge.set(3);

// 2. Gauge: Active Neural Agents
export const activeAgentsGauge = new client.Gauge({
  name: 'sentinel_active_agents',
  help: 'Number of active AI Sentinel neural agents running in cluster',
  registers: [register],
});
activeAgentsGauge.set(4);

// 2. Gauge: Enterprise Security Score
export const securityScoreGauge = new client.Gauge({
  name: 'sentinel_security_score',
  help: 'Current posture security compliance score (0-100)',
  registers: [register],
});
securityScoreGauge.set(96);

// 3. Histogram: HTTP Request Latency
export const httpRequestDurationHistogram = new client.Histogram({
  name: 'sentinel_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds across SentinelAI API',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// Express Middleware for automatic Prometheus telemetry collection
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Ignore metrics endpoint to avoid skewing data
  if (req.path === '/metrics') {
    next();
    return;
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode.toString();

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDurationHistogram.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      durationInSeconds
    );
  });

  next();
};

// Route handler for /metrics endpoint
export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
};
