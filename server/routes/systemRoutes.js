import express from 'express';
import { logFrontendError } from '../controllers/systemController.js';

const router = express.Router();

router.post('/frontend-errors', logFrontendError);

export default router;
