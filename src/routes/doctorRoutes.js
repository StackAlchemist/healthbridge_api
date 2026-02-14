import express from "express"
import { createDoctor, getDoctors, getDoctorById, deleteDoctor, doctorLogin, searchDoctors, cancelAppointment, approveAppointment, getAppointments, docDetails } from "../controllers/doctorsController.js";
import upload from "../middlewares/multer.js";
const router = express.Router();

router.post("/create", upload.single("img"), createDoctor);
router.get("/get", getDoctors);
router.get("/get/:id", getDoctorById);
// router.put("/update/:id", updateDoctor);
router.delete("/delete/:id", deleteDoctor);
router.post("/login", doctorLogin);
router.post("/search", searchDoctors);
router.post("/cancel-appointment", cancelAppointment);
router.post("/approve-appointment/:id/:appointmentId", approveAppointment);
router.get("/appointments", getAppointments);
router.get("/details", docDetails)
export default router;
//push dev