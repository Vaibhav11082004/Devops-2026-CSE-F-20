import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
  id: string;
  name: string;
  version: string;
  status: 'online' | 'analyzing' | 'training' | 'standby';
  accuracy: number;
  threatsDetected: number;
  lastActive: string;
  modelType: string;
}

const AgentSchema = new Schema<IAgent>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  version: { type: String, required: true },
  status: { type: String, required: true },
  accuracy: { type: Number, required: true },
  threatsDetected: { type: Number, required: true },
  lastActive: { type: String, required: true },
  modelType: { type: String, required: true },
});

export const AgentModel = mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);
