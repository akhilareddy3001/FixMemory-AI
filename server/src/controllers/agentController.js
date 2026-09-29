import { Incident, Runbook, MemoryLog } from '../models/index.js';
import { recallMemories, retainMemory } from '../services/hindsightService.js';

/**
 * Synthesizes a contextual AI recommendation from Current Incident + Recalled Memories + Matched Runbook.
 */
function generateContextualRecommendation(incident, memories, matchedRunbook) {
  // If we have recalled memories from Hindsight
  if (memories && memories.length > 0) {
    let rootCauseHint = '';
    let solutionHint = '';
    const failedApproachesFound = [];
    const referencedIncidents = [];

    memories.forEach((mem) => {
      const text = mem.text || mem.content || '';
      
      // Look for incident IDs like INC-1001, INC-1003
      const incMatches = text.match(/INC-\d+/gi);
      if (incMatches) {
        incMatches.forEach((m) => {
          const upper = m.toUpperCase();
          if (!referencedIncidents.includes(upper)) {
            referencedIncidents.push(upper);
          }
        });
      }

      // Look for Root Cause
      const rcMatch = text.match(/(?:Root Cause|Root cause):\s*([^\n]+)/i);
      if (rcMatch && !rootCauseHint) {
        rootCauseHint = rcMatch[1].trim();
      }

      // Look for Successful Solution / Resolution
      const solMatch = text.match(/(?:Successful Solution|Resolution|Solution):\s*([^\n]+)/i);
      if (solMatch && !solutionHint) {
        solutionHint = solMatch[1].trim();
      }

      // Look for Failed Approach / Attempted
      const faMatch = text.match(/(?:Failed Approach|Attempted|Failed approach):\s*([^\n]+)/i);
      const whyMatch = text.match(/(?:Why It Failed|Why failed|Failed because):\s*([^\n]+)/i);
      if (faMatch) {
        const actionTaken = faMatch[1].trim();
        const whyItFailed = whyMatch ? whyMatch[1].trim() : 'Documented negative impact in previous incident.';
        if (!failedApproachesFound.some((f) => f.actionTaken === actionTaken)) {
          failedApproachesFound.push({ actionTaken, whyItFailed });
        }
      }
    });

    const recommendedAction =
      solutionHint ||
      `Apply historical resolution pattern for ${incident.serviceId?.name || 'affected service'}`;

    const reason = rootCauseHint
      ? `A previous incident (${referencedIncidents.join(', ') || 'historical'}) with a similar pattern was resolved by addressing root cause: ${rootCauseHint}.`
      : `Hindsight recalled ${memories.length} relevant past experiences matching this error signature.`;

    const avoid =
      failedApproachesFound.length > 0
        ? failedApproachesFound.map(
            (fa) => `${fa.actionTaken} — Failed previously: ${fa.whyItFailed}`
          )
        : [
            'Do not restart primary databases or flush production caches without verifying socket/client leaks first.',
          ];

    const suggestedNextSteps = [
      '1. Verify active connection leaks and socket pools before restarting pods.',
      solutionHint
        ? `2. Recommended remediation: ${solutionHint}`
        : '2. Apply targeted fix indicated by recalled memory experience.',
      '3. Monitor p99 latency and error rates to confirm service stabilization.',
    ];

    return {
      recommendationSource: 'HINDSIGHT_ORGANIZATIONAL_MEMORY',
      action: recommendedAction,
      reason,
      avoid,
      failedApproaches: failedApproachesFound,
      referencedIncidents,
      suggestedNextSteps,
      confidence: (memories[0]?.score || 0) > 0.7 ? 'HIGH' : 'MEDIUM',
    };
  }

  // Fallback: If no memories recalled from Hindsight, check matched runbook
  if (matchedRunbook) {
    return {
      recommendationSource: 'RUNBOOK_SOP',
      action: `Execute SOP: ${matchedRunbook.title}`,
      reason: `Matched Standard Operating Procedure based on error signature: "${matchedRunbook.triggerKeywords?.join(', ') || 'keyword match'}"`,
      avoid: ['Do not execute mutating commands without inspecting read-only diagnostic output first.'],
      failedApproaches: [],
      referencedIncidents: [],
      suggestedNextSteps:
        matchedRunbook.actionSteps?.map(
          (s) => `${s.stepNumber}. ${s.instruction}`
        ) || [
          '1. Run read-only diagnostic checks.',
          '2. Inspect process logs.',
        ],
      confidence: 'MEDIUM',
    };
  }

  // Fallback heuristic
  return {
    recommendationSource: 'HEURISTIC_TRIAGE',
    action: `Inspect ${incident.serviceId?.name || 'service'} error logs and health metrics`,
    reason: 'New incident pattern without prior Hindsight memory or matched runbook.',
    avoid: ['Avoid drastic configuration changes or cluster restarts.'],
    failedApproaches: [],
    referencedIncidents: [],
    suggestedNextSteps: [
      '1. Isolate the affected pods or nodes.',
      '2. Collect stack traces and memory snapshots.',
      '3. Resolve the issue and record the solution to train FixMemory.',
    ],
    confidence: 'INITIAL_TRIAGE',
  };
}

