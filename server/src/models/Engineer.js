import mongoose from 'mongoose';

const engineerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Engineer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Engineer email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      default: 'DevOps / SRE Engineer',
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    isOnCall: {
      type: Boolean,
      default: false,
      index: true,
    },
    specialties: [
      {
        type: String,
        trim: true,
      },
    ],
    currentAssignedIncidents: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Engineer = mongoose.model('Engineer', engineerSchema);
export default Engineer;
