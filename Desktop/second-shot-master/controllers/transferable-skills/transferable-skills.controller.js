import TransferableSkills from "../../models/registration-questions/transferable-skills.model.js";
import UserTransferableSkills from "../../models/user-model/transferable-skills/user-transferable-skills.model.js";
import { sendEmailWithAttachment } from "../../utils/email/send-email-with-file.js";
import fs from 'fs';


// const getTransferableSkills = async (req, res) => {
//     try {
//       const userId = req.user.id;
  
      
//       const transferableSkills = await TransferableSkills.findOne({ userId })
//         .populate('military.branch_of_service', 'service_name')
//         .populate('military.rank', 'rank_name topics') 
//         .populate('athlete.primary_sport', 'sport_name') 
//         .populate('athlete.sport_position', 'position_name topics')
//         .populate('favorite_hobby1', 'hobbie_name topics') 
//         .populate('favorite_hobby2', 'hobbie_name topics')
//         .populate('favorite_middle_school_subject', 'subject_name topics').select('-createdAt -updatedAt -userId')
//         .lean();
  
//       if (!transferableSkills) {
//         return res.status(400).json({
//           success: false,
//           message: 'Transferable skills data not found for this user.',
//         });
//       }

//       // Function to add `is_favorite: false` to all topics
//       const addIsFavorite = (topics) => {
//         console.log("topics===", topics);
//         console.log("topics===", typeof(topics));
        
//         return topics?.map(topic => {
//             let topicObj = topic.toObject ? topic.toObject() : topic; // Ensure it's a plain object
//             return {
//                 ...topicObj,
//                 is_favorite: false, // Explicitly set it
//             };
//         }) || [];
//     };

//     // Add `is_favorite` to topics in different categories
//     if (transferableSkills.military?.rank?.topics) {
//         transferableSkills.military.rank.topics = addIsFavorite(transferableSkills.military.rank.topics);
//         console.log("transferableSkills====", transferableSkills.military.rank.topics);
        
//     }
//     if (transferableSkills.athlete?.sport_position?.topics) {
//         transferableSkills.athlete.sport_position.topics = addIsFavorite(transferableSkills.athlete.sport_position.topics);
//     }
//     if (transferableSkills.favorite_hobby1?.topics) {
//         transferableSkills.favorite_hobby1.topics = addIsFavorite(transferableSkills.favorite_hobby1.topics);
//     }
//     if (transferableSkills.favorite_hobby2?.topics) {
//         transferableSkills.favorite_hobby2.topics = addIsFavorite(transferableSkills.favorite_hobby2.topics);
//     }
//     if (transferableSkills.favorite_middle_school_subject?.topics) {
//         transferableSkills.favorite_middle_school_subject.topics = addIsFavorite(transferableSkills.favorite_middle_school_subject.topics);
//     }
  
//       return res.status(200).json({
//         success: true,
//         data: transferableSkills,
//       });
//     } catch (err) {
//       console.error('Error:', err.message);
//       return res.status(500).json({
//         success: false,
//         message: 'Internal Server Error',
//       });
//     }
//   };

const getTransferableSkills = async (req, res) => {
  try {
      const userId = req.user.id;

      // Fetch the main transferable skills data
      const transferableSkills = await TransferableSkills.findOne({ userId })
          .populate('military.branch_of_service', 'service_name')
          .populate('military.rank', 'rank_name topics')
          .populate('athlete.primary_sport', 'sport_name topics')
          .populate('athlete.sport_position', 'position_name topics')
          .populate('favorite_hobby1', 'hobbie_name topics')
          .populate('favorite_hobby2', 'hobbie_name topics')
          .populate('favorite_middle_school_subject', 'subject_name topics')
          .select('-createdAt -updatedAt -userId')
          .lean();

      if (!transferableSkills) {
          return res.status(400).json({
              success: false,
              message: 'Transferable skills data not found for this user.',
          });
      }
     
      
      // Fetch ALL user's selected favorites from UserTransferableSkills
      const userTransferableSkillsList = await UserTransferableSkills.find({ userId }).lean();

      // Aggregate all descriptionIds from all documents
      const favoriteDescriptionIds = {
          militaryRank: new Set(),
          athleteSportPosition: new Set(),
          primarySport: new Set(),
          hobby1: new Set(),
          hobby2: new Set(),
          subject: new Set()
      };

      userTransferableSkillsList.forEach(doc => {
          if (doc.rank?.descriptionId) {
              favoriteDescriptionIds.militaryRank.add(doc.rank.descriptionId.toString());
          }
          if (doc.athlete?.descriptionId) {
              favoriteDescriptionIds.athleteSportPosition.add(doc.athlete.descriptionId.toString());
          }
          if (doc.sport?.descriptionId) {
            favoriteDescriptionIds.primarySport.add(doc.sport.descriptionId.toString());
          }
          if (doc.favorite_hobby1?.descriptionId) {
              favoriteDescriptionIds.hobby1.add(doc.favorite_hobby1.descriptionId.toString());
          }
          if (doc.favorite_hobby2?.descriptionId) {
              favoriteDescriptionIds.hobby2.add(doc.favorite_hobby2.descriptionId.toString());
          }
          if (doc.favorite_middle_school_subject?.descriptionId) {
              favoriteDescriptionIds.subject.add(doc.favorite_middle_school_subject.descriptionId.toString());
          }
      });

      // Function to check if topic exists in favorites
      const checkIsFavorite = (topics, categorySet) => {
          return topics?.map(topic => ({
              ...topic,
              is_favorite: categorySet.has(topic._id.toString())
          })) || [];
      };
      

      // Update each category with aggregated favorites
      if (transferableSkills.military?.rank?.topics) {
          transferableSkills.military.rank.topics = checkIsFavorite(
              transferableSkills.military.rank.topics,
              favoriteDescriptionIds.militaryRank
          );
      }

      if (transferableSkills.athlete?.primary_sport?.topics) {
        transferableSkills.athlete.primary_sport.topics = checkIsFavorite(
          transferableSkills.athlete.primary_sport.topics,
          favoriteDescriptionIds.primarySport
        );
      }

      if (transferableSkills.athlete?.sport_position?.topics) {
          transferableSkills.athlete.sport_position.topics = checkIsFavorite(
              transferableSkills.athlete.sport_position.topics,
              favoriteDescriptionIds.athleteSportPosition
          );
      }

      if (transferableSkills.favorite_hobby1?.topics) {
          transferableSkills.favorite_hobby1.topics = checkIsFavorite(
              transferableSkills.favorite_hobby1.topics,
              favoriteDescriptionIds.hobby1
          );
      }

      if (transferableSkills.favorite_hobby2?.topics) {
          transferableSkills.favorite_hobby2.topics = checkIsFavorite(
              transferableSkills.favorite_hobby2.topics,
              favoriteDescriptionIds.hobby2
          );
      }

      if (transferableSkills.favorite_middle_school_subject?.topics) {
          transferableSkills.favorite_middle_school_subject.topics = checkIsFavorite(
              transferableSkills.favorite_middle_school_subject.topics,
              favoriteDescriptionIds.subject
          );
      }

      return res.status(200).json({
          success: true,
          data: transferableSkills,
      });
  } catch (err) {
      console.error('Error:', err.message);
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
        'Transferable Skills',
        'Please find the attached transferable skills',
        filePath,
        fileName
      );
  
      // Delete the temporary file
      fs.unlinkSync(filePath);
  
      res.status(200).json({ success: true, message: 'Transferable skills sent successfully' });
    } catch (error) {
      console.error('Error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: 'Error processing request' });
    }
  };

 export {getTransferableSkills, sendToEmail} 