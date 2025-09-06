import mongoose from "mongoose";

const medicalHistorySchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Patient", 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Doctor", 
    required: true 
  },
  complaint: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  diagnostics: {
    type: String
  },
  treatments: {
    type: String
  },
  medicines: {
    usage: String,
    dosage: String
  },
  sideEffects: {
    type: String
  },
  precautions: {
    type: String
  },
  surgeries: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["pending", "ongoing", "resolved"],
    default: "pending"
  },
  comments: {
    type: String,
    default: "No Comments"
  }
}, { timestamps: true });

const MedicalHistory = mongoose.model("MedicalHistory", medicalHistorySchema);
export default MedicalHistory;
