import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

export const sendMessage = async (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    console.log(accountSid, authToken)
    const client = twilio(accountSid, authToken);

    // Await the message creation
    const message = await client.messages.create({
      body: "Test 2",
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: "+18777804236", 
    });

    console.log("Message SID:", message.sid);
    res.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error("Twilio error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
