import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';

class SentinelSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected to SentinelAI Core Telemetry Engine');
      });

      this.socket.on('sentinel:status', (data) => {
        console.log('[WebSocket] Telemetry Status Handshake:', data);
      });

      this.socket.on('threat:detected', (threat) => {
        this.emitLocal('threat:detected', threat);
      });

      this.socket.on('incident:resolved', (data) => {
        this.emitLocal('incident:resolved', data);
      });
    }

    return this.socket;
  }

  public subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return un-subscriber
    return () => {
      const list = this.listeners.get(event) || [];
      this.listeners.set(
        event,
        list.filter((cb) => cb !== callback)
      );
    };
  }

  private emitLocal(event: string, data: any): void {
    const list = this.listeners.get(event) || [];
    list.forEach((cb) => cb(data));
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SentinelSocketService();
