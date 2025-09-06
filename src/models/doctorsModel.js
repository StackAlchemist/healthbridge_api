import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const doctorSchema = new mongoose.Schema({
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
    // hash with bcrypt before saving
  },
  phone: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  experience: {
    type: Number, // years of experience
    default: 0
  },
  availableDays: {
    type: [String], // e.g. ["Monday", "Wednesday", "Friday"]
    default: []
  },
  availableTime: {
    start: { type: String }, // "09:00"
    end: { type: String }    // "17:00"
  },
  location: {   
    type: String
  },
  hospital: {
    name: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String }
  },

  patients: [
    {
      patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      patientName: { type: String },
      lastVisit: { type: Date }
    }
  ]
}, { timestamps: true });

doctorSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
