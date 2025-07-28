import Hobbie from "../../models/registration-questions/hobbies.model.js";
import Rank from "../../models/registration-questions/rank.model.js";
import RegistrationQuestions from "../../models/registration-questions/registration-questions.model.js";
import Service from "../../models/registration-questions/services.model.js";
import SportPosition from "../../models/registration-questions/sports-position.model.js";
import Sport from "../../models/registration-questions/sports.model.js";
import Subject from "../../models/registration-questions/subjects.model.js";
import TransferableSkills from "../../models/registration-questions/transferable-skills.model.js";
import User from "../../models/user-model/user.model.js";
import { sendEmailWithAttachment } from "../../utils/email/send-email-with-file.js";
import { addSupportPeopleSchema, registrationQuestionsValidationSchema } from "../../validators/registration-questions-validations.js";
import fs from 'fs';



const registrationQuestions = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registrationQuestionsValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const userId = req.user.id;
    const {
      current_grade_level,
      major_trade_or_military,
      highest_degree_completion,
      is_eighteen_or_older,
      has_military_service,
      branch_of_service,
      rank,
      is_athlete,
      primary_sport,
      sport_position,
      favorite_hobby1,
      favorite_hobby2,
      favorite_middle_school_subject,
      has_job_experience,
      recent_job_title,
      desired_career_path,
    } = value;

    // Update or create the registration questions record
    const registrationResult = await RegistrationQuestions.findByIdAndUpdate(
      userId, // Search by userId
      {
        userId,
        current_grade_level,
        major_trade_or_military,
        highest_degree_completion,
        is_eighteen_or_older,
        has_military_service,
        branch_of_service: has_military_service ? branch_of_service : null,
        rank: has_military_service ? rank : null,
        is_athlete,
        primary_sport: is_athlete ? primary_sport : null,
        sport_position: is_athlete ? sport_position : null,
        favorite_hobby1,
        favorite_hobby2,
        favorite_middle_school_subject,
        has_job_experience,
        recent_job_title: has_job_experience ? recent_job_title : null,
        desired_career_path,
        support_people: []
      },
      { upsert: true, new: true } // Create if not found, return updated document
    );

    // Prepare transferable skills data
    const transferableSkillsData = {
      userId,
      has_military_service,
      military: {
        branch_of_service: has_military_service ? branch_of_service : null,
        rank: has_military_service ? rank : null,
      },
      is_athlete,
      athlete: {
        primary_sport: is_athlete ? primary_sport : null,
        sport_position: is_athlete ? sport_position : null,
      },
      favorite_hobby1: favorite_hobby1,
      favorite_hobby2: favorite_hobby2,
      favorite_middle_school_subject: favorite_middle_school_subject,
      support_people: []
    };

    // Update or create transferable skills record
    const transferableSkillsResult = await TransferableSkills.findByIdAndUpdate(
      userId, // Search by userId
      { $set: transferableSkillsData },
      { upsert: true, new: true } // Create if not found, return updated document
    );
    await User.findByIdAndUpdate(userId, {is_registration_question_completed : true})
    return res.status(200).json({
      success: true,
      data: {
        registration: registrationResult,
        transferableSkills: transferableSkillsResult,
      },
    });
  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getRegistrationQuestions = async (req, res) => {
  try {
    const userId = req.user.id;

    const registration = await RegistrationQuestions.findOne({ userId })
      .populate('branch_of_service', 'service_name')
      .populate('rank', 'rank_name') 
      .populate('primary_sport', 'sport_name') 
      .populate('sport_position', 'position_name') 
      .populate('favorite_hobby1', 'hobbie_name') 
      .populate('favorite_hobby2', 'hobbie_name') 
      .populate('favorite_middle_school_subject', 'subject_name')
      .select('-userId -createdAt -updatedAt'); 

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'registration not found for the user!',
      });
    }

    return res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (err) {
    console.error('Error fetching registration:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};
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

    const { supportPeople } = value;
    const userId =  req.user.id;
    // Fetch the transferablleSkills by its ID
    const transferablleSkills = await TransferableSkills.findOne({ userId })
    if (!transferablleSkills) {
      return res.status(400).json({
        success: false,
        message: "Transferable skill not found!",
      });
    }

    let existingSupportPeople = transferablleSkills.support_people;

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
        message: "A transferablle skills can have a maximum of 2 support people.",
      });
    }

    // Add only unique new support people
    transferablleSkills.support_people.push(...uniqueNewSupportPeople);

    await transferablleSkills.save();
    const userName = req.user.name;
    
    // Send emails to new support people
    for (const person of uniqueNewSupportPeople) {
      const subject = `${userName} Just Shared Their Transferablle Skills with You!`;
      
      const text = `Hi ${person.full_name},

${userName} has created their transferablleSkills and wanted to share it with you! Stay connected and support them in their career journey!
Please find the attached transferablle Skills`;

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
      data: transferablleSkills,
    });
  } catch (err) {
      console.error(err);
      return res.status(500).json({
          success: false,
          message: 'Internal Server Error',
      });
  }
};

const getAllQuestionOptions = async (req, res) => {
  try {
    // Run all queries in parallel using Promise.all
    const [
      services,
      ranks,
      sports,
      sportPositions,
      hobbies,
      subjects
    ] = await Promise.all([
      Service.find().select('service_name'),
      Rank.find().populate('serviceId', 'service_name').select('rank_name serviceId'),
      Sport.find().select('sport_name'),
      SportPosition.find().populate('sportId', 'sport_name').select('position_name sportId'),
      Hobbie.find().select('hobbie_name'),
      Subject.find().select('subject_name')
    ]);

    return res.status(200).json({
      success: true,
      data: {
        services,
        ranks,
        sports,
        sportPositions,
        hobbies,
        subjects
      }
    });

  } catch (error) {
    console.error('Error fetching question options:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

export {registrationQuestions, getRegistrationQuestions, getAllQuestionOptions, addSupportPeople} 