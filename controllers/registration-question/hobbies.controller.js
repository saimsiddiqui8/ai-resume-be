import Hobbie from "../../models/registration-questions/hobbies.model.js";
import { createHobbieSchema, } from "../../validators/registration-questions-validations.js";


const addNewHobby = async (req, res) => {
  try {
    // Validate Input
    const { error, value } = createHobbieSchema.validate(req.body);
    if (error)  return res.status(400).json({ success: false, message: error.details[0].message });

    const { hobbie_name, topics } = value;

    const hobbieExists = await Hobbie.findOne({hobbie_name});

    if (hobbieExists) {
      return res.status(400).json({
        success: false,
        message: 'Hobbie with this name already exists.',
      });
    }

    // Create and Save Hobbie
    const newHobbie = new Hobbie({
      hobbie_name,
      topics,
    });

    const savedHobbie = await newHobbie.save();

    res.status(201).json({
      success: true,
      data: savedHobbie,
    });
  } catch (error) {
    console.error('Error creating hobbie:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

const getAllHobbies = async (req, res) => {
  try {
    // Fetch all hobbies from the database
    const hobbies = await Hobbie.find().select('hobbie_name');

    res.status(200).json({
      success: true,
      data: hobbies,
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
    addNewHobby,
    getAllHobbies,
}