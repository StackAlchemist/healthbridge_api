import jwt from "jsonwebtoken";
import Patient from "../models/patientsModel.js";
import Doctor from "../models/doctorsModel.js";
import dotenv from "dotenv";

dotenv.config();

export const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decodedToken;
    // First, try to find a patient
    let user = await Patient.findById(id).select("name email");
    let role = "patient";

    // If no patient found, try to find a doctor
    if (!user) {
      user = await Doctor.findById(id).select("name email");
      role = user ? "doctor" : null;
    }

    if (!user) {
      return res.status(401).json({ error: "User not found or not authorized" });
    }

    req.user = user;
    req.userRole = role;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Request is not authorized" });
  }
};
