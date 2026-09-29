import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    actorType: {
      type: String,
      enum: ['HUMAN', 'AI_AGENT', 'SYSTEM'],
      default: 'SYSTEM',
    },
    actorName: {
      type: String,
      default: 'System',
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    commandExecuted: {
      type: String,
      trim: true,
    },
    commandOutput: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const hypothesisSchema = new mongoose.Schema(
  {
    statement: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PROPOSED', 'VALIDATED', 'REFUTED'],
      default: 'PROPOSED',
    },
    testedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const failedApproachSchema = new mongoose.Schema(
  {
    actionTaken: {
      type: String,
      required: [true, 'actionTaken is required for failed approach'],
      trim: true,
    },
    whyItFailed: {
      type: String,
      required: [true, 'whyItFailed is required for failed approach'],
      trim: true,
    },
    negativeImpact: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const incidentSchema = new mongoose.Schema(
  {
    incidentNumber: {
      type: String,
      required: [true, 'Incident number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'HIGH',
      index: true,
    },
    status: {
      type: String,
      enum: ['TRIGGERED', 'INVESTIGATING', 'MITIGATED', 'RESOLVED', 'CLOSED'],
      default: 'TRIGGERED',
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'serviceId is required'],
      index: true,
    },
    assignedEngineerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Engineer',
    },
    errorMessage: {
      type: String,
      trim: true,
      index: true,
    },
    errorSignature: {
      type: String,
      trim: true,
      index: true,
    },
    stackTrace: {
      type: String,
    },
    rawLogs: {
      type: String,
    },
    metricsSnapshot: {
      cpuUsage: { type: Number, default: 0 },
      memoryUsage: { type: Number, default: 0 },
      errorRate: { type: Number, default: 0 },
      latencyP99: { type: Number, default: 0 },
    },
    timeline: [timelineEventSchema],
    hypotheses: [hypothesisSchema],
    failedApproaches: [failedApproachSchema],
    rootCause: {
      type: String,
      trim: true,
    },
    resolutionSummary: {
      type: String,
      trim: true,
    },
    preventativeActions: [
      {
        type: String,
        trim: true,
      },
    ],
    resolvedAt: {
      type: Date,
    },
    mttrMinutes: {
      type: Number,
      default: null,
    },
    hindsightContext: {
      bankId: {
        type: String,
        default: 'fixmemory-main',
      },
      recalledMemories: [
        {
          type: mongoose.Schema.Types.Mixed,
        },
      ],
      retainedAt: {
        type: Date,
      },
      retentionStatus: {
        type: String,
        enum: ['PENDING', 'RETAINED', 'FAILED'],
        default: 'PENDING',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Explicit secondary indexes
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ serviceId: 1, status: 1 });

export const Incident = mongoose.model('Incident', incidentSchema);
export default Incident;
