import { Engineer, Incident } from '../models/index.js';

/**
 * GET /api/engineers
 */
export const getEngineers = async (req, res, next) => {
  try {
    const { onCall } = req.query;
    const query = {};

    if (onCall !== undefined) {
      query.isOnCall = onCall === 'true';
    }

    const engineers = await Engineer.find(query).sort({ isOnCall: -1, name: 1 }).lean();

    return res.status(200).json({
      success: true,
      data: engineers,
      message: 'Engineers retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/engineers
 */
export const createEngineer = async (req, res, next) => {
  try {
    const { name, email, role, avatarUrl, isOnCall, specialties } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'name and email are required fields',
      });
    }

    const existing = await Engineer.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'An engineer with this email already exists',
      });
    }

    const engineer = await Engineer.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || 'DevOps / SRE Engineer',
      avatarUrl,
      isOnCall: Boolean(isOnCall),
      specialties: specialties || [],
    });

    return res.status(201).json({
      success: true,
      data: engineer,
      message: 'Engineer profile created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/engineers/:id
 */
export const getEngineerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const engineer = await Engineer.findById(id);

    if (!engineer) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Engineer with ID ${id} not found`,
      });
    }

    const activeIncidents = await Incident.find({
      assignedEngineerId: id,
      status: { $in: ['TRIGGERED', 'INVESTIGATING'] },
    })
      .select('incidentNumber title severity status createdAt')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...engineer.toObject(),
        activeIncidents,
      },
      message: 'Engineer details retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/engineers/:id
 * Allows updating on-call status, specialties, or assigned incidents
 */
export const updateEngineer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const engineer = await Engineer.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!engineer) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Engineer with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: engineer,
      message: 'Engineer profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
