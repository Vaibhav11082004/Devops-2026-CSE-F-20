import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../sentinel.db');
const db = new sqlite3.Database(dbPath);

// Promisified DB helpers
export const dbRun = (sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
};

export const dbAll = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as T[]);
    });
  });
};

export const initDatabase = async (): Promise<void> => {
  // Create tables
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'SecOps Analyst',
      organization TEXT NOT NULL DEFAULT 'Sentinel Enterprise Defense',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      target TEXT NOT NULL,
      source_ip TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL,
      ai_confidence REAL NOT NULL
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      accuracy REAL NOT NULL,
      threats_detected INTEGER NOT NULL,
      last_active TEXT NOT NULL,
      model_type TEXT NOT NULL
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default users if empty
  const userCount = await dbGet<{ count: number }>('SELECT count(*) as count FROM users');
  if (!userCount || userCount.count === 0) {
    const passwordHash1 = await bcrypt.hash('password123', 10);
    const passwordHash2 = await bcrypt.hash('sentinel-secure-pass', 10);

    await dbRun(
      `INSERT INTO users (id, name, email, password_hash, role, organization, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr_sentinel_007',
        'Alex Rivera',
        'alex.rivera@sentinel.ai',
        passwordHash1,
        'SecOps Director',
        'Sentinel Enterprise Defense',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      ]
    );

    await dbRun(
      `INSERT INTO users (id, name, email, password_hash, role, organization, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr_operator_001',
        'Field Operator',
        'operator@sentinel.ai',
        passwordHash2,
        'Senior SOC Specialist',
        'Global Defense Node Alpha',
        'https://api.dicebear.com/7.x/bottts/svg?seed=operator',
      ]
    );
    console.log('[DB] Seeded initial demo users.');
  }

  // Seed default incidents if empty
  const incidentCount = await dbGet<{ count: number }>('SELECT count(*) as count FROM incidents');
  if (!incidentCount || incidentCount.count === 0) {
    const initialIncidents = [
      {
        id: 'INC-9042',
        title: 'Distributed Port Scan & SSH Credential Stuffing',
        type: 'Brute Force',
        severity: 'critical',
        target: 'prod-auth-cluster-04',
        source_ip: '185.220.101.5',
        timestamp: '2 mins ago',
        status: 'blocked',
        ai_confidence: 99.4,
      },
      {
        id: 'INC-9041',
        title: 'Anomalous Outbound Data Burst (S3 Bucket)',
        type: 'Data Exfiltration',
        severity: 'high',
        target: 's3://vault-customer-pii',
        source_ip: '10.244.12.89',
        timestamp: '14 mins ago',
        status: 'investigating',
        ai_confidence: 94.2,
      },
      {
        id: 'INC-9040',
        title: 'Spear-Phishing Payload Detected in Inbound Mail',
        type: 'Phishing',
        severity: 'medium',
        target: 'finance-department-inbox',
        source_ip: '45.154.255.71',
        timestamp: '42 mins ago',
        status: 'mitigated',
        ai_confidence: 98.7,
      },
      {
        id: 'INC-9039',
        title: 'Unexpected Kernel Module Injection Attempt',
        type: 'Malware',
        severity: 'critical',
        target: 'worker-node-k8s-ap-south',
        source_ip: '194.26.29.112',
        timestamp: '1 hr ago',
        status: 'blocked',
        ai_confidence: 99.8,
      },
      {
        id: 'INC-9038',
        title: 'SYN Flood Volumetric Traffic Surge',
        type: 'DDoS',
        severity: 'high',
        target: 'edge-gateway-eu-west',
        source_ip: 'Botnet Cluster (14k nodes)',
        timestamp: '2 hrs ago',
        status: 'mitigated',
        ai_confidence: 97.5,
      },
      {
        id: 'INC-9037',
        title: 'Suspicious IAM Role Privilege Elevation',
        type: 'Privilege Escalation',
        severity: 'low',
        target: 'iam-role-dev-ci-runner',
        source_ip: '172.16.4.15',
        timestamp: '3 hrs ago',
        status: 'mitigated',
        ai_confidence: 89.1,
      },
    ];

    for (const inc of initialIncidents) {
      await dbRun(
        `INSERT INTO incidents (id, title, type, severity, target, source_ip, timestamp, status, ai_confidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inc.id,
          inc.title,
          inc.type,
          inc.severity,
          inc.target,
          inc.source_ip,
          inc.timestamp,
          inc.status,
          inc.ai_confidence,
        ]
      );
    }
    console.log('[DB] Seeded initial security incidents.');
  }

  // Seed default agents if empty
  const agentCount = await dbGet<{ count: number }>('SELECT count(*) as count FROM agents');
  if (!agentCount || agentCount.count === 0) {
    const initialAgents = [
      {
        id: 'agt-1',
        name: 'Aegis-Vision Neural',
        version: 'v3.4.1',
        status: 'online',
        accuracy: 99.6,
        threats_detected: 4219,
        last_active: 'Just now',
        model_type: 'Transformer Bi-Directional Net',
      },
      {
        id: 'agt-2',
        name: 'GhostProtocol ZeroDay Engine',
        version: 'v2.8.0',
        status: 'analyzing',
        accuracy: 98.9,
        threats_detected: 1890,
        last_active: '4s ago',
        model_type: 'Unsupervised Heuristic Ensemble',
      },
      {
        id: 'agt-3',
        name: 'Cerberus Packet Sentry',
        version: 'v4.1.0',
        status: 'online',
        accuracy: 99.9,
        threats_detected: 8140,
        last_active: 'Just now',
        model_type: 'Deep Packet Inspection Graph Net',
      },
      {
        id: 'agt-4',
        name: 'PhishCatcher NLP Sentinel',
        version: 'v1.9.5',
        status: 'online',
        accuracy: 97.8,
        threats_detected: 643,
        last_active: '1m ago',
        model_type: 'LLM Prompt & Token Classifier',
      },
    ];

    for (const agt of initialAgents) {
      await dbRun(
        `INSERT INTO agents (id, name, version, status, accuracy, threats_detected, last_active, model_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          agt.id,
          agt.name,
          agt.version,
          agt.status,
          agt.accuracy,
          agt.threats_detected,
          agt.last_active,
          agt.model_type,
        ]
      );
    }
    console.log('[DB] Seeded AI sentinel agents.');
  }

  // Seed default settings if empty
  const settingCount = await dbGet<{ count: number }>('SELECT count(*) as count FROM system_settings');
  if (!settingCount || settingCount.count === 0) {
    const defaultSettings = [
      { key: 'defense_mode', value: 'autonomous' },
      { key: 'email_alerts', value: 'true' },
      { key: 'slack_webhook', value: 'https://hooks.slack.com/services/T00/B00/XXXX' },
    ];
    for (const s of defaultSettings) {
      await dbRun('INSERT INTO system_settings (key, value) VALUES (?, ?)', [s.key, s.value]);
    }
  }

  console.log('[DB] SQLite database initialized and ready.');
};

export default db;
