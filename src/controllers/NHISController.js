
import jwt from "jsonwebtoken";
import NHIS from "../models/NHISModel.js";
import Doctor from "../models/doctorsModel.js";


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

const maxAge = 3 * 24 * 60 * 60 * 1000; // 3 days
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: maxAge });
};

export const createOfficial = async (req, res)=>{
    try{
        
        const {name, email, password} = req.body;
        const official = new NHIS({
            name,
            email,
            password,
        });
        await official.save();
    const token = createToken(official._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge*1000 });
    res.status(201).json({
        message: "Patient create Successfully",
        token,
        official:{
            id: official._id,
            name: official.name,
            email: official.email
        },
    });
}catch (err){
    console.log(err)
    const errors = handleErrors(err);
    res.status(400).json({ errors });
}
}


export const officialLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
      const official = await NHIS.login(email, password);
      const token = createToken(official._id);
      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge*1000 });
      res.status(200).json({ official:{
          id: official._id,
          name: official.name,
          email: official.email,
      }, token, message: "Login successful" });
  
    } catch (err) {
      const errors = handleErrors(err);
      res.status(400).json({ errors });
    }
  };


  export const approve = async (req, res) => {
    try {
      const { doctor_id, official_id } = req.body;
  
      // Find doctor and official
      const doctor = await Doctor.findById(doctor_id);
      const official = await NHIS.findById(official_id);
  
      if (!doctor || !official) {
        return res.status(404).json({ message: "Doctor or NHIS official not found" });
      }
  
      // Update doctor status
      doctor.status = true;
      await doctor.save();
  
      // Add doctor to official approvals
      official.approvals.push({
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        spec: doctor.specialization,
        officer: {
          id: official._id,
          name: official.name,
          email: official.email,
        },
      });
  
      await official.save();
  
      res.status(200).json({ message: "Approved successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Approval failed" });
    }
  };
  

  export const officialLogout = async (req, res) =>{
    try {
      res.cookie('jwt', '', { maxAge: 1 }); // Set cookie to empty string and expire immediately
      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      console.error("Error during patient logout:", error);
      res.status(500).json({ message: "Logout failed", error: error.message });
    }
  }