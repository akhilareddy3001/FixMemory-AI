import mongoose from 'mongoose';
import { Setting } from '../models/index.js';
import { healthCheck } from '../services/hindsightService.js';

/**
 * Mask secret string values (keys, tokens, passwords)
 */
const maskSecretValue = (key, value) => {
  if (typeof value !== 'string') return value;
  const isSecret = /key|secret|password|token|auth/i.test(key);
  if (!isSecret) return value;
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 3)}••••••••${value.slice(-4)}`;
};

/**
 * GET /api/settings/health
 * Returns safe connection status of MongoDB, Hindsight, and AI config
 */
export const getSystemHealth = async (req, res, next) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
    let hindsightStatus = 'DISCONNECTED';
    let hindsightDetails = null;

    try {
      const hCheck = await healthCheck();
      hindsightStatus = 'CONNECTED';
      hindsightDetails = hCheck;
    } catch {
      hindsightStatus = 'DISCONNECTED';
    }

    return res.status(200).json({
      success: true,
      data: {
        mongodb: {
          status: mongoStatus,
          database: mongoose.connection.name || 'fixmemory',
        },
        hindsight: {
          status: hindsightStatus,
          bankId: 'fixmemory-main',
          endpoint: process.env.HINDSIGHT_BASE_URL || 'http://localhost:8888',
          details: hindsightDetails,
        },
        ai: {
          model: 'gemini-3.5-flash-lite',
          provider: 'Google Gemini (via Hindsight)',
          configured: true,
        },
        timestamp: new Date().toISOString(),
      },
      message: 'System health status retrieved',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/settings
 * Mask sensitive values
 */
export const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find().lean();

    const maskedSettings = settings.map((s) => ({
      ...s,
      value: maskSecretValue(s.key, s.value),
    }));

    return res.status(200).json({
      success: true,
      data: maskedSettings,
      message: 'System settings retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/settings/:key
 * Update or upsert a setting
 */
export const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'value is required to update a setting',
      });
    }

    const updated = await Setting.findOneAndUpdate(
      { key: key.trim() },
      {
        value,
        ...(description && { description: description.trim() }),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        ...updated.toObject(),
        value: maskSecretValue(updated.key, updated.value),
      },
      message: `Setting ${key} updated successfully`,
    });
  } catch (error) {
    next(error);
  }
};
