import mongoose from "mongoose";
import TransferableSkills from "../../models/registration-questions/transferable-skills.model.js";
import UserTransferableSkills from "../../models/user-model/transferable-skills/user-transferable-skills.model.js";
import Rank from "../../models/registration-questions/rank.model.js";
import Hobbie from "../../models/registration-questions/hobbies.model.js";
import SportPosition from "../../models/registration-questions/sports-position.model.js";
import Subject from "../../models/registration-questions/subjects.model.js";
import { transferableSkillSchema } from "../../validators/my-library-validations.js";

const toggleTransferableSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rank, athlete, favorite_hobby1, favorite_hobby2, favorite_middle_school_subject, sport } = req.body;

    // Validate request body with Joi
    const { error } = transferableSkillSchema.validate({ rank, athlete, sport, favorite_hobby1, favorite_hobby2, favorite_middle_school_subject });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.details.map((detail) => detail.message),
      });
    }

    // Build the query object
    const query = { userId };
    if (rank) query.rank = rank;
    if (athlete) query.athlete = athlete;
    if (sport) query.sport = sport;
    if (favorite_hobby1) query.favorite_hobby1 = favorite_hobby1;
    if (favorite_hobby2) query.favorite_hobby2 = favorite_hobby2;
    if (favorite_middle_school_subject) query.favorite_middle_school_subject = favorite_middle_school_subject;

    // Check if any record with the exact same data already exists
    const existingRecord = await UserTransferableSkills.findOne(query);

    if (existingRecord) {
      // If exists, delete it (toggle behavior)
      
      await UserTransferableSkills.deleteOne({ _id: existingRecord._id });
      return res.status(200).json({
        success: true,
        message: 'Skill removed from favorites!',
      });
    }

    // Create the new transferable skill object
    const favoriteSkillData = {
      userId,
      rank: rank || null,
      athlete: athlete || null,
      sport: sport || null,
      favorite_hobby1: favorite_hobby1 || null,
      favorite_hobby2: favorite_hobby2 || null,
      favorite_middle_school_subject: favorite_middle_school_subject || null,
    };

    // Save to database
    const newFavoriteSkill = new UserTransferableSkills(favoriteSkillData);
    await newFavoriteSkill.save();

    return res.status(200).json({
      success: true,
      message: 'Skill saved to favorites!',
      // data: newFavoriteSkill,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while toggling the favorite skill.',
      error: error.message,
    });
  }
};

const getUserTransferableSkills = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("userId====", userId);

    // Find all records for the given userId
    const data = await UserTransferableSkills.find({ userId })
      .populate({
        path: "rank.rankId", // Correct path for the rank field
      })
      .populate({
        path: "athlete.athleteId", // Correct path for the athlete field
      })
      .populate({
        path: "sport.sportId", // New addition
      })
      .populate({
        path: "favorite_hobby1.favorite_hobbyId", // Correct path for favorite_hobby1
      })
      .populate({
        path: "favorite_hobby2.favorite_hobbyId", // Correct path for favorite_hobby2
      })
      .populate({
        path: "favorite_middle_school_subject.favoriteSubjectId", // Correct path for favorite_middle_school_subject
      })
      .lean();

    if (!data || data.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }
   

    // Initialize the result array
    const results = data.map((record) => {
      const result = {
        _id: record._id,
      };

      // Define all fields to process
      const fields = [
        "rank",
        "athlete",
        "sport",
        "favorite_hobby1",
        "favorite_hobby2",
        "favorite_middle_school_subject",
      ];

      fields.forEach((field) => {
        const fieldData = record[field];

        if (fieldData) {
          let matchedTopic = null;

          if (field === "rank" && fieldData.rankId) {
            const topics = fieldData.rankId.topics || [];
            matchedTopic = topics.find(
              (topic) =>
                topic._id.toString() === fieldData.descriptionId?.toString()
            );

            result[field] = {
              ...fieldData,
              description: matchedTopic ? matchedTopic.description : null,
              title: matchedTopic ? matchedTopic.title : null,
              rankId: { ...fieldData.rankId }, // Clone the object to avoid modifying the original
            };

            // Remove unnecessary properties
            delete result[field].rankId.topics;
            delete result[field].rankId.serviceId;
            delete result[field].rankId.createdAt;
            delete result[field].rankId.updatedAt;
            delete result[field].rankId.__v;
          } else if (field === "athlete" && fieldData.athleteId) {
            const topics = fieldData.athleteId.topics || [];
            matchedTopic = topics.find(
              (topic) =>
                topic._id.toString() === fieldData.descriptionId?.toString()
            );

            result[field] = {
              ...fieldData,
              description: matchedTopic ? matchedTopic.description : null,
              title: matchedTopic ? matchedTopic.title : null,
              athleteId: { ...fieldData.athleteId }, // Clone the object
            };

            delete result[field].athleteId.topics;
            delete result[field].athleteId.sportId;
            delete result[field].athleteId.createdAt;
            delete result[field].athleteId.updatedAt;
            delete result[field].athleteId.__v;
          } else if (field === "sport" && fieldData.sportId) {
            const topics = fieldData.sportId.topics || [];
            matchedTopic = topics.find(
              (topic) => topic._id.toString() === fieldData.descriptionId?.toString()
            );
          
            result[field] = {
              ...fieldData,
              description: matchedTopic ? matchedTopic.description : null,
              title: matchedTopic ? matchedTopic.title : null,
              sportId: { ...fieldData.sportId },
            };
          
            delete result[field].sportId.topics;
            delete result[field].sportId.createdAt;
            delete result[field].sportId.updatedAt;
            delete result[field].sportId.__v;
          } else if (
            (field === "favorite_hobby1" || field === "favorite_hobby2") &&
            fieldData.favorite_hobbyId
          ) {
            const topics = fieldData.favorite_hobbyId.topics || [];
            matchedTopic = topics.find(
              (topic) =>
                topic._id.toString() === fieldData.descriptionId?.toString()
            );

            result[field] = {
              ...fieldData,
              description: matchedTopic ? matchedTopic.description : null,
              title: matchedTopic ? matchedTopic.title : null,
              favorite_hobbyId: { ...fieldData.favorite_hobbyId }, // Clone the object
            };

            // Uncomment if you still want to remove topics later
            delete result[field].favorite_hobbyId.topics;
            delete result[field].favorite_hobbyId.createdAt;
            delete result[field].favorite_hobbyId.updatedAt;
            delete result[field].favorite_hobbyId.__v;
          } else if (
            field === "favorite_middle_school_subject" &&
            fieldData.favoriteSubjectId
          ) {
            const topics = fieldData.favoriteSubjectId.topics || [];
            matchedTopic = topics.find(
              (topic) =>
                topic._id.toString() === fieldData.descriptionId?.toString()
            );

            result[field] = {
              ...fieldData,
              description: matchedTopic ? matchedTopic.description : null,
              title: matchedTopic ? matchedTopic.title : null,
              favoriteSubjectId: { ...fieldData.favoriteSubjectId }, // Clone the object
            };

            delete result[field].favoriteSubjectId.topics;
            delete result[field].favoriteSubjectId.createdAt;
            delete result[field].favoriteSubjectId.updatedAt;
            delete result[field].favoriteSubjectId.__v;
          }
        }
      });

      return result;
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export { toggleTransferableSkill, getUserTransferableSkills };
