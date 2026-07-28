import mongoose from 'mongoose';

// In-memory store for frontend errors (capped at 500 entries).
// In production, replace with a MongoDB model or external APM.
const errorLogs = [];
const MAX_ERROR_LOGS = 500;

export const logFrontendError = async (req, res, next) => {
  try {
    const {
      referenceId,
      message,
      stack,
      componentStack,
      route,
      userId,
      userRole,
      deploymentCommit,
      deploymentVersion,
      apiRequests,
      environment,
      browser,
      viewport,
      timestamp,
    } = req.body;

    if (!referenceId && !message) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const logEntry = {
      referenceId,
      message,
      stack: stack ? stack.substring(0, 2000) : undefined,
      componentStack: componentStack ? componentStack.substring(0, 2000) : undefined,
      route,
      userId,
      userRole,
      deploymentCommit: deploymentCommit || deploymentVersion,
      apiRequests: apiRequests || [],
      environment: environment || 'unknown',
      browser,
      viewport,
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    // Store in memory (thread-safe enough for single-process Node)
    errorLogs.unshift(logEntry);
    if (errorLogs.length > MAX_ERROR_LOGS) {
      errorLogs.pop();
    }

    // Also log to stdout so it appears in Vercel function logs
    console.error(`[FRONTEND_ERROR] Ref: ${referenceId} | Route: ${route} | Env: ${environment} | User: ${userId} (${userRole}) | Commit: ${deploymentCommit || deploymentVersion}`);
    console.error(`Message: ${message}`);

    res.status(200).json({ success: true, referenceId, message: 'Error logged securely' });
  } catch (error) {
    console.error('Failed to log frontend error:', error);
    res.status(200).json({ success: false, message: 'Logging failed but ignored' });
  }
};

// @desc  Retrieve a stored error log by referenceId (Admin only — for traceability)
// @route GET /api/system/frontend-errors/:referenceId
export const getErrorLog = async (req, res) => {
  try {
    const { referenceId } = req.params;
    const entry = errorLogs.find(e => e.referenceId === referenceId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Error reference not found' });
    }
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching log' });
  }
};
