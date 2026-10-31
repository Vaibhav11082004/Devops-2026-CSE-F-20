import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from './models/User.js';
import { IncidentModel } from './models/Incident.js';
import { AgentModel } from './models/Agent.js';
import { SettingModel } from './models/Setting.js';

export let isMongoConnected = false;

export const initMongoDB = async (mongoUri?: string): Promise<boolean> => {
  const uri = mongoUri || process.env.MONGODB_URI;
  if (!uri) {
    console.log('[DB] No MONGODB_URI provided. Defaulting to SQLite database.');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log(`[DB] Successfully connected to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}`);

    // Seed default demo user if empty
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      const passwordHash = await bcrypt.hash('password123', 10);
      await UserModel.create({
        id: 'usr_sentinel_007',
        name: 'Alex Rivera',
        email: 'alex.rivera@sentinel.ai',
        passwordHash,
        role: 'SecOps Director',
        organization: 'Sentinel Enterprise Defense',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
      console.log('[DB-Mongo] Seeded initial demo user.');
    }

    // Seed default incidents if empty
    const incidentCount = await IncidentModel.countDocuments();
    if (incidentCount === 0) {
      await IncidentModel.insertMany([
        {
          id: 'INC-9042',
          title: 'Distributed Port Scan & SSH Credential Stuffing',
          type: 'Brute Force',
          severity: 'critical',
          target: 'prod-auth-cluster-04',
          sourceIp: '185.220.101.5',
          timestamp: '2 mins ago',
          status: 'blocked',
          aiConfidence: 99.4,
        },
        {
          id: 'INC-9041',
          title: 'Anomalous Outbound Data Burst (S3 Bucket)',
          type: 'Data Exfiltration',
          severity: 'high',
          target: 's3://vault-customer-pii',
          sourceIp: '10.244.12.89',
          timestamp: '14 mins ago',
          status: 'investigating',
          aiConfidence: 94.2,
        },
      ]);
      console.log('[DB-Mongo] Seeded initial incidents.');
    }

    return true;
  } catch (error) {
    console.warn('[DB] MongoDB connection unavailable. Falling back seamlessly to SQLite.');
    isMongoConnected = false;
    return false;
  }
};
