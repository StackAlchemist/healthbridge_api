import cron from "node-cron";
import twilio from "twilio";
import Patient from "../models/patientsModel.js";
import Doctor from "../models/doctorsModel.js";

const client = twilio(
  process.env.TWILIO_ACCT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// 🔒 Prevent overlapping executions
let isRunning = false;

/**
 * Helper function to send a reminder for a single appointment
 */
const sendReminder = async (patient, appointment) => {
  try {
    const doctor = await Doctor.findById(appointment.doctorId);
    if (!doctor || !patient.phone) {
      console.log(`⚠ Skipping ${patient.name}: missing doctor or phone`);
      return;
    }

    // Format Nigerian phone number
    let phone = patient.phone.trim();
    let formatted =
      phone.startsWith("0") ? "+234" + phone.slice(1) :
      phone.startsWith("+234") ? phone :
      "+234" + phone;

    // Combine date + time
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate.toISOString().split("T")[0]}T${appointment.appointmentTime}:00`
    );

    const dateString = appointmentDateTime.toLocaleDateString("en-NG");
    const timeString = appointmentDateTime.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit"
    });

    console.log(`📤 Sending reminder to ${patient.name} at ${formatted}`);

    const msg = await client.messages.create({
      body: `Hello ${patient.name} 👋
Appointment Confirmed 🏥
Dr. ${doctor.name}
📅 ${dateString}
⏰ ${timeString}
Please arrive 10 mins early.`,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: formatted
    });

    console.log(`📬 Twilio response:`, {
      sid: msg.sid,
      status: msg.status,
      errorCode: msg.errorCode,
      errorMessage: msg.errorMessage
    });

    // Mark reminder as sent (Patient side)
    appointment.reminderSent = true;
    await patient.save();

    // Sync Doctor side
    const doctorAppointment = doctor.appointments.find(
      appt =>
        appt.patientId?.toString() === patient._id.toString() &&
        appt.appointmentDate.toDateString() === appointment.appointmentDate.toDateString() &&
        appt.appointmentTime === appointment.appointmentTime
    );

    if (doctorAppointment) {
      doctorAppointment.reminderSent = true;
      await doctor.save();
    }

    console.log(`✅ Reminder logged for ${patient.name}`);
  } catch (err) {
    console.error(`❌ Failed reminder for ${patient.name}:`, err.message);
  }
};

/**
 * 🔔 Cron job: Runs every minute
 * Sends reminders exactly 1 hour before appointment time
 */
cron.schedule("* * * * *", async () => {

  if (isRunning) {
    console.log("⏳ Previous reminder job still running. Skipping this cycle.");
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  console.log("⏰ Running appointment reminder job...");

  try {
    const now = new Date();

    const oneHourFromNowStart = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourFromNowEnd = new Date(oneHourFromNowStart.getTime() + 60 * 1000);

    const patients = await Patient.find({
      "appointments.appointmentStatus": { $in: ["pending", "confirmed"] },
      "appointments.reminderSent": false
    });

    if (!patients.length) {
      console.log("ℹ No patients with pending reminders found");
      return;
    }

    const jobs = [];

    for (const patient of patients) {
      for (const appointment of patient.appointments) {

        if (
          appointment.reminderSent ||
          appointment.appointmentStatus === "cancelled" ||
          appointment.appointmentStatus === "attended"
        ) continue;

        const appointmentDateTime = new Date(
          `${appointment.appointmentDate.toISOString().split("T")[0]}T${appointment.appointmentTime}:00`
        );

        if (
          appointmentDateTime >= oneHourFromNowStart &&
          appointmentDateTime < oneHourFromNowEnd
        ) {
          console.log(`⏱ Match found for ${patient.name}`);
          jobs.push(sendReminder(patient, appointment));
        }
      }
    }

    if (jobs.length) {
      await Promise.allSettled(jobs);
      console.log(`✅ Processed ${jobs.length} reminder(s)`);
    } else {
      console.log("ℹ No appointments matched the 1-hour window");
    }

  } catch (error) {
    console.error("❌ Reminder Cron Error:", error.message);
  } finally {
    isRunning = false;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏳ Reminder job completed in ${duration}s`);
  }

});
