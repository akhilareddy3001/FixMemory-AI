import { Incident, Service, Engineer, MemoryLog } from '../models/index.js';
import { retainMemory } from '../services/hindsightService.js';

/**
 * Helper to generate next sequential incident number
 */
const getNextIncidentNumber = async () => {
  const latestIncident = await Incident.findOne({}, { incidentNumber: 1 })
    .sort({ createdAt: -1 })
    .lean();

  if (!latestIncident || !latestIncident.incidentNumber) {
    return 'INC-1001';
  }

  const match = latestIncident.incidentNumber.match(/^INC-(\d+)$/i);

  if (match && match[1]) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `INC-${nextNum}`;
  }

  const total = await Incident.countDocuments();
  return `INC-${1000 + total + 1}`;
};

/**
 * GET /api/incidents
 */
export const getIncidents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      severity,
      serviceId,
    } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (severity && severity !== 'ALL') {
      query.severity = severity;
    }

    if (serviceId) {
      query.serviceId = serviceId;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');

      query.$or = [
        { incidentNumber: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { errorMessage: searchRegex },
        { errorSignature: searchRegex },
      ];
    }

    const skip =
      (Math.max(1, parseInt(page, 10)) - 1) *
      parseInt(limit, 10);

    const take = Math.min(
      100,
      Math.max(1, parseInt(limit, 10))
    );

    const [incidents, total] = await Promise.all([
      Incident.find(query)
        .populate(
          'serviceId',
          'name slug tier healthStatus'
        )
        .populate(
          'assignedEngineerId',
          'name email role isOnCall'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),

      Incident.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        incidents,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: take,
          totalPages: Math.ceil(total / take) || 1,
        },
      },
      message: 'Incidents retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidents
 * Create new incident
 */
export const createIncident = async (req, res, next) => {
  try {
    const {
      title,
      description,
      severity = 'HIGH',
      serviceId,
      assignedEngineerId,
      errorMessage,
      errorSignature,
      stackTrace,
      rawLogs,
      metricsSnapshot,
      actorName = 'System',
    } = req.body;

    if (!title || !description || !serviceId) {
      return res.status(400).json({
        success: false,
        data: null,
        message:
          'title, description, and serviceId are required fields',
      });
    }

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Service with ID ${serviceId} not found`,
      });
    }

    if (assignedEngineerId) {
      const engineer = await Engineer.findById(
        assignedEngineerId
      );

      if (!engineer) {
        return res.status(404).json({
          success: false,
          data: null,
          message: `Engineer with ID ${assignedEngineerId} not found`,
        });
      }
    }

    const incidentNumber = await getNextIncidentNumber();

    const initialTimeline = [
      {
        timestamp: new Date(),
        actorType: 'SYSTEM',
        actorName,
        action: 'Incident Created',
        details: `Incident ${incidentNumber} created with severity ${severity}.`,
      },
    ];

    const incident = await Incident.create({
      incidentNumber,
      title,
      description,
      severity,
      status: 'TRIGGERED',
      serviceId,
      assignedEngineerId: assignedEngineerId || null,
      errorMessage: errorMessage || '',
      errorSignature:
        errorSignature ||
        (errorMessage ? errorMessage.slice(0, 100) : ''),
      stackTrace: stackTrace || '',
      rawLogs: rawLogs || '',
      metricsSnapshot:
        metricsSnapshot || {
          cpuUsage: 0,
          memoryUsage: 0,
          errorRate: 0,
          latencyP99: 0,
        },
      timeline: initialTimeline,
      hypotheses: [],
      failedApproaches: [],
      preventativeActions: [],

      // All FixMemory incidents use the shared Hindsight bank
      hindsightContext: {
        bankId: 'fixmemory-main',
        recalledMemories: [],
        retentionStatus: 'PENDING',
      },
    });

    if (assignedEngineerId) {
      await Engineer.findByIdAndUpdate(
        assignedEngineerId,
        {
          $inc: {
            currentAssignedIncidents: 1,
          },
        }
      );
    }

    const populatedIncident = await Incident.findById(
      incident._id
    )
      .populate(
        'serviceId',
        'name slug tier healthStatus'
      )
      .populate(
        'assignedEngineerId',
        'name email role isOnCall'
      );

    return res.status(201).json({
      success: true,
      data: populatedIncident,
      message: `Incident ${incidentNumber} created successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/incidents/:id
 */
export const getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const incident = await Incident.findById(id)
      .populate(
        'serviceId',
        'name slug tier description healthStatus ownerTeam environment'
      )
      .populate(
        'assignedEngineerId',
        'name email role avatarUrl isOnCall specialties'
      );

    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Incident with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: incident,
      message: 'Incident details retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/incidents/:id/status
 */
export const updateIncidentStatus = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const {
      status,
      actorName = 'Engineer',
      notes,
    } = req.body;

    const validStatuses = [
      'TRIGGERED',
      'INVESTIGATING',
      'MITIGATED',
      'RESOLVED',
      'CLOSED',
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid status. Must be one of: ${validStatuses.join(
          ', '
        )}`,
      });
    }

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Incident with ID ${id} not found`,
      });
    }

    const prevStatus = incident.status;

    incident.status = status;

    incident.timeline.push({
      timestamp: new Date(),
      actorType: 'HUMAN',
      actorName,
      action: `Status Changed: ${prevStatus} ➔ ${status}`,
      details:
        notes ||
        `Incident status updated to ${status}`,
    });

    await incident.save();

    return res.status(200).json({
      success: true,
      data: incident,
      message: `Incident status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidents/:id/timeline
 */
export const addTimelineEvent = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const {
      action,
      details,
      actorType = 'HUMAN',
      actorName = 'Engineer',
      commandExecuted,
      commandOutput,
    } = req.body;

    if (!action || action.trim() === '') {
      return res.status(400).json({
        success: false,
        data: null,
        message:
          'action is required for timeline events',
      });
    }

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Incident with ID ${id} not found`,
      });
    }

    const newEvent = {
      timestamp: new Date(),
      actorType,
      actorName,
      action: action.trim(),
      details: details ? details.trim() : '',
      commandExecuted: commandExecuted
        ? commandExecuted.trim()
        : undefined,
      commandOutput: commandOutput
        ? commandOutput.trim()
        : undefined,
    };

    incident.timeline.push(newEvent);

    await incident.save();

    return res.status(200).json({
      success: true,
      data:
        incident.timeline[
          incident.timeline.length - 1
        ],
      message: 'Timeline event recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidents/:id/resolve
 * Resolve incident and store the solution in Hindsight
 */
export const resolveIncident = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    const {
      rootCause,
      resolutionSummary,
      failedApproaches = [],
      preventativeActions = [],
      actorName = 'Lead SRE',
    } = req.body;

    if (!rootCause || !resolutionSummary) {
      return res.status(400).json({
        success: false,
        data: null,
        message:
          'rootCause and resolutionSummary are required to resolve an incident',
      });
    }

    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Incident with ID ${id} not found`,
      });
    }

    const resolvedAt = new Date();

    const createdAtMs = new Date(
      incident.createdAt
    ).getTime();

    const resolvedAtMs = resolvedAt.getTime();

    const mttrMinutes = Math.max(
      1,
      Math.round(
        (resolvedAtMs - createdAtMs) /
          (1000 * 60)
      )
    );

    incident.status = 'RESOLVED';
    incident.resolvedAt = resolvedAt;
    incident.mttrMinutes = mttrMinutes;

    incident.rootCause = rootCause.trim();
    incident.resolutionSummary =
      resolutionSummary.trim();

    incident.failedApproaches =
      failedApproaches;

    incident.preventativeActions =
      preventativeActions;

    incident.hindsightContext.bankId =
      'fixmemory-main';

    incident.timeline.push({
      timestamp: resolvedAt,
      actorType: 'HUMAN',
      actorName,
      action: 'Incident Resolved',
      details: `Resolution: ${resolutionSummary}. MTTR: ${mttrMinutes} minutes. Root Cause: ${rootCause}`,
    });

    // Create structured and meaningful memory content for semantic recall
    const memoryParts = [
      'Incident Experience:',
      `Incident: ${incident.incidentNumber}`,
      `Title: ${incident.title}`,
      `Service: ${incident.serviceId?.name || 'Production Service'}`,
      '',
      'Symptoms:',
      incident.description || 'Service disruption observed.',
      '',
      'Error:',
      incident.errorMessage || 'No specific error message recorded.',
      '',
      'Error Signature:',
      incident.errorSignature || incident.errorMessage?.slice(0, 100) || 'None',
      '',
      'Root Cause:',
      incident.rootCause,
      '',
      'Successful Solution:',
      incident.resolutionSummary,
    ];

    if (incident.failedApproaches && incident.failedApproaches.length > 0) {
      memoryParts.push('', 'Failed Approaches (Anti-Patterns to Avoid):');
      incident.failedApproaches.forEach((fa, idx) => {
        memoryParts.push(
          `${idx + 1}. Attempted: ${fa.actionTaken}`,
          `   Why It Failed: ${fa.whyItFailed}${fa.negativeImpact ? ` | Impact: ${fa.negativeImpact}` : ''}`
        );
      });
    }

    if (incident.preventativeActions && incident.preventativeActions.length > 0) {
      memoryParts.push('', 'Preventative Actions:');
      incident.preventativeActions.forEach((pa) => {
        memoryParts.push(`- ${pa}`);
      });
    }

    memoryParts.push(
      '',
      `MTTR: ${mttrMinutes} minutes`,
      'Outcome: Resolved successfully.'
    );

    const memoryContent = memoryParts.join('\n');

    // Send the resolved incident experience to Hindsight
    try {
      console.log(
        `[Hindsight Retain] Storing incident ${incident.incidentNumber} in bank fixmemory-main...`
      );

      const startTime = Date.now();
      const retainResult = await retainMemory(
        memoryContent,
        {
          bankId: 'fixmemory-main',
        }
      );
      const latencyMs = Date.now() - startTime;

      console.log(
        '[Hindsight Retain] Success:',
        JSON.stringify(retainResult)
      );

      incident.hindsightContext.retentionStatus = 'RETAINED';
      incident.hindsightContext.retainedAt = new Date();

      await incident.save();

      // Log to MemoryLog audit trail
      await MemoryLog.create({
        operation: 'RETAIN',
        bankId: 'fixmemory-main',
        incidentId: incident._id,
        queryPrompt: `${incident.incidentNumber}: ${incident.title}`,
        payload: {
          incidentNumber: incident.incidentNumber,
          contentPreview: memoryContent.slice(0, 300),
          response: retainResult,
        },
        latencyMs,
        status: 'SUCCESS',
      }).catch((logErr) => console.error('[MemoryLog Retain] Error logging:', logErr.message));
    } catch (memoryError) {
      console.error(
        '[Hindsight Retain] Failed (temporarily unavailable):',
        memoryError.message || memoryError
      );

      incident.hindsightContext.retentionStatus = 'FAILED';

      await incident.save();

      // Log failure to MemoryLog audit trail
      await MemoryLog.create({
        operation: 'RETAIN',
        bankId: 'fixmemory-main',
        incidentId: incident._id,
        queryPrompt: `${incident.incidentNumber}: ${incident.title}`,
        payload: {
          incidentNumber: incident.incidentNumber,
          contentPreview: memoryContent.slice(0, 300),
        },
        status: 'ERROR',
        errorMessage: memoryError.message || 'Hindsight Retain request failed',
      }).catch((logErr) => console.error('[MemoryLog Retain] Error logging:', logErr.message));
    }

    // Update assigned engineer count
    if (incident.assignedEngineerId) {
      await Engineer.findByIdAndUpdate(
        incident.assignedEngineerId,
        {
          $inc: {
            currentAssignedIncidents: -1,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,
      data: incident,
      message: `Incident resolved successfully. MTTR: ${mttrMinutes} minutes.`,
    });
  } catch (error) {
    next(error);
  }
};