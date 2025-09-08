import express from "express"
import { createDoctor, getDoctors, getDoctorById, deleteDoctor, doctorLogin, searchDoctors } from "../controllers/doctorsController.js";

const router = express.Router();

router.post("/create", createDoctor);
router.get("/get", getDoctors);
router.get("/get/:id", getDoctorById);
// router.put("/update/:id", updateDoctor);
router.delete("/delete/:id", deleteDoctor);
router.post("/login", doctorLogin);
router.post("/search", searchDoctors);

export default router;