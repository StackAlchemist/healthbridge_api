import express from "express"
import { createDoctor, getDoctors, getDoctorById, deleteDoctor, doctorLogin, searchDoctors, cancelAppointment, approveAppointment, getAppointments, docDetails } from "../controllers/doctorsController.js";
import upload from "../middlewares/multer.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/create", upload.single("img"), createDoctor);
router.get("/get", requireAuth,  getDoctors);
router.get("/get/:id", requireAuth, getDoctorById);
// router.put("/update/:id", updateDoctor);
router.delete("/delete/:id", requireAuth, deleteDoctor);
router.post("/login", doctorLogin);
router.post("/search", requireAuth, searchDoctors);
router.post("/cancel-appointment", requireAuth, cancelAppointment);
router.post("/approve-appointment/:id/:appointmentId", requireAuth, approveAppointment);
router.get("/appointments", requireAuth, getAppointments);
router.get("/details", requireAuth, docDetails)
export default router;
//push dev