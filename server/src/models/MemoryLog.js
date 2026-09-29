import mongoose from 'mongoose';

const memoryLogSchema = new mongoose.Schema(
  {
    operation: {
      type: String,
      enum: ['RETAIN', 'RECALL', 'REFLECT'],
      required: [true, 'Memory operation type is required'],
      index: true,
    },
    bankId: {
      type: String,
      required: [true, 'Hindsight bankId is required'],
      index: true,
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      index: true,
    },
    queryPrompt: {
      type: String,
      trim: true,
    },
    retrievedCount: {
      type: Number,
      default: 0,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'ERROR'],
      default: 'SUCCESS',
      index: true,
    },
    errorMessage: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const MemoryLog = mongoose.model('MemoryLog', memoryLogSchema);
export default MemoryLog;
