import Doctor from "../models/doctorsModel.js";
import jwt from "jsonwebtoken";
import Patient from "../models/patientsModel.js";

const maxAge = 3 * 24 * 60 * 60 * 1000; // 3 days
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: maxAge });
};


const handleErrors = (err) => {
  let errors = { name: "", email: "", password: "" };

  // Duplicate email error
  if (err.code === 11000) {
    errors.email = "Email already exists";
    return errors;
  }

  // Validation errors
  if (err.message.includes("UserAuth validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
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
      status: doctor.status,
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
        patients: doctor.patients,
        appointments: doctor.appointments.map((appointment) => ({
          patientId: appointment.patientId,
          patientName: appointment.patientName,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          appointmentStatus: appointment.appointmentStatus
        }))
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const doctorLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const doctor = await Doctor.login(email, password);
    const token = createToken(doctor._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge*1000});
    res.status(200).json({ doctor:{
      id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
    }, token, message: "Login successful"});

  } catch (err) {
    console.log(err)
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
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

export const approveAppointment = async (req, res) => {
  try {
    const { id: doctorId, appointmentId } = req.params;

    // 1. Find doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // 2. Find appointment in doctor's record
    const appointment = doctor.appointments.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 3. Validate status transition
    if (appointment.appointmentStatus === "confirmed") {
      return res.status(400).json({ message: "Appointment is already confirmed" });
    }
    if (appointment.appointmentStatus === "cancelled") {
      return res.status(400).json({ message: "Cannot approve a cancelled appointment" });
    }

    // 4. Update doctor's appointment
    appointment.appointmentStatus = "confirmed";
    await doctor.save();

    // 5. Update patient's appointment (keep both sides in sync)
    await Patient.updateOne(
      { _id: appointment.patientId, "appointments._id": appointmentId },
      { $set: { "appointments.$.appointmentStatus": "confirmed" } }
    );

    res.status(200).json({
      message: "Appointment approved successfully ✅",
      appointment: {
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        appointmentStatus: appointment.appointmentStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentId } = req.body;

    if (!doctorId || !appointmentId) {
      return res.status(400).json({ message: "doctorId and appointmentId are required" });
    }

    //  Find doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    //  Find appointment inside doctor's record
    const appointment = doctor.appointments.id(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found for doctor" });
    }

    // Prevent cancelling attended/cancelled appointments
    if (appointment.appointmentStatus === "attended") {
      return res.status(400).json({ message: "Cannot cancel an attended appointment" });
    }
    if (appointment.appointmentStatus === "cancelled") {
      return res.status(400).json({ message: "Appointment is already cancelled" });
    }

    //  Update appointment in doctor's record
    appointment.appointmentStatus = "cancelled";
    await doctor.save();

    //  Sync with patient's record
    if (appointment.patientId) {
      const patient = await Patient.findById(appointment.patientId);
      if (patient) {
        const patientAppt = patient.appointments.find(
          (appt) =>
            appt._id.toString() === appointment._id.toString() ||
            (
              appt.doctorId.toString() === doctor._id.toString() &&
              appt.appointmentDate.getTime() === appointment.appointmentDate.getTime() &&
              appt.appointmentTime === appointment.appointmentTime
            )
        );

        if (patientAppt) {
          patientAppt.appointmentStatus = "cancelled";
          await patient.save();
        }
      }
    }

    //  Send success response
    res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment: {
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        appointmentStatus: appointment.appointmentStatus,
      },
    });

  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};