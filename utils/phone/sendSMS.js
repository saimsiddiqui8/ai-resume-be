import twilio from 'twilio';

async function sendSMS(toNumber, otpCode) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);

    const response = await client.messages.create({
      body: `Your Secound Shot verification code is ${otpCode}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toNumber
    });
    console.log(`SMS sent successfully with SID: ${response.sid}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

export { sendSMS };
