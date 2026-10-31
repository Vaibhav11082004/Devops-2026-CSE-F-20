import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  id: string;
  title: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  target: string;
  sourceIp: string;
  timestamp: string;
  status: 'investigating' | 'mitigated' | 'blocked' | 'active';
  aiConfidence: number;
}

const IncidentSchema = new Schema<IIncident>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  severity: { type: String, required: true, enum: ['critical', 'high', 'medium', 'low'] },
  target: { type: String, required: true },
  sourceIp: { type: String, required: true },
  timestamp: { type: String, required: true },
  status: { type: String, required: true, enum: ['investigating', 'mitigated', 'blocked', 'active'] },
  aiConfidence: { type: Number, required: true },
});

export const IncidentModel = mongoose.models.Incident || mongoose.model<IIncident>('Incident', IncidentSchema);
