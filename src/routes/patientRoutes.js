import express from "express";
import { patientSignup, patientLogin } from "../controllers/patientController.js";

const router = express.Router();

router.post("/create", patientSignup);
router.post("/login", patientLogin);

export default router;