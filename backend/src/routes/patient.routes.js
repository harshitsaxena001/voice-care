import express from 'express';
import { getAllPatients, addPatient } from '../controllers/patient.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all patient routes
router.use(authMiddleware);

router.route('/')
    .get(getAllPatients)
    .post(addPatient);

export default router;
