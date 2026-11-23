import { randomUUID } from 'node:crypto';

export const newCorrelationId = () => randomUUID();

export const correlationMiddleware = (req, res, next) => {
  const supplied = req.headers['x-correlation-id'];
  req.correlationId =
    typeof supplied === 'string' && supplied.length <= 128 ? supplied : newCorrelationId();
  res.setHeader('x-correlation-id', req.correlationId);

  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(
      JSON.stringify({
        event: 'http_request',
        correlationId: req.correlationId,
        method: req.method,
        path: req.originalUrl?.split('?')[0],
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      })
    );
  });

  next();
};

export const logEvent = (event, details = {}) => {
  console.log(JSON.stringify({ event, ...details }));
};
