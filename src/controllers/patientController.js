import Doctor from "../models/doctorsModel.js";
import Patient from "../models/patientsModel.js";
import jwt from "jsonwebtoken";
import twilio from "twilio"
import dotenv from "dotenv";
dotenv.config();

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

export const patientSignup = async (req, res) => {
  console.log(req.body);
  const { name, email, password, phone, address, city, state, age, gender } =
    req.body;
  const patient = new Patient({
    name,
    email,
    password,
    phone,
    address,
    city,
    state,
    age,
    gender,
  });
  await patient.save();
  const token = createToken(patient._id);
  res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge*1000 });
  res.status(201).json({
    message: "Patient created successfully",
    token,
    patient: {
      id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      address: patient.address,
      city: patient.city,
      state: patient.state,
      age: patient.age,
      gender: patient.gender,
    },
  });
};

export const patientLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const patient = await Patient.login(email, password);
    const token = createToken(patient._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge*1000 });
    res.status(200).json({ patient:{
        id: patient._id,
        name: patient.name,
        email: patient.email,
    }, token, message: "Login successful" });

  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

export const patientLogout = async (req, res) =>{
  try {
    res.cookie('jwt', '', { maxAge: 1 }); // Set cookie to empty string and expire immediately
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during patient logout:", error);
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
}



export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, userId } = req.body;

    // 1. Validate input
    if (!doctorId || !appointmentDate || !appointmentTime || !userId) {
      return res.status(400).json({ 
        message: "Missing required appointment details: doctorId, appointmentDate, appointmentTime, userId" 
      });
    }

    const dateObj = new Date(appointmentDate);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date format." });
    }

    // Basic time format validation (HH:MM)
    const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/;
    if (!timeRegex.test(appointmentTime)) {
      return res.status(400).json({ message: "Invalid appointment time format. Expected HH:MM." });
    }

    // 2. Find patient and doctor
    const patient = await Patient.findById(userId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // 3. Check doctor's availability (day of week)
    const dayOfWeek = dateObj.toLocaleString("en-us", { weekday: "long" });
    if (!doctor.availableDays.includes(dayOfWeek)) {
      return res.status(400).json({ message: `Doctor is not available on ${dayOfWeek}.` });
    }

    // 4. Check doctor's availability (time slot)
    const [reqHour, reqMinute] = appointmentTime.split(":").map(Number);
    const [startHour, startMinute] = doctor.availableTime.start.split(":").map(Number);
    const [endHour, endMinute] = doctor.availableTime.end.split(":").map(Number);

    const requestedTimeInMinutes = reqHour * 60 + reqMinute;
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;

    if (requestedTimeInMinutes < startTimeInMinutes || requestedTimeInMinutes >= endTimeInMinutes) {
      return res.status(400).json({ 
        message: `Doctor is only available between ${doctor.availableTime.start} and ${doctor.availableTime.end}.` 
      });
    }

    // 5. Check for existing appointment
    const existingAppointment = doctor.appointments.find(app =>
      app.appointmentDate.toDateString() === dateObj.toDateString() &&
      app.appointmentTime === appointmentTime &&
      app.appointmentStatus !== "cancelled"
    );

    if (existingAppointment) {
      return res.status(409).json({ message: "Doctor already has an appointment at this time." });
    }

    // 6. Create appointment object
    const newAppointment = {
      doctorId: doctor._id,
      doctorName: doctor.name,
      appointmentDate: dateObj,
      appointmentTime,
      appointmentStatus: "pending"
    };

    const doctorAppointment = {
      patientId: patient._id,
      patientName: patient.name,
      appointmentDate: dateObj,
      appointmentTime,
      appointmentStatus: "pending"
    };

    // 7. Save appointment in both patient and doctor documents
    patient.appointments.push(newAppointment);
    await patient.save();

    doctor.appointments.push(doctorAppointment);
    await doctor.save();

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: newAppointment
    });

  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const userId = req.body.userId;
    const patient = await Patient.findById(userId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const appointments = patient.appointments;
    if (!appointments) {
      return res.status(404).json({ message: "No appointments found" });
    }
    res.status(200).json({ appointments });
  } catch (error) {
    console.error("Error getting appointments:", error);
    res.status(404).json({ message: "No appointments found" });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, { appointmentStatus: "cancelled" });
    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { patientId } = req.body;

    // Await the DB query
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (!patient.phone) {
      return res.status(400).json({ error: "Patient phone number is missing" });
    }

    let patientPhoneNumber = patient.phone.toString().trim();

    // Handle Nigerian numbers
    let formattedNumber;
    if (patientPhoneNumber.startsWith("0")) {
      formattedNumber = "+234" + patientPhoneNumber.slice(1);
    } else if (patientPhoneNumber.startsWith("+234")) {
      formattedNumber = patientPhoneNumber;
    } else {
      formattedNumber = "+234" + patientPhoneNumber;
    }

    console.log("Formatted:", formattedNumber);

    const accountSid = process.env.TWILIO_ACCT_SID;  
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: "Test 2",
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: formattedNumber,
    });

    console.log("Message SID:", message.sid);
    res.json({ success: true, sid: message.sid });

  } catch (error) {
    console.error("Twilio error:", error.message);
    res.status(400).json({ error: error.message });
  }
};
