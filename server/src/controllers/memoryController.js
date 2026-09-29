import { Incident, MemoryLog } from '../models/index.js';

/**
 * GET /api/memory/overview
 * Returns stored Hindsight incident memories and memory activity logs.
 */
export const getMemoryOverview = async (req, res, next) => {
  try {
    const [
      storedIncidents,
      totalRetainedMemories,
      totalRecallEvents,
      totalRetainEvents,
      recentActivity,
    ] = await Promise.all([
      Incident.find({
        $or: [
          { 'hindsightContext.retentionStatus': 'RETAINED' },
          { status: 'RESOLVED', rootCause: { $exists: true, $ne: '' } },
        ],
      })
        .populate('serviceId', 'name slug tier')
        .sort({ updatedAt: -1 })
        .lean(),

      Incident.countDocuments({
        $or: [
          { 'hindsightContext.retentionStatus': 'RETAINED' },
          { status: 'RESOLVED', rootCause: { $exists: true, $ne: '' } },
        ],
      }),

      MemoryLog.countDocuments({ operation: 'RECALL' }),
      MemoryLog.countDocuments({ operation: 'RETAIN' }),

      MemoryLog.find()
        .populate('incidentId', 'incidentNumber title severity')
        .sort({ timestamp: -1 })
        .limit(30)
        .lean(),
    ]);

    // Format stored memories for clear display
    const storedMemories = storedIncidents.map((inc) => ({
      _id: inc._id,
      incidentNumber: inc.incidentNumber,
      title: inc.title,
      serviceName: inc.serviceId?.name || 'General Platform',
      serviceSlug: inc.serviceId?.slug,
      tier: inc.serviceId?.tier || 'TIER_1',
      severity: inc.severity,
      rootCause: inc.rootCause || 'Root cause logged during postmortem',
      resolutionSummary: inc.resolutionSummary || 'Resolution steps recorded',
      failedApproaches: inc.failedApproaches || [],
      preventativeActions: inc.preventativeActions || [],
      retainedAt: inc.hindsightContext?.retainedAt || inc.resolvedAt || inc.updatedAt,
      retentionStatus: inc.hindsightContext?.retentionStatus || 'RETAINED',
      bankId: inc.hindsightContext?.bankId || 'fixmemory-main',
      memoryType: 'Incident Experience & RCA',
      mttrMinutes: inc.mttrMinutes,
      memoryText: [
        `Incident Experience: ${inc.incidentNumber} - ${inc.title}`,
        `Service: ${inc.serviceId?.name || 'N/A'}`,
        `Root Cause: ${inc.rootCause || 'N/A'}`,
        `Successful Solution: ${inc.resolutionSummary || 'N/A'}`,
        inc.failedApproaches?.length
          ? `Failed Approaches: ${inc.failedApproaches.map((f) => `${f.actionTaken} (${f.whyItFailed})`).join('; ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    }));

    return res.status(200).json({
      success: true,
      data: {
        bankId: 'fixmemory-main',
        totalRetainedMemories,
        totalRecallEvents,
        totalRetainEvents,
        storedMemories,
        recentActivity,
      },
      message: 'Memory overview retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
