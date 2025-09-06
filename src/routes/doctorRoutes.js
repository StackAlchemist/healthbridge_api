import express from "express"
import { createDoctor } from "../controllers/doctorsController.js";

const router = express.Router();

router.post("/create", createDoctor);

export default router;