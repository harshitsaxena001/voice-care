import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  registerHospital,
  getMyHospital,
  addDoctor,
  getDoctors,
} from "../controllers/hospital.controller.js";

const router = express.Router();

// Public routes (if any)
// router.get('/public', ...);

// Apply auth middleware to all routes below
router.use(authMiddleware);

router.post("/register", registerHospital);
router.get("/me", getMyHospital);
router.post("/doctors", addDoctor);
router.get("/doctors", getDoctors);

export default router;
