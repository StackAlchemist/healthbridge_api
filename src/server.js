import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import officialRoutes from "./routes/NHISRoutes.js";
import cors from "cors";
import { sendMessage } from "./controllers/twilio.test.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 3000; 

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to Database");
    })
    .catch((err) => {
        console.log(err);
    });

app.use(cors());
app.use(express.json());

app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/officials", officialRoutes);
app.use('/test/reminder', sendMessage);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); // Initialize and Log the actual port being used
});