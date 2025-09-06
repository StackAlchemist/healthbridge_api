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
    // hash with bcrypt before saving
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

  //  Array of medical history records
  history: [
    {
      complaint: { type: String, required: true },
      description: { type: String },
      diagnostics: { type: String },
      treatments: { type: String },
      medicines: {
        usage: { type: String },
        dosage: { type: String }
      },
      sideEffects: { type: String },
      precautions: { type: String },
      surgeries: { type: String },
      practitioner: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
        name: { type: String, required: true },
        specialization: { type: String, required: true }
      },
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ["pending", "ongoing", "resolved"], default: "pending" },
      comments: { type: String, default: "No Comments" }
    }
  ]

}, { timestamps: true });

patientSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

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
