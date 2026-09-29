import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Service slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['TIER_0', 'TIER_1', 'TIER_2'],
      default: 'TIER_1',
    },
    description: {
      type: String,
      trim: true,
    },
    repositoryUrl: {
      type: String,
      trim: true,
    },
    ownerTeam: {
      type: String,
      default: 'DevOps & SRE',
      trim: true,
    },
    environment: {
      type: String,
      enum: ['production', 'staging'],
      default: 'production',
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    healthStatus: {
      type: String,
      enum: ['HEALTHY', 'DEGRADED', 'OUTAGE', 'MAINTENANCE'],
      default: 'HEALTHY',
      index: true,
    },
    hindsightBankId: {
      type: String,
      default: 'fixmemory-main',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

export const Service = mongoose.model('Service', serviceSchema);
export default Service;
