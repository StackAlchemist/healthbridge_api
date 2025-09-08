import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: "Invalid email address"
    }
  },
  password: {
    type: String,
    required: true
    // Will be hashed with bcrypt before saving
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  age: {
    type: Number
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },

  // Appointments array
  appointments: [
    {
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
      doctorName: { type: String },
      appointmentDate: { type: Date },
      appointmentTime: { type: String },
      appointmentStatus: { 
        type: String, 
        enum: ["pending", "confirmed", "cancelled", "attended"], 
        default: "pending" 
      }
    }
  ],

  // Array of medical history records
  history: [
    {
      complaint: { type: String, required: true },
      description: { type: String },
      diagnostics: { type: String },
      treatments: { type: String },
      medicines: [
        {
          name: { type: String },
          usage: { type: String },
          dosage: { type: String }
        }
      ],
      sideEffects: { type: String },
      precautions: { type: String },
      surgeries: { type: String },
      practitioner: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
      date: { type: Date, default: Date.now },
      status: { 
        type: String, 
        enum: ["pending", "ongoing", "resolved"], 
        default: "pending" 
      },
      comments: { type: String, default: "No Comments" }
    }
  ]

}, { timestamps: true });

// Hash password before saving
patientSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Static login method
patientSchema.statics.login = async function(email, password) {
  const patient = await this.findOne({ email });
  if (!patient) {
    throw new Error("Invalid email");
  }
  const match = await bcrypt.compare(password, patient.password);
  if (!match) {
    throw new Error("Invalid password");
  }
  return patient;
};

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
