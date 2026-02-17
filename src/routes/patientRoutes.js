import express from "express";
import { patientSignup, patientLogin, bookAppointment, getAppointments, cancelAppointment, sendMessage, listDoctors, getDoctorById, updateBiodata, getBiodata } from "../controllers/patientController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", patientSignup);
router.post("/login", patientLogin);
router.post("/book-appointment", requireAuth, bookAppointment);
router.get("/get-appointments", requireAuth, getAppointments);
router.post("/cancel-appointment", requireAuth, cancelAppointment);
router.get("/list-doctors", requireAuth, listDoctors)
router.get("/getDoctor", requireAuth, getDoctorById)
router.post("/reminder", sendMessage)
router.post("/update-biodata", requireAuth, updateBiodata)
router.get("/biodata", requireAuth, getBiodata)

export default router;