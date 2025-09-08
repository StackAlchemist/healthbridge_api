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
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const searchRegex = new RegExp(query, "i");

    const doctors = await Doctor.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { specialization: searchRegex },
        { availableDays: searchRegex },
        { location: searchRegex },
        { "hospital.name": searchRegex },
        { "hospital.address": searchRegex },
        { "hospital.email": searchRegex },
        { "hospital.phone": searchRegex }
      ],
      ...(isNaN(query) ? {} : { experience: Number(query) }) // search "experience" if query is number
    });

    res.status(200).json({
      doctors: doctors.map((doctor) => ({
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
        experience: doctor.experience,
        availableDays: doctor.availableDays,
        availableTime: doctor.availableTime,
        location: doctor.location,
        hospital: doctor.hospital,
        patients: doctor.patients
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
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


export const getAppointments = async (req, res) => {
  try {
    const appointments = await Doctor.find().appointments;
  if (!appointments) {
    return res.status(404).json({ message: "No appointments found" });
  }
  res.status(200).json({ appointments: appointments.map((appointment) => ({
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    appointmentStatus: appointment.appointmentStatus
  })) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};