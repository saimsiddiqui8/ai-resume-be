import mongoose from "mongoose";
import CareerRecommendation from "../../models/career-recommendations/career-recommendation.model.js";
import SuccessStory from "../../models/success-story/success-story.model.js";
import uploadManager from "../../utils/Multer/uploadManager.js";
import { getStorySchema, searchSchema, successStorySchema } from "../../validators/success-story-validations.js";
import Career from "../../models/career-recommendations/career.model.js";
import Notification from "../../models/notifications/notification.model.js";
import sendNotification from "../../utils/notification/send-notification.js";



const createSuccessStoryProfile = async (req, res) => {
    try {
        if (typeof req.body.career_recommendations === 'string') {
            req.body.career_recommendations = JSON.parse(req.body.career_recommendations);
          }
        
        // Validate the rest of the fields using Joi
        const { error, value } = successStorySchema.validate(req.body, {
          abortEarly: false,
        });
        if (error) {
          return res.status(400).json({
            success: false,
            message: error.details[0].message
          });
        }
  
        let profilePicture = "" ;
  
        if(req.file){
          console.log("in");
          
          const profilePictureDocumentPath = await uploadManager.upload({
            fileName: req.file.filename,
            key: `pictures`, // Organize documents within a user folder
            fileReference: req.file.path, // Assuming single file upload for each field
            contentType: "image",
          });
          profilePicture = profilePictureDocumentPath.Location;
    
        }
  
        // Combine validated fields with the uploaded image path
        const successStoryData = {
          ...value,
          profile_img: profilePicture,
        };
  
        // Create the Success Story document
        const successStory = new SuccessStory(successStoryData);
        await successStory.save();

        const users = await Notification.find({ notification_enabled: true }).lean();
        const allFcmTokens = users.flatMap(user => user.devices.map(device => device.fcmToken));
        const uniqueFcmTokens = [...new Set(allFcmTokens)];

        if (uniqueFcmTokens.length > 0) {
            await sendNotification(
                uniqueFcmTokens,
                "New Success Story!",
                "A new success story has been added. Check it out now!",
            );
        }
        
  
        return res.status(201).json({
          message: 'Success story created successfully',
          data: successStory,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          message: 'Internal Server Error',
        });
      }
    
}

const updateSuccessStory = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the existing success story
    const story = await SuccessStory.findById(id);
    if (!story) {
      return res.status(400).json({ success: false, message: "Success story not found." });
    }

    // Prepare updated fields
    const allowedFields = [
      "name",
      "profession",
      "profession2",
      "youtube_link",
      "current_profession",
      "linkedin_profile"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        story[field] = req.body[field];
      }
    });

    // Handle profile image upload if present
    if (req.file) {
      const uploaded = await uploadManager.upload({
        fileName: req.file.filename,
        key: "pictures",
        fileReference: req.file.path,
        contentType: "image",
      });
      story.profile_img = uploaded.Location;
    }

    await story.save();

    return res.status(200).json({
      success: true,
      message: "Success story updated successfully.",
      data: story,
    });

  } catch (error) {
    console.error("Error updating success story:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the success story.",
    });
  }
};

const allSuccessStory = async (req, res) => {
    try {
        // Extract query parameters for pagination
        const { page = 1, limit = 10 } = req.query;
    
        
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
    
        
        const successStories = await SuccessStory.find({ is_deleted: false })
        .skip((pageNumber - 1) * limitNumber) // Skip documents for pagination
        .limit(limitNumber); // Limit the number of documents per page
        
    
        const totalStories = await SuccessStory.countDocuments({ is_deleted: false });
    
       
        return res.status(200).json({
          success: true,
          data: successStories,
          pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(totalStories / limitNumber),
            totalItems: totalStories,
          },
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch success stories. Please try again later.',
        });
      }   
}

const successStoryById = async (req, res) => {
  // Validate the request body
  const { error, value } = getStorySchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { story_id } = value;

  try {
    // Fetch the success story by story_id
    const successStory = await SuccessStory.findById(story_id).select('-updatedAt');

    if (!successStory) {
      return res.status(400).json({
        success: false,
        message: 'Success story not found',
      });
    }

    // Return the success story
    return res.status(200).json({
      success: true,
      data: successStory,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch success story. Please try again later.',
    });
  } 
}

const searchSuccessStory = async (req, res) => {
  try {
      // Validate request body using Joi
      const { error, value } = searchSchema.validate(req.query);

      if (error) {
          return res.status(400).json({
              success: false,
              message: error.details[0].message,
          });
      }

      const { search } = value;
      const query = { name: { $regex: search, $options: "i" } };

      const successStories = await SuccessStory.find(query);

      return res.status(200).json({
          success: true,
          data: successStories,
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          success: false,
          message: "Failed to search success stories. Please try again later.",
      });
  }
};

const myMatchProfiles = async (req, res) => {
  try {
      const userId = req.user.id;

      // Fetch all career recommendations for the user
      let recommendations = await CareerRecommendation.find({ user: userId }).lean();

      for (let rec of recommendations) {
          for (let dataItem of rec.data) {
              if (mongoose.Types.ObjectId.isValid(dataItem.career)) {
                  dataItem.career = new mongoose.Types.ObjectId(dataItem.career);
              }
          }
      }

      // Collect only the top 5 recommended careers per recommendation
      let careerIds = recommendations.flatMap(rec => 
          rec.data
              .sort((a, b) => b.point - a.point) // Sort careers by points (highest first)
              .slice(0, 5) // Keep only top 5 careers per recommendation
              .map(d => d.career.toString())
      );

      // Remove duplicate career IDs
      const uniqueCareerIds = [...new Set(careerIds)];

      // Fetch Success Stories where career_recommendations contain any matched careerId
      const successStories = await SuccessStory.find({ career_recommendations: { $in: uniqueCareerIds } });

      return res.status(200).json({
          success: true,
          data: successStories
      });

  } catch (error) {
      console.error("Error fetching matched profiles and success stories:", error);
      return res.status(500).json({
          success: false,
          message: "Internal Server Error"
      });
  }
};

const deleteSuccessStory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the success story exists
    const story = await SuccessStory.findById(id);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Success story not found.",
      });
    }

    // Delete the document
    await SuccessStory.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Success story deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting success story:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the success story.",
    });
  }
};



export {createSuccessStoryProfile, allSuccessStory, successStoryById,searchSuccessStory, myMatchProfiles, updateSuccessStory, deleteSuccessStory }