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
    // Will be hashed before saving
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

  description: {
    type: String,
    required: true
  },

  fee: {
    type: Number,
    required: true
  },

  img: {
    type: String,
    required: true
  },
  // Availability
  availableDays: {
    type: [String], // e.g. ["Monday", "Wednesday", "Friday"]
    default: []
  },
  availableTime: {
    start: { type: String }, // "09:00"
    end: { type: String }    // "17:00"
  },

  status:{
    type: Boolean
  },
  // Work info
  location: { type: String },
  hospital: {
    name: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String }
  },

  // Appointment records
  appointments: [
    {
      patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      patientName: { type: String },
      patientComplaint: {type: String},
      appointmentDate: { type: Date },
      appointmentTime: { type: String },
      appointmentStatus: { 
        type: String, 
        enum: ["pending", "confirmed", "cancelled", "attended"], 
        default: "pending" 
      }
    }
  ],

  // Linked patients (for history/quick lookup)
  patients: [
    {
      patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
      patientName: { type: String },
      lastVisit: { type: Date }
    }
  ]
}, { timestamps: true });

// Hash password before saving
doctorSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

doctorSchema.statics.login = async function(email, password) {
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
const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;
