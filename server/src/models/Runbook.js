import mongoose from 'mongoose';

const actionStepSchema = new mongoose.Schema(
  {
    stepNumber: {
      type: Number,
      required: true,
    },
    instruction: {
      type: String,
      required: true,
      trim: true,
    },
    cliCommand: {
      type: String,
      trim: true,
    },
    isAutomated: {
      type: Boolean,
      default: false,
    },
    dangerLevel: {
      type: String,
      enum: ['SAFE_READONLY', 'CAUTION_MUTATING', 'HIGH_RISK'],
      default: 'SAFE_READONLY',
    },
  },
  { _id: false }
);

const runbookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Runbook title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Runbook slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      index: true,
    },
    triggerKeywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    summary: {
      type: String,
      trim: true,
    },
    markdownContent: {
      type: String,
      required: [true, 'Markdown content is required'],
    },
    actionSteps: [actionStepSchema],
    author: {
      type: String,
      default: 'DevOps / SRE Team',
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

runbookSchema.index({ triggerKeywords: 1 });

export const Runbook = mongoose.model('Runbook', runbookSchema);
export default Runbook;
