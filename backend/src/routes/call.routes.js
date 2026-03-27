import express from 'express';
import { triggerPatientCall, getAllCalls } from '../controllers/call.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/trigger', triggerPatientCall);
router.get('/', getAllCalls);

export default router;
