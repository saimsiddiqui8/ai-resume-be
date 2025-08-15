import sgMail from '@sendgrid/mail';
import fs from 'fs';
import dotenv from "dotenv";
import path from "path";
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // SSL/TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Function to send email with attachment using SendGrid
export const sendEmailWithAttachment = async (to, subject, text, filePath, fileName) => {
  const absoluteFilePath = path.resolve(filePath);

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Res AI'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    attachments: [
      {
        filename: fileName || path.basename(absoluteFilePath),
        path: absoluteFilePath,
        contentType: 'application/pdf',  // adjust if not PDF
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('SMTP send failed:', err);
    throw err;
  }
};

export { sendEmailWithAttachment };