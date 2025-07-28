import sgMail from '@sendgrid/mail';
import fs from 'fs';
import dotenv from "dotenv";
import path from "path";
dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function to send email with attachment using SendGrid
const sendEmailWithAttachment = async (to, subject, text, filePath, fileName) => {

  const pdfBuffer = fs.readFileSync(filePath);
  
  const absoluteFilePath = path.resolve(filePath);
   
  
  const attachment = fs.readFileSync(absoluteFilePath).toString("base64");
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_SENDER, // Verified sender email
      name: 'Second Shot', // Optional: Add a sender name
    },
    subject,
    text,
    attachments: [
      {
        content: attachment,
        filename: fileName,
        type: 'application/pdf', // Adjust based on file type
        disposition: 'attachment',
      },
    ],
  };

  try {
    sgMail.send(msg).catch(err => {
      console.log(err);
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error('Failed to send email');
  }
};

export { sendEmailWithAttachment };