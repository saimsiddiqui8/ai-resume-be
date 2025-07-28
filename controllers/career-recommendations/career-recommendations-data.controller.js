import Answer from "../../models/career-recommendations/answer.model.js";
import Career from "../../models/career-recommendations/career.model.js";
import Question from "../../models/career-recommendations/question.model.js";
import { addCareerSchema, addQuestionSchema, answerValidationSchema } from "../../validators/career-recommendations-validations.js";
import IDPQuestion from "../../models/idp-form/idp-question.model.js";


const addQuestion = async (req, res) => {
    try {
      // Validate the request body
      const { error } = addQuestionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const { question } = req.body;
  
      // Create a new question
      const newQuestion = await Question.create({ question });
  
      return res.status(201).json({
        success: true,
        message: "Question added successfully.",
        data: newQuestion,
      });
    } catch (err) {
      console.error("Error adding question:", err.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

const addCareer = async (req, res) => {
    try {
      // Validate the request body
      const { error } = addCareerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const { career_name } = req.body;
  
      // Create a new career
      const newCareer = await Career.create({ career_name });
  
      return res.status(201).json({
        success: true,
        message: "Career added successfully.",
        data: newCareer,
      });
    } catch (err) {
      console.error("Error adding career:", err.message);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  };

  const addAnswer = async (req, res) => {
    try {
      // Validate request body
      const { error, value } = answerValidationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const { questionId, careerId, answer } = value;

      const career = await Career.findById(careerId);
      if (!career) {
        return res.status(400).json({
          success: false,
          message: "No career exist",
        });
      }
  
      const newAnswer = new Answer({
        questionId,
        careerId,
        answer,
      });
  
      const savedAnswer = await newAnswer.save();
  
      res.status(201).json({
        success: true,
        data: savedAnswer,
        career_name: career.career_name
      });
    } catch (err) {
      console.error('Error adding answer:', err);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  };

  const getAllQuestion = async (req, res) => {
  try {
    const question = await Question.find().sort({ question_no: 1 }).select('question');
    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error('Error getting questions:', err);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
  }
  };
  const getAllAnswer = async (req, res) => {
  try {
    const answer = await Answer.find();
    return res.status(200).json({
      success: true,
      data: answer,
    });
  } catch (error) {
    console.error('Error adding answer:', err);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
  }
  };
  const updateCareer = async (req, res) => {
  try {
    const { id, career_name, ...updateData } = req.body;

    const updatedCareer = await Career.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedCareer) {
      return res.status(400).json({ success: false, message: "Career not found" });
    }

    res.status(200).json({ success: true, data: updatedCareer });
  } catch (error) {
    console.error("Error updating career:", error);
    res.status(500).json({ success: false, message: "Failed to update career", error });
  }
};
const addIDPQuestion = async (req, res) => {
  try {
    // Validate the request body
    const { error } = addQuestionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { question } = req.body;

    // Create a new question
    const newQuestion = await IDPQuestion.create({ question });

    return res.status(201).json({
      success: true,
      message: "Question added successfully.",
      data: newQuestion,
    });
  } catch (err) {
    console.error("Error adding question:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
  export {addQuestion, addCareer, addAnswer, getAllQuestion, getAllAnswer, updateCareer, addIDPQuestion}