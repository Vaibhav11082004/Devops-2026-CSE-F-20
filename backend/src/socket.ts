import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { threatsBlockedCounter, activeIncidentsGauge } from './monitoring/metrics.js';

let io: SocketIOServer | null = null;

export interface ThreatAlertPayload {
  id: string;
  title: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  target: string;
  sourceIp: string;
  timestamp: string;
}

export const initSocket = (server: HttpServer, clientOrigin: string): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WebSocket] Operator connected: ${socket.id}`);

    // Send initial handshake status
    socket.emit('sentinel:status', {
      engine: 'ONLINE',
      latencyMs: 14,
      connectedAt: new Date().toISOString(),
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Operator disconnected: ${socket.id}`);
    });
  });

  // Simulated live threat simulation stream every 45 seconds (low frequency to be realistic)
  setInterval(() => {
    if (!io || io.engine.clientsCount === 0) return;

    const simulatedThreats: ThreatAlertPayload[] = [
      {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Anomalous Cross-Region IAM Access Attempt',
        type: 'Privilege Escalation',
        severity: 'high',
        target: 'iam-role-core-secrets',
        sourceIp: `198.51.100.${Math.floor(Math.random() * 254)}`,
        timestamp: 'Just now',
      },
      {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Volumetric DNS Tunneling Packet Surge',
        type: 'DDoS',
        severity: 'medium',
        target: 'edge-gateway-apac-east',
        sourceIp: `203.0.113.${Math.floor(Math.random() * 254)}`,
        timestamp: 'Just now',
      },
    ];

    const randomThreat = simulatedThreats[Math.floor(Math.random() * simulatedThreats.length)];
    io.emit('threat:detected', randomThreat);
    threatsBlockedCounter.inc({ vector: randomThreat.type, severity: randomThreat.severity });
  }, 45000);

  return io;
};

export const broadcastThreatAlert = (threat: ThreatAlertPayload): void => {
  if (io) {
    io.emit('threat:alert', threat);
    threatsBlockedCounter.inc({ vector: threat.type, severity: threat.severity });
  }
};

export const broadcastIncidentResolved = (incidentId: string): void => {
  if (io) {
    io.emit('incident:resolved', { incidentId, resolvedAt: new Date().toISOString() });
    activeIncidentsGauge.dec();
  }
};
