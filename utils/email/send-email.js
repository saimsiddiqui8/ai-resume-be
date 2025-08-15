// sendGridEmail.js
import emailTemplate from '../../views/email-template.js';
import { transporter } from './send-email-with-file.js';


async function sendEmail(to, fullName, otpCode) {
  const msg = {
    from: `"Res AI" <${process.env.SMTP_USER || 'admin@focuslabsinc.com'}>`,
    to,
    subject: 'Your OTP for Registration',
    html: emailTemplate(fullName, otpCode),
  };

  try {
    await transporter.sendMail(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


export default sendEmail;
