import { Router } from "express";
import {
  getAllVaccinations,
  addVaccination,
  importVaccinations,
  deleteVaccination,
} from "../controllers/vaccination.controller.js";

const router = Router();

router.route("/").get(getAllVaccinations).post(addVaccination);
router.route("/import").post(importVaccinations);
router.route("/:id").delete(deleteVaccination);

export default router;
