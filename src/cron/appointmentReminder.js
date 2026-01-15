import cron from "node-cron";
import twilio from "twilio";
import Patient from "../models/patientsModel.js";
import Doctor from "../models/doctorsModel.js";

const client = twilio(
  process.env.TWILIO_ACCT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Runs every minute
 * Sends reminder exactly 1 hour before appointment time
 */
cron.schedule("* * * * *", async () => {
  console.log("⏰ Running appointment reminder job...");

  try {
    const now = new Date();

    // 1 hour window
    const oneHourFromNowStart = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourFromNowEnd = new Date(oneHourFromNowStart.getTime() + 60 * 1000);

    // Get patients with pending/confirmed appointments
    const patients = await Patient.find({
      "appointments.appointmentStatus": { $in: ["pending", "confirmed"] },
      "appointments.reminderSent": false
    });

    for (const patient of patients) {
      for (const appointment of patient.appointments) {

        if (
          appointment.reminderSent ||
          appointment.appointmentStatus === "cancelled" ||
          appointment.appointmentStatus === "attended"
        ) continue;

        // Combine date + time into ONE datetime
        const appointmentDateTime = new Date(
          `${appointment.appointmentDate.toISOString().split("T")[0]}T${appointment.appointmentTime}:00`
        );

        // Check if appointment is exactly 1 hour away
        if (
          appointmentDateTime >= oneHourFromNowStart &&
          appointmentDateTime < oneHourFromNowEnd
        ) {
          const doctor = await Doctor.findById(appointment.doctorId);
          if (!doctor || !patient.phone) continue;

          // Format Nigerian phone number
          let phone = patient.phone.trim();
          let formatted =
            phone.startsWith("0") ? "+234" + phone.slice(1) :
            phone.startsWith("+234") ? phone :
            "+234" + phone;

          const dateString = appointmentDateTime.toLocaleDateString("en-NG");
          const timeString = appointmentDateTime.toLocaleTimeString("en-NG", {
            hour: "2-digit",
            minute: "2-digit"
          });

          // Send SMS
          await client.messages.create({
            body: `Appointment Reminder

Dear ${patient.gender === "male" ? "Mr." : "Ms."} ${patient.name},

You have an appointment with Dr. ${doctor.name} (${doctor.specialization})

📅 Date: ${dateString}
⏰ Time: ${timeString}

Please arrive on time.`,
            messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
            to: formatted
          });

          // Mark reminder as sent (PATIENT SIDE)
          appointment.reminderSent = true;
          await patient.save();

          // Sync reminder on DOCTOR SIDE
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

          console.log(`✅ Reminder sent to ${patient.name}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Reminder Cron Error:", error.message);
  }
});
