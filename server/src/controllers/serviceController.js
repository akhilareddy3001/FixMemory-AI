import { Service, Incident } from '../models/index.js';

/**
 * GET /api/services
 * Returns all services with active and total incident counts
 */
export const getServices = async (req, res, next) => {
  try {
    const services = await Service.find().populate('dependencies', 'name slug healthStatus').lean();

    // Aggregate incident counts per service
    const incidentCounts = await Incident.aggregate([
      {
        $group: {
          _id: '$serviceId',
          totalIncidents: { $sum: 1 },
          activeIncidents: {
            $sum: {
              $cond: [{ $in: ['$status', ['TRIGGERED', 'INVESTIGATING']] }, 1, 0],
            },
          },
        },
      },
    ]);

    const countMap = {};
    incidentCounts.forEach((item) => {
      countMap[item._id.toString()] = {
        total: item.totalIncidents,
        active: item.activeIncidents,
      };
    });

    const enrichedServices = services.map((svc) => ({
      ...svc,
      incidentStats: countMap[svc._id.toString()] || { total: 0, active: 0 },
    }));

    return res.status(200).json({
      success: true,
      data: enrichedServices,
      message: 'Services retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/services
 * Create a new microservice
 */
export const createService = async (req, res, next) => {
  try {
    const { name, slug, tier, description, repositoryUrl, ownerTeam, environment, dependencies, healthStatus, hindsightBankId } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'name and slug are required fields',
      });
    }

    const existing = await Service.findOne({
      $or: [{ name: name.trim() }, { slug: slug.trim().toLowerCase() }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'A service with this name or slug already exists',
      });
    }

    const service = await Service.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      tier: tier || 'TIER_1',
      description,
      repositoryUrl,
      ownerTeam: ownerTeam || 'DevOps & SRE',
      environment: environment || 'production',
      dependencies: dependencies || [],
      healthStatus: healthStatus || 'HEALTHY',
      hindsightBankId: hindsightBankId || 'fixmemory-main',
    });

    return res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/services/:id
 */
export const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).populate('dependencies', 'name slug healthStatus tier');

    if (!service) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Service with ID ${id} not found`,
      });
    }

    const incidents = await Incident.find({ serviceId: id })
      .select('incidentNumber title severity status createdAt resolvedAt mttrMinutes')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...service.toObject(),
        recentIncidents: incidents,
      },
      message: 'Service details retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/services/:id
 */
export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const service = await Service.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Service with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
      message: 'Service updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/services/:id
 */
export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Service with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: { id },
      message: 'Service deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
