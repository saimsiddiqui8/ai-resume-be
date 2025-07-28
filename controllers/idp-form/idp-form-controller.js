import IDPAward from "../../models/idp-form/idp-award.model.js";
import IDPQuestion from "../../models/idp-form/idp-question.model.js";
import { sendEmailWithAttachment } from "../../utils/email/send-email-with-file.js";
import { addSupportPeopleSchema, submitIDPFormSchema, updateIDPAnswerSchema } from "../../validators/idp-form-validations.js";
import fs from 'fs';



const IDPQuestions = async (req, res) => {
    try {
      const questions = await IDPQuestion.find().select("question question_no createdAt");
  
      return res.status(200).json({
        success: true,
        message: "IDP questions fetched successfully.",
        data: questions,
      });
    } catch (err) {
      console.error("Error fetching IDP questions:", err.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  const submitIDPForm = async (req, res) => {
    try {
      // Validate request
      const { error } = submitIDPFormSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const userId = req.user.id;
      const { data } = req.body;
  
      // Prepare data for insertion
      const preparedData = data.map((item) => ({
        question: item.questionId,
        answer: item.answer,
      }));
  
      // Find and update if exists, otherwise create new
      const updatedAward = await IDPAward.findOneAndUpdate(
        { user: userId },
        { 
          user: userId, 
          data: preparedData 
        },
        { 
          new: true,      // return the updated document
          upsert: true,   // create if doesn't exist
          setDefaultsOnInsert: true 
        }
      );
  
      return res.status(201).json({
        success: true,
        message: 'IDP Form submitted successfully',
        data: updatedAward,
      });
    } catch (err) {
      console.error('Error submitting IDP form:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Internal server error.',
      });
    }
  };
  
  const getMyIDPAward = async (req, res) => {
    try {
      const userId = req.user.id;
  
      
      const award = await IDPAward.findOne({ user: userId })
        .populate({
          path: 'data.question',
          select: 'question', // only fetch 'question' field
          model: IDPQuestion,
        }).select('data support_people createdAt');
  
      if (!award) {
        return res.status(200).json({
          success: true,
          message: "IDP Award fetched successfully.",
          data: [],
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "IDP Award fetched successfully.",
        data: award,
      });
    } catch (err) {
      console.error("Error fetching IDP Award:", err.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  const updateIDPAnswer = async (req, res) => {
    try {
      // Validate request
      const { error } = updateIDPAnswerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const userId = req.user.id;
      const { questionId, answer } = req.body;
  
      // Find the user's IDP Award
      let award = await IDPAward.findOne({ user: userId });
  
      // If no record exists, create with all questions and null answers
      if (!award) {
        const allQuestions = await IDPQuestion.find().select("_id");
        const data = allQuestions.map((q) => ({
          question: q._id,
          answer: null,
        }));
  
        award = new IDPAward({
          user: userId,
          data,
        });
      }
  
      // Check if the question already exists in the data array
      const questionEntry = award.data.find(
        (entry) => entry.question.toString() === questionId
      );
  
      if (questionEntry) {
        // If exists, update the answer
        questionEntry.answer = answer;
      } else {
        // In case not found (but ideally should not happen), push manually
        award.data.push({
          question: questionId,
          answer: answer,
        });
      }
  
      // Save the document
      await award.save();
  
      return res.status(200).json({
        success: true,
        message: "Answer updated successfully.",
        data: award,
      });
    } catch (err) {
      console.error("Error updating IDP answer:", err.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };
  

  const sendIDPForm = async (req, res) => {
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
        'IDP Awards',
        'Please find the attached IDP Awards',
        filePath,
        fileName
      );
  
      // Delete the temporary file
      fs.unlinkSync(filePath);
  
      res.status(200).json({ success: true, message: 'IDP Awards sent successfully' });
    } catch (error) {
      console.error('Error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: 'Error processing request' });
    }
  };

  const addSupportPeople = async (req, res) => {
    try {
      if (typeof req.body.supportPeople === 'string') {
        req.body.supportPeople = JSON.parse(req.body.supportPeople);
      }
  
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
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }
  
      const { path: filePath, originalname: fileName } = req.file;
      const { supportPeople } = value;
      const userId = req.user.id;
  
      const idpAward = await IDPAward.findOne({ user: userId });
      if (!idpAward) {
        return res.status(400).json({
          success: false,
          message: "IDP Award not found for the user.",
        });
      }
  
      let existingSupportPeople = idpAward.support_people || [];
  
      // Filter out duplicates
      const uniqueNewSupportPeople = supportPeople.filter(
        (person) =>
          !existingSupportPeople.some(
            (existing) =>
              existing.full_name === person.full_name &&
              existing.email_address === person.email_address
          )
      );
  
      const finalCount = existingSupportPeople.length + uniqueNewSupportPeople.length;
  
      if (finalCount > 2) {
        return res.status(400).json({
          success: false,
          message: "IDP can have a maximum of 2 support people.",
        });
      }
  
      // Push new unique people
      idpAward.support_people.push(...uniqueNewSupportPeople);
      await idpAward.save();
  
      const userName = req.user.name;
  
      for (const person of uniqueNewSupportPeople) {
        const subject = `${userName} Just Shared Their IDP with You!`;
        const text = `Hi ${person.full_name},
  
  ${userName} has created their IDP and wanted to share it with you! Please find the attached file and support them in their journey.`;
  
        await sendEmailWithAttachment(
          person.email_address,
          subject,
          text,
          filePath,
          fileName
        );
      }
  
      fs.unlinkSync(filePath); // Clean up
  
      return res.status(200).json({
        success: true,
        message: "Support people added successfully!",
        data: idpAward,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

export {IDPQuestions, submitIDPForm, getMyIDPAward, updateIDPAnswer, sendIDPForm, addSupportPeople}  
  