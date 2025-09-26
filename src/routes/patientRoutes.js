import express from "express";
import { patientSignup, patientLogin, bookAppointment, getAppointments, cancelAppointment, sendMessage, listDoctors, getDoctorById } from "../controllers/patientController.js";

const router = express.Router();

router.post("/create", patientSignup);
router.post("/login", patientLogin);
router.post("/book-appointment", bookAppointment);
router.get("/get-appointments", getAppointments);
router.post("/cancel-appointment", cancelAppointment);
router.post("/list-doctors", listDoctors)
router.post("/getDoctor", getDoctorById)
router.post("/reminder", sendMessage)

export default router;