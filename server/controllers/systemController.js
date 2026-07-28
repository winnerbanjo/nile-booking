export const logFrontendError = async (req, res, next) => {
  try {
    const { referenceId, message, stack, componentStack, route, userId, userRole, deploymentVersion, browser, viewport, timestamp } = req.body;

    // Fire-and-forget: In a real production system, this would go to Sentry, DataDog, or a capped MongoDB collection.
    // We are simply logging it out to the server stdout safely.
    console.error(`[FRONTEND_ERROR] Ref: ${referenceId} | Route: ${route} | User: ${userId} (${userRole})`);
    console.error(`Message: ${message}`);
    if (componentStack) {
      console.error(`Component Stack: ${componentStack}`);
    }

    // Return success immediately to the client
    res.status(200).json({ success: true, message: 'Error logged securely' });
  } catch (error) {
    // Never crash the frontend error endpoint
    console.error('Failed to log frontend error:', error);
    res.status(200).json({ success: false, message: 'Logging failed but ignored' });
  }
};
