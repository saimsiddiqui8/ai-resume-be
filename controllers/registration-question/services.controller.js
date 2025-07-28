import Rank from "../../models/registration-questions/rank.model.js";
import Service from "../../models/registration-questions/services.model.js";
import { createRankSchema, serviceValidationSchema } from "../../validators/registration-questions-validations.js";


const addNewService = async (req, res) => {
    const { error } = serviceValidationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
  
    const { service_name } = req.body;
  
    try {
      // Check if the service already exists
      const existingService = await Service.findOne({ service_name });
  
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Service with this name already exists.',
        });
      }
  
      // Create a new service
      const service = new Service({ service_name });
      await service.save();
  
      return res.status(201).json({
        success: true,
        message: 'Service created successfully!',
        data: service,
      });
    } catch (error) {
      console.error('Error creating service:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
}

const getAllServices = async (req, res) => {
    try {
        // Fetch all services from the database
        const services = await Service.find().select('service_name');
   
        return res.status(200).json({
          success: true,
          data: services,
        });
      } catch (error) {
        console.error('Error fetching services:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal Server Error',
        });
      }
}

const addNewRank = async (req, res) => {
    try {
        // Validate request body
        const { error } = createRankSchema.validate(req.body);
        if (error) {
          return res.status(400).json({
            success: false,
            message: error.details[0].message,
          });
        }
    
        const { rank_name, serviceId, topics } = req.body;
        const existingService = await Service.findById(serviceId);
  
      if (!existingService) {
        return res.status(400).json({
          success: false,
          message: 'Service not exists.',
        });
      }
    
        // Create a new rank
        const rank = new Rank({
          rank_name,
          serviceId,
          topics,
        });
    
        await rank.save();
    
        return res.status(201).json({
          success: true,
          message: 'Rank created successfully.',
          data: rank,
        });
      } catch (error) {
        console.error('Error creating rank:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal Server Error',
        });
      }
}

const getAllRanks = async (req, res) => {
    try {
        // Fetch all ranks and populate the related service name
        const ranks = await Rank.find().populate('serviceId', 'service_name').select('rank_name serviceId');
    
        return res.status(200).json({
          success: true,
          data: ranks,
        });
      } catch (error) {
        console.error('Error fetching ranks:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal Server Error',
        });
      }
}

export {
    addNewService,
    getAllServices,
    addNewRank,
    getAllRanks
}