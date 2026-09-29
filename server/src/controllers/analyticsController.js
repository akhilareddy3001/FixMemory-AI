import { Incident, Service } from '../models/index.js';

/**
 * GET /api/analytics/overview
 * Real data analytics calculated dynamically from MongoDB Atlas
 */
export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const [
      totalIncidents,
      activeIncidents,
      criticalIncidents,
      resolvedIncidents,
      mttrResult,
      severityCounts,
      statusCounts,
      serviceCounts,
      recurringSignatures,
      memoryAssistedIncidents,
      memoryRetentionSuccesses,
      memoryRetentionFailures,
      failedApproachesRecorded,
      recentLearningMemories,
    ] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: { $in: ['TRIGGERED', 'INVESTIGATING'] } }),
      Incident.countDocuments({ severity: 'CRITICAL' }),
      Incident.countDocuments({ status: 'RESOLVED' }),
      // Average MTTR from resolved incidents
      Incident.aggregate([
        { $match: { status: 'RESOLVED', mttrMinutes: { $ne: null, $gt: 0 } } },
        { $group: { _id: null, avgMttr: { $avg: '$mttrMinutes' } } },
      ]),
      // Incidents by severity
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      // Incidents by status
      Incident.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Incidents by service with service name
      Incident.aggregate([
        { $group: { _id: '$serviceId', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: '_id',
            as: 'serviceInfo',
          },
        },
        { $unwind: { path: '$serviceInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            serviceId: '$_id',
            serviceName: { $ifNull: ['$serviceInfo.name', 'Unknown Service'] },
            tier: '$serviceInfo.tier',
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),
      // Recurring incidents (same errorSignature occurring > 1 time)
      Incident.aggregate([
        {
          $match: {
            errorSignature: { $exists: true, $ne: '' },
          },
        },
        {
          $group: {
            _id: '$errorSignature',
            count: { $sum: 1 },
            serviceId: { $first: '$serviceId' },
            latestIncident: { $last: '$incidentNumber' },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ]),
      // Incidents with recalled memories
      Incident.countDocuments({
        'hindsightContext.recalledMemories.0': { $exists: true },
      }),
      // Retention successes
      Incident.countDocuments({
        'hindsightContext.retentionStatus': 'RETAINED',
      }),
      // Retention failures
      Incident.countDocuments({
        'hindsightContext.retentionStatus': 'FAILED',
      }),
      // Count total failed approaches across all incidents
      Incident.aggregate([
        { $project: { failedCount: { $size: { $ifNull: ['$failedApproaches', []] } } } },
        { $group: { _id: null, total: { $sum: '$failedCount' } } },
      ]),
      // Recent retained incidents for FixMemory Learning
      Incident.find({
        $or: [
          { 'hindsightContext.retentionStatus': 'RETAINED' },
          { status: 'RESOLVED', rootCause: { $exists: true, $ne: '' } },
        ],
      })
        .populate('serviceId', 'name')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const averageMttr = mttrResult.length > 0 ? Math.round(mttrResult[0].avgMttr * 10) / 10 : 0;
    const totalFailedApproaches =
      failedApproachesRecorded.length > 0 ? failedApproachesRecorded[0].total : 0;

    // Format severity dictionary with defaults
    const bySeverity = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    severityCounts.forEach((item) => {
      if (item._id && bySeverity[item._id] !== undefined) {
        bySeverity[item._id] = item.count;
      }
    });

    // Format status dictionary
    const byStatus = {
      TRIGGERED: 0,
      INVESTIGATING: 0,
      MITIGATED: 0,
      RESOLVED: 0,
      CLOSED: 0,
    };
    statusCounts.forEach((item) => {
      if (item._id && byStatus[item._id] !== undefined) {
        byStatus[item._id] = item.count;
      }
    });

    // Count recurring incident occurrences
    const recurringIncidentCount = recurringSignatures.reduce((acc, curr) => acc + curr.count, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalIncidents,
        activeIncidents,
        criticalIncidents,
        resolvedIncidents,
        averageMttr,
        incidentsBySeverity: bySeverity,
        incidentsByStatus: byStatus,
        incidentsByService: serviceCounts,
        recurringIncidents: {
          uniquePatterns: recurringSignatures.length,
          totalOccurrences: recurringIncidentCount,
          patterns: recurringSignatures,
        },
        // Memory-specific KPIs
        memoryAssistedIncidents: memoryAssistedIncidents || 0,
        memoryRetentionSuccesses: memoryRetentionSuccesses || 0,
        memoryRetentionFailures: memoryRetentionFailures || 0,
        failedApproachesRecorded: totalFailedApproaches,
        recentLearningMemories: recentLearningMemories.map((m) => ({
          _id: m._id,
          incidentNumber: m.incidentNumber,
          title: m.title,
          serviceName: m.serviceId?.name || 'Platform',
          rootCause: m.rootCause,
          resolution: m.resolutionSummary,
          retainedAt: m.hindsightContext?.retainedAt || m.updatedAt,
          failedCount: m.failedApproaches?.length || 0,
        })),
      },
      message: 'Analytics overview retrieved successfully from MongoDB',
    });
  } catch (error) {
    next(error);
  }
};
