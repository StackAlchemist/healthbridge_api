import Doctor from "../models/doctorsModel.js";
import jwt from "jsonwebtoken";

const maxAge = 3 * 24 * 60 * 60 * 1000; // 3 days
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: maxAge });
};

export const createDoctor = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    specialization,
    experience,
    availableDays,
    availableTime,
    location,
    hospital,
  } = req.body;
  const doctor = new Doctor({
    name,
    email,
    password,
    phone,
    specialization,
    experience,
    availableDays,
    availableTime,
    location,
    hospital,
  });
  await doctor.save();
  const token = createToken(doctor._id);
  res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge*1000 });
  res.status(201).json({
    message: "Doctor created successfully",
    token,
    doctor: {
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      experience: doctor.experience,
      availableDays: doctor.availableDays,
      availableTime: doctor.availableTime,
      location: doctor.location,
      hospital: {
        name: doctor.hospital.name,
        address: doctor.hospital.address,
        phone: doctor.hospital.phone,
        email: doctor.hospital.email,
      },
    },
  });
};

export const getDoctors = async (req, res) => {
  const doctors = await Doctor.find();
  res.status(200).json({
    doctors: doctors.map((doctor) => ({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      experience: doctor.experience,
      availableDays: doctor.availableDays,
      availableTime: doctor.availableTime,
      location: doctor.location,
      hospital: doctor.hospital,
    })),
  });
};

export const getDoctorById = async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  res.status(200).json({ doctor });
};

export const searchDoctors = async (req, res) => {
  const { query } = req.query;
  const doctors = await Doctor.find({
    //
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
      { specialization: { $regex: query, $options: "i" } },
      { experience: { $regex: query, $options: "i" } },
      { availableDays: { $regex: query, $options: "i" } },
      { availableTime: { $regex: query, $options: "i" } },
      { location: { $regex: query, $options: "i" } },
      { hospital: { $regex: query, $options: "i" } },
    ],
  });
  res.status(200).json({ doctors });
};

export const doctorLogin = async (req, res) => {
  const { email, password } = req.body;
  const doctor = await Doctor.login(email, password);
  const token = createToken(doctor._id);
  res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge*1000 });
  res.status(200).json({ doctor:{
    id: doctor._id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone,
    specialization: doctor.specialization,
  }, token, message: "Login successful" });
};

// export const updateDoctor = async (req, res) => {
//     const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.status(200).json({ doctor });
// };

export const deleteDoctor = async (req, res) => {
  await Doctor.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Doctor deleted successfully" });
};