/**
 * POST /api/incidents/analyze/:incidentId
 * Analyze an incident using FixMemory's persistent Hindsight memory + Runbook matching.
 */
export const analyzeIncident = async (req, res, next) => {
  try {
    const { incidentId } = req.params;

    // Get the incident from MongoDB
    const incident = await Incident.findById(incidentId)
      .populate('serviceId', 'name slug tier healthStatus')
      .populate('assignedEngineerId', 'name email role isOnCall');

    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Incident with ID ${incidentId} not found`,
      });
    }

    // Build a comprehensive memory search query
    const memoryQuery = [
      `Incident: ${incident.title}`,
      `Description: ${incident.description}`,
      `Error: ${incident.errorMessage || ''}`,
      `Error signature: ${incident.errorSignature || ''}`,
      `Service: ${incident.serviceId?.name || ''}`,
    ].join('. ');

    let memories = [];
    let memoryRecallSuccess = false;
    const startTime = Date.now();

    // Ask Hindsight to recall similar past incidents
    try {
      const hindsightResponse = await recallMemories(memoryQuery, {
        bankId: 'fixmemory-main',
        maxTokens: 2000,
      });

      memories = hindsightResponse?.results || [];
      memoryRecallSuccess = true;
      const latencyMs = Date.now() - startTime;

      // Log successful recall in MemoryLog audit trail
      await MemoryLog.create({
        operation: 'RECALL',
        bankId: 'fixmemory-main',
        incidentId: incident._id,
        queryPrompt: memoryQuery.slice(0, 300),
        retrievedCount: memories.length,
        payload: {
          incidentNumber: incident.incidentNumber,
          count: memories.length,
          topScore: memories[0]?.scores?.final || 0,
        },
        latencyMs,
        status: 'SUCCESS',
      }).catch((logErr) => console.error('[MemoryLog Recall] Error logging:', logErr.message));
    } catch (recallErr) {
      console.error(
        '[Hindsight Recall] Temporarily unavailable:',
        recallErr.message || recallErr
      );

      // Log failed recall in MemoryLog audit trail
      await MemoryLog.create({
        operation: 'RECALL',
        bankId: 'fixmemory-main',
        incidentId: incident._id,
        queryPrompt: memoryQuery.slice(0, 300),
        retrievedCount: 0,
        status: 'ERROR',
        errorMessage: recallErr.message || 'Hindsight recall unavailable',
      }).catch((logErr) => console.error('[MemoryLog Recall] Error logging:', logErr.message));
    }

    // Save recalled memories into the incident model
    incident.hindsightContext = {
      ...(incident.hindsightContext?.toObject?.() || incident.hindsightContext || {}),
      bankId: 'fixmemory-main',
      recalledMemories: memories.map((memory) => ({
        id: memory.id,
        text: memory.text,
        type: memory.type,
        score: memory.scores?.final || 0,
      })),
      retentionStatus: incident.hindsightContext?.retentionStatus || 'PENDING',
    };

    // Add timeline event
    incident.timeline.push({
      timestamp: new Date(),
      actorType: 'AI_AGENT',
      actorName: 'FixMemory Agent',
      action: 'Hindsight Memory Recall Executed',
      details: memoryRecallSuccess
        ? `Recalled ${memories.length} relevant historical memories from bank fixmemory-main.`
        : 'Hindsight service was offline; evaluated incident with runbook heuristics.',
    });

    await incident.save();

    // Check for matched runbooks in MongoDB
    let matchedRunbook = null;
    const errorText = (
      `${incident.errorMessage || ''} ${incident.errorSignature || ''} ${incident.title}`
    ).toLowerCase();

    const runbooks = await Runbook.find().lean();
    for (const rb of runbooks) {
      const match = rb.triggerKeywords?.some((kw) =>
        errorText.includes(kw.toLowerCase())
      );
      if (match) {
        matchedRunbook = rb;
        break;
      }
    }

    // Synthesize structured contextual AI recommendation
    const recommendation = generateContextualRecommendation(
      incident,
      memories,
      matchedRunbook
    );

    return res.status(200).json({
      success: true,
      data: {
        incidentId: incident._id,
        incidentNumber: incident.incidentNumber,
        title: incident.title,
        status: incident.status,
        severity: incident.severity,
        service: incident.serviceId,
        memoryUsed: memories.length > 0,
        memoriesRetrieved: memories.length,
        memories,
        memoryQuery,
        recommendation,
        recommendedRunbook: matchedRunbook
          ? {
              _id: matchedRunbook._id,
              title: matchedRunbook.title,
              summary: matchedRunbook.summary,
              actionSteps: matchedRunbook.actionSteps,
              author: matchedRunbook.author,
            }
          : null,
        message:
          memories.length > 0
            ? 'FixMemory found relevant past incidents and synthesized an action plan.'
            : memoryRecallSuccess
            ? 'No relevant past memories found. This is a new incident pattern.'
            : 'Hindsight memory engine is temporarily unavailable; local heuristic triage applied.',
      },
      message: 'Incident analyzed using FixMemory.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidents/ask
 * Ask FixMemory natural language questions using Hindsight Recall
 */
export const askFixMemory = async (req, res, next) => {
  try {
    const { question, incidentId } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Question is required to ask FixMemory',
      });
    }

    const trimmedQuestion = question.trim();
    let memories = [];
    let source = 'HINDSIGHT_RECALL';
    const startTime = Date.now();

    try {
      const response = await recallMemories(trimmedQuestion, {
        bankId: 'fixmemory-main',
        maxTokens: 2000,
      });

      memories = response?.results || [];
      const latencyMs = Date.now() - startTime;

      await MemoryLog.create({
        operation: 'RECALL',
        bankId: 'fixmemory-main',
        incidentId: incidentId || undefined,
        queryPrompt: trimmedQuestion,
        retrievedCount: memories.length,
        latencyMs,
        status: 'SUCCESS',
      }).catch((logErr) => console.error('[MemoryLog Ask] Error logging:', logErr.message));
    } catch (err) {
      console.error('[Ask FixMemory] Hindsight offline:', err.message);
      source = 'MONGODB_RECORDS';

      // Fallback search in MongoDB incidents — extract meaningful keywords
      const stopWords = new Set([
        'how', 'do', 'we', 'a', 'an', 'the', 'is', 'are', 'was', 'were',
        'what', 'why', 'when', 'where', 'which', 'who', 'can', 'could',
        'should', 'would', 'to', 'for', 'of', 'in', 'on', 'with', 'about',
        'handle', 'fix', 'solve', 'resolve', 'manage', 'get', 'make',
      ]);
      const keywords = trimmedQuestion
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w))
        .slice(0, 5);
      const keywordOr = keywords.flatMap((kw) => {
        const re = new RegExp(kw, 'i');
        return [
          { title: re },
          { rootCause: re },
          { description: re },
          { resolutionSummary: re },
          { errorMessage: re },
        ];
      });
      // If no useful keywords, fall back to a broad regex of first 20 chars
      const fallbackRegex = new RegExp(trimmedQuestion.slice(0, 20), 'i');
      const matchingIncidents = await Incident.find(
        keywordOr.length > 0
          ? { $or: keywordOr }
          : { $or: [{ title: fallbackRegex }, { rootCause: fallbackRegex }] }
      )
        .limit(3)
        .lean();

      memories = matchingIncidents.map((inc) => ({
        id: inc._id.toString(),
        text: `Incident: ${inc.incidentNumber} - ${inc.title}. Root cause: ${inc.rootCause || 'N/A'}. Resolution: ${inc.resolutionSummary || 'N/A'}.`,
        type: 'incident_record',
        score: 0.8,
      }));
    }

    // Synthesize response from recalled memories
    let answer = '';
    const memorySources = [];

    if (memories.length > 0) {
      memories.forEach((m) => {
        const text = m.text || '';
        const incMatch = text.match(/INC-\d+/i);
        if (incMatch && !memorySources.includes(incMatch[0])) {
          memorySources.push(incMatch[0]);
        }
      });

      const topMemoryText = memories[0].text || '';
      answer = `Based on FixMemory's stored organizational memory: ${topMemoryText.slice(0, 400)}...`;
    } else {
      answer =
        'FixMemory has no prior memory recorded for this specific inquiry. When you resolve related incidents, their root cause and resolution will be retained here automatically.';
    }

    return res.status(200).json({
      success: true,
      data: {
        question: trimmedQuestion,
        answer,
        relevantMemories: memories,
        memorySources,
        source,
      },
      message: 'Question processed by FixMemory AI',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/incidents/:id/feedback
 * SRE Feedback Loop: Records whether a recommendation worked, partially worked, or failed.
 * Retains failed approaches into Hindsight so future incidents avoid the same mistake.
 */
export const recordIncidentFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      outcome, // 'WORKED', 'PARTIALLY_WORKED', 'FAILED'
      actionTaken,
      whyItFailed,
      notes,
      actorName = 'SRE Responder',
    } = req.body;

    const incident = await Incident.findById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Incident with ID ${id} not found`,
      });
    }

    const validOutcomes = ['WORKED', 'PARTIALLY_WORKED', 'FAILED'];
    if (!outcome || !validOutcomes.includes(outcome)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid outcome. Must be one of: ${validOutcomes.join(', ')}`,
      });
    }

    // Append to timeline
    incident.timeline.push({
      timestamp: new Date(),
      actorType: 'HUMAN',
      actorName,
      action: `AI Recommendation Feedback: ${outcome}`,
      details: notes || `Outcome marked as ${outcome}. Action: ${actionTaken || 'N/A'}`,
    });

    // If failed, preserve negative knowledge
    if (outcome === 'FAILED' && actionTaken && whyItFailed) {
      incident.failedApproaches.push({
        actionTaken: actionTaken.trim(),
        whyItFailed: whyItFailed.trim(),
        negativeImpact: notes ? notes.trim() : undefined,
      });

      // Retain negative knowledge into Hindsight
      const negativeMemory = [
        'Negative Knowledge (Failed Approach):',
        `Incident: ${incident.incidentNumber} - ${incident.title}`,
        `Attempted Action: ${actionTaken.trim()}`,
        `Why It Failed: ${whyItFailed.trim()}`,
        notes ? `Impact: ${notes.trim()}` : '',
        'Rule: Do not repeat this action for similar symptoms.',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        console.log(`[Hindsight Retain] Retaining negative knowledge for ${incident.incidentNumber}...`);
        await retainMemory(negativeMemory, { bankId: 'fixmemory-main' });
        await MemoryLog.create({
          operation: 'RETAIN',
          bankId: 'fixmemory-main',
          incidentId: incident._id,
          queryPrompt: `Negative Knowledge: ${incident.incidentNumber}`,
          payload: { actionTaken, whyItFailed },
          status: 'SUCCESS',
        }).catch((err) => console.error('[MemoryLog Feedback Retain] Error:', err.message));
      } catch (err) {
        console.error('[Hindsight Retain] Failed to store negative knowledge:', err.message);
      }
    }

    await incident.save();

    return res.status(200).json({
      success: true,
      data: incident,
      message: `Feedback recorded as ${outcome}. Experience saved to FixMemory.`,
    });
  } catch (error) {
    next(error);
  }
};