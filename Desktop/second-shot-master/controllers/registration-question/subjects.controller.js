import Subject from "../../models/registration-questions/subjects.model.js";
import { createSubjectSchema, } from "../../validators/registration-questions-validations.js";


const addNewSubject = async (req, res) => {
  try {
    // Validate Input
    const { error, value } = createSubjectSchema.validate(req.body);
    if (error)  return res.status(400).json({ success: false, message: error.details[0].message });

    const { subject_name, topics } = value;

    const subjectExists = await Subject.findOne({subject_name});

    if (subjectExists) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this name already exists.',
      });
    }

    // Create and Save Subject
    const newSubject = new Subject({
      subject_name,
      topics,
    });

    const savedSubject = await newSubject.save();

    res.status(201).json({
      success: true,
      data: savedSubject,
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

const getAllSubjects = async (req, res) => {
  try {
    // Fetch all subjects from the database
    const subjects = await Subject.find().select('subject_name');

    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
}

export {
    addNewSubject,
    getAllSubjects,
}