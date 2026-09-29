import { Runbook, Service } from '../models/index.js';

/**
 * GET /api/runbooks
 */
export const getRunbooks = async (req, res, next) => {
  try {
    const { serviceId, search } = req.query;
    const query = {};

    if (serviceId) {
      query.serviceId = serviceId;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { summary: searchRegex },
        { triggerKeywords: searchRegex },
      ];
    }

    const runbooks = await Runbook.find(query)
      .populate('serviceId', 'name slug tier')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: runbooks,
      message: 'Runbooks retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/runbooks
 */
export const createRunbook = async (req, res, next) => {
  try {
    const { title, slug, serviceId, triggerKeywords = [], summary, markdownContent, actionSteps = [], author } = req.body;

    if (!title || !slug || !markdownContent) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'title, slug, and markdownContent are required fields',
      });
    }

    const existing = await Runbook.findOne({ slug: slug.trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'A runbook with this slug already exists',
      });
    }

    const runbook = await Runbook.create({
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      serviceId: serviceId || null,
      triggerKeywords: triggerKeywords.map((k) => k.toLowerCase().trim()),
      summary: summary || '',
      markdownContent,
      actionSteps: actionSteps.map((step, idx) => ({
        stepNumber: step.stepNumber || idx + 1,
        instruction: step.instruction,
        cliCommand: step.cliCommand || '',
        isAutomated: false, // Explicitly safe: commands are never executed automatically
        dangerLevel: step.dangerLevel || 'SAFE_READONLY',
      })),
      author: author || 'DevOps / SRE Team',
    });

    return res.status(201).json({
      success: true,
      data: runbook,
      message: 'Runbook created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/runbooks/match?error=<error>
 * Keyword matcher for finding relevant SOP runbooks without auto-execution
 */
export const matchRunbookByError = async (req, res, next) => {
  try {
    const { error, serviceId } = req.query;

    if (!error || error.trim() === '') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Query parameter "error" is required for matching runbooks',
      });
    }

    const errorText = error.toLowerCase();
    const query = {};

    if (serviceId) {
      query.serviceId = serviceId;
    }

    const allRunbooks = await Runbook.find(query).populate('serviceId', 'name slug tier').lean();

    // Score and rank runbooks based on keyword and title relevance
    const matched = allRunbooks
      .map((rb) => {
        let score = 0;
        const matchedKeywords = [];

        // Check trigger keywords
        if (Array.isArray(rb.triggerKeywords)) {
          rb.triggerKeywords.forEach((kw) => {
            if (kw && errorText.includes(kw.toLowerCase())) {
              score += 10;
              matchedKeywords.push(kw);
            }
          });
        }

        // Title and summary checks
        if (rb.title && errorText.includes(rb.title.toLowerCase())) {
          score += 5;
        }

        return {
          ...rb,
          matchScore: score,
          matchedKeywords,
        };
      })
      .filter((rb) => rb.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      data: matched,
      message: matched.length > 0 ? `Found ${matched.length} matching runbook(s)` : 'No runbooks matched the error signature',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/runbooks/:id
 */
export const getRunbookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const runbook = await Runbook.findById(id).populate('serviceId', 'name slug tier healthStatus');

    if (!runbook) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Runbook with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: runbook,
      message: 'Runbook retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/runbooks/:id
 */
export const updateRunbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.slug) {
      updates.slug = updates.slug.trim().toLowerCase();
    }

    const runbook = await Runbook.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!runbook) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Runbook with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: runbook,
      message: 'Runbook updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/runbooks/:id
 */
export const deleteRunbook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const runbook = await Runbook.findByIdAndDelete(id);

    if (!runbook) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Runbook with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: { id },
      message: 'Runbook deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
