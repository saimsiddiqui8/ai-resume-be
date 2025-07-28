// sendGridEmail.js
import sgMail from '@sendgrid/mail';
import emailTemplate from '../../views/email-template.js';


async function sendEmail(to, fullName, otpCode) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to,
    from: process.env.SENDGRID_SENDER, // Replace with your verified sender email
    subject: 'Your OTP for Registration', // Customize the subject line
    html: emailTemplate(fullName, otpCode),
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent successfully:");
  } catch (error) {
    console.error('Error sending email:', error);
    // Handle email sending errors gracefully (e.g., log details, retry, alternative notifications)
  }
}

export default sendEmail;
