import Patient from "../models/patientsModel.js";
import jwt from "jsonwebtoken";

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