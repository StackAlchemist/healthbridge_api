import express from "express"
import { createDoctor, getDoctors, getDoctorById, deleteDoctor, doctorLogin, searchDoctors, cancelAppointment, approveAppointment } from "../controllers/doctorsController.js";

const router = express.Router();

router.post("/create", createDoctor);
router.get("/get", getDoctors);
router.get("/get/:id", getDoctorById);
// router.put("/update/:id", updateDoctor);
router.delete("/delete/:id", deleteDoctor);
router.post("/login", doctorLogin);
router.post("/search", searchDoctors);
router.post("/cancel-appointment/:id/:appointmentId", cancelAppointment);
router.post("/approve-appointment/:id/:appointmentId", approveAppointment);

export default router;
//push dev