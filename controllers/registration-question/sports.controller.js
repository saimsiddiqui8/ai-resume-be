import Rank from "../../models/registration-questions/rank.model.js";
import Service from "../../models/registration-questions/services.model.js";
import SportPosition from "../../models/registration-questions/sports-position.model.js";
import Sport from "../../models/registration-questions/sports.model.js";
import { addSportPositionSchema, createRankSchema, sportValidationSchema } from "../../validators/registration-questions-validations.js";


const addNewSport = async (req, res) => {
    const { error } = sportValidationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
  
    const { sport_name } = req.body;
  
    try {
      // Check if the sport already exists
      const existingSport = await Sport.findOne({ sport_name });
  
      if (existingSport) {
        return res.status(400).json({
          success: false,
          message: 'Sport with this name already exists.',
        });
      }
  
      // Create a new sport
      const sport = new Sport({ sport_name });
      await sport.save();
  
      return res.status(201).json({
        success: true,
        message: 'Sport created successfully!',
        data: sport,
      });
    } catch (error) {
      console.error('Error creating sport:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
}

const updateSportTopics = async (req, res) => {
  try {
    // Validate request body (optional: add Joi schema if you want)
    const { sportId, topics } = req.body;

    if (!sportId || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "sportId and at least one topic are required.",
      });
    }

    // Check if the sport exists
    const sport = await Sport.findById(sportId);
    if (!sport) {
      return res.status(404).json({
        success: false,
        message: "Sport not found.",
      });
    }

    // Validate topic fields
    for (const topic of topics) {
      if (!topic.title || !topic.description) {
        return res.status(400).json({
          success: false,
          message: "Each topic must have a title and description.",
        });
      }
    }

    // Add topics to the existing array
    sport.topics.push(...topics);

    // Save the updated sport
    await sport.save();

    return res.status(200).json({
      success: true,
      message: "Topics added successfully.",
      data: sport,
    });

  } catch (error) {
    console.error("Error updating sport topics:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


const getAllSports = async (req, res) => {
    try {
        // Fetch all sports from the database
        const sports = await Sport.find().select('sport_name');
   
        return res.status(200).json({
          success: true,
          data: sports,
        });
      } catch (error) {
        console.error('Error fetching sports:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal Server Error',
        });
      }
}

const addNewSportPosition = async (req, res) => {
  try {
    // Validate Input
    const { error, value } = addSportPositionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { position_name, sportId, topics } = value;

    // Check if sportId exists in the Sport collection
    const sportExists = await Sport.findById(sportId);
    if (!sportExists) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    // Create and Save Sport Position
    const newSportPosition = new SportPosition({
      position_name,
      sportId,
      topics,
    });
    const savedSportPosition = await newSportPosition.save();

    res.status(201).json({
      message: 'Sport position created successfully',
      data: savedSportPosition,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

const getAllSportsPosition = async (req, res) => {
    try {
        // Fetch all sportPositions and populate the related sport name
        const sportPositions = await SportPosition.find().populate('sportId', 'sport_name').select('position_name sportId');
    
        return res.status(200).json({
          success: true,
          data: sportPositions,
        });
      } catch (error) {
        console.error('Error fetching sportPositions:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal Server Error',
        });
      }
}

export {
    addNewSport,
    getAllSports,
    addNewSportPosition,
    getAllSportsPosition,
    updateSportTopics
}