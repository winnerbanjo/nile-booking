import { validateRequiredSecrets } from '../config/secrets.js';
import app from '../app.js';

// Serverless cold starts fail closed if either security secret is missing or
// too short. The deployment checklist must set both variables first.
validateRequiredSecrets();

export default app;
