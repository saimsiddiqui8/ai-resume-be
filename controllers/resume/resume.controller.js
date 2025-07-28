import Resume from "../../models/my-resume/resume.model.js";
import { sendEmailWithAttachment } from "../../utils/email/send-email-with-file.js";
import { addSupportPeopleSchema, deleteResumeValidationSchema, resumeDetailSchema, resumeValidationSchema, updateResumeValidationSchema } from "../../validators/resume-validations.js";
import fs from 'fs';

const createResume = async (req, res) => {
    try {
        // Validate the request body using Joi
        const { error, value } = resumeValidationSchema.validate(req.body, {
          abortEarly: false, // Return all validation errors
        });
    
        if (error) {
          return res.status(400).json({
            success: false,
            message: error.details[0].message
          });
        }
        const userId = req.user.id;
        const resumeData = { ...value, userId };
        // Create a new resume using the validated data
        const newResume = new Resume(resumeData);
        await newResume.save();
    
        return res.status(201).json({
          success: true,
          message: "Resume created successfully!",
          data: newResume,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
}

const getMyResumes = async (req, res) => {
    try {

      const userId = req.user.id;
  
      const resumes = await Resume.find({ userId }).sort({ createdAt: -1 })
      // .populate('userId', 'name email phone -_id');
  
  
      return res.status(200).json({
        success: true,
        data: resumes,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  const resumeDetail = async (req, res) => {
    try {
      // Validate request body
      const { error, value } = resumeDetailSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const userId = req.user.id;
      const { resumeId } = value;
  
      // Find resume by ID and ensure it belongs to the requesting user
      const resume = await Resume.findOne({ _id: resumeId, userId })
        // .populate("userId", "name email phone -_id");
  
      if (!resume) {
        return res.status(400).json({
          success: false,
          message: "Resume not found!",
        });
      }
  
      return res.status(200).json({
        success: true,
        data: resume,
      });
    } catch (err) {
      console.error("Error fetching resume:", err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  
  const updateResume = async (req, res) => {
    try {
      // Validate the request body
      const { error, value } = updateResumeValidationSchema.validate(req.body, {
        abortEarly: false, // Return all validation errors
      });
  
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details.map((err) => err.message).join(', '),
        });
      }
  
      const userId = req.user.id;
      const { resume_id, ...updateData } = value;
  
      // Check if the resume exists and belongs to the user
      const resume = await Resume.findOne({ _id: resume_id, userId });
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found or you do not have permission to update it.',
        });
      }
  
      // Update the resume
      Object.assign(resume, updateData);
      await resume.save();
  
      return res.status(200).json({
        success: true,
        message: 'Resume updated successfully!',
        data: resume,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  };

  // API to add support people to an existing resume
  const addSupportPeople = async (req, res) => {
    
    try {
      if (typeof req.body.supportPeople === 'string') {
        req.body.supportPeople = JSON.parse(req.body.supportPeople);
      }
      console.log(typeof(req.body.supportPeople));
      // Validate the request body
      const { error, value } = addSupportPeopleSchema.validate(req.body, {
        abortEarly: false,
      });
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
  
      const { path: filePath, originalname: fileName } = req.file;

      const { resumeId, supportPeople } = value;

      // Fetch the resume by its ID
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(400).json({
          success: false,
          message: "Resume not found!",
        });
      }

      let existingSupportPeople = resume.support_people;

      // Filter out duplicate support people
      const uniqueNewSupportPeople = supportPeople.filter(
        (person) =>
          !existingSupportPeople.some(
            (existing) =>
              existing.full_name === person.full_name &&
              existing.email_address === person.email_address &&
              existing.phone_number === person.phone_number
          )
      );

      // **Fix: Ensure final count does not exceed 2**
      const finalSupportPeopleCount =
        existingSupportPeople.length + uniqueNewSupportPeople.length;

      if (finalSupportPeopleCount > 2) {
        return res.status(400).json({
          success: false,
          message: "A resume can have a maximum of 2 support people.",
        });
      }

      // Add only unique new support people
      resume.support_people.push(...uniqueNewSupportPeople);

      await resume.save();
      const userName = req.user.name;
      
      // Send emails to new support people
      for (const person of uniqueNewSupportPeople) {
        const subject = `${userName} Just Shared Their Resume with You!`;
        
        const text = `Hi ${person.full_name},

${userName} has created their resume and wanted to share it with you! Stay connected and support them in their career journey!
Please find the attached resume`;

        if (req.file) {
          // Ensure there is a file to attach
          await sendEmailWithAttachment(
            person.email_address,
            subject,
            text,
            filePath,
            fileName
          );
          // Delete the temporary file
      fs.unlinkSync(filePath);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Support people added successfully!",
        data: resume,
      });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

  const sendToEmail = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
  
      const { path: filePath, originalname: fileName } = req.file;
      const userEmail = req.user.email;
      console.log("userEmail===", userEmail);
      
      // Send email with the attached resume
      await sendEmailWithAttachment(
        userEmail,
        'New Resume',
        'Please find the attached resume',
        filePath,
        fileName
      );
  
      // Delete the temporary file
      fs.unlinkSync(filePath);
  
      res.status(200).json({ success: true, message: 'Resume sent successfully' });
    } catch (error) {
      console.error('Error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: 'Error processing request' });
    }
  };

  const deleteResume = async (req, res) => {
    try {
      
      const { error, value } = deleteResumeValidationSchema.validate(req.body, {
        abortEarly: false,
      });
  
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const { resume_id } = value; 
      const userId = req.user.id; 
  
      // Find the resume by its ID and ensure it belongs to the logged-in user
      const resume = await Resume.findOne({ _id: resume_id, userId });
  
      if (!resume) {
        return res.status(400).json({
          success: false,
          message: "Resume not found or you do not have permission to delete it.",
        });
      }
  
      // Delete the resume
      await Resume.deleteOne({ _id: resume_id });
  
      return res.status(200).json({
        success: true,
        message: "Resume deleted successfully!",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };
  
export {createResume, getMyResumes, resumeDetail, updateResume, addSupportPeople, deleteResume, sendToEmail}