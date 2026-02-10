import express from "express";
import { patientSignup, patientLogin, bookAppointment, getAppointments, cancelAppointment, sendMessage, listDoctors, getDoctorById, updateBiodata, getBiodata } from "../controllers/patientController.js";

const router = express.Router();

router.post("/create", patientSignup);
router.post("/login", patientLogin);
router.post("/book-appointment", bookAppointment);
router.get("/get-appointments", getAppointments);
router.post("/cancel-appointment", cancelAppointment);
router.get("/list-doctors", listDoctors)
router.get("/getDoctor", getDoctorById)
router.post("/reminder", sendMessage)
router.post("/update-biodata", updateBiodata)
router.get("/biodata", getBiodata)

export default router;