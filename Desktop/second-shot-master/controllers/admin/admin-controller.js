import mongoose from "mongoose";
import Admin from "../../models/admin-model/admin.model.js";
import CareerRecommendation from "../../models/career-recommendations/career-recommendation.model.js";
import Career from "../../models/career-recommendations/career.model.js";
import FavoriteCareer from "../../models/career-recommendations/favorite-career.model.js";
import Goal from "../../models/Goal/goal.model.js";
import TransferableSkills from "../../models/registration-questions/transferable-skills.model.js";
import SubscriptionPurchase from "../../models/subscription/subscription-purchase.js";
import UserTransferableSkills from "../../models/user-model/transferable-skills/user-transferable-skills.model.js";
import User from "../../models/user-model/user.model.js";
import { careerRecommendationssSchema, notificationSchema, resumeSchema, transferableSkillsSchema, validateCareerRecommendationDetails } from "../../validators/admin-validations.js";
import { goalDetailsSchema } from "../../validators/goal-validation.js";
import { changePasswordSchema } from "../../validators/user-profile-validations.js";
import bcrypt from 'bcryptjs'
import Resume from "../../models/my-resume/resume.model.js";
import { NotificationContent } from "../../models/notifications/notification-content.model.js";
import Notification from "../../models/notifications/notification.model.js";
import sendNotification from "../../utils/notification/send-notification.js";
import moment from "moment";



const getUsers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
  
      const filter = { is_active: true, is_deleted: false };
  
      const users = await User.find(filter).select('name email phone profile_img state city address is_subscription_paid current_subscription_plan createdAt')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Optional: sort by newest
  
      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limit);
  
      return res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: {
          users,
          currentPage: page,
          totalPages,
          totalUsers,
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  const filterAndSearchUsers = async (req, res) => {
    try {
      const { query, from, to, page = 1 } = req.query;
  
      const limit = 10;
      const skip = (parseInt(page) - 1) * limit;
  
      const filter = {
        is_active: true,
        is_deleted: false,
      };
  
      // Apply search by name or email if query is provided
      if (query) {
        filter.$or = [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ];
      }
  
      // Apply date filter if from and to are provided
      if (from && to) {
        const fromDate = moment(from).startOf('day').toDate();
        const toDate = moment(to).endOf('day').toDate();
        filter.createdAt = { $gte: fromDate, $lte: toDate };
      }
  
      const users = await User.find(filter)
        .select('name email phone profile_img state city address is_subscription_paid current_subscription_plan createdAt')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
  
      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limit);
  
      return res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: {
          users,
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
        },
      });
  
    } catch (error) {
      console.error("Error filtering/searching users:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  const getStates = async (req, res) => {
    try {
      const [activeUsersCount, subscriptionCount] = await Promise.all([
        User.countDocuments({ is_active: true, is_deleted: false }),
        SubscriptionPurchase.countDocuments(),
      ]);
  
      return res.status(200).json({
        success: true,
        message: "Counts fetched successfully",
        data: {
          activeUsers: activeUsersCount,
          subscriptions: subscriptionCount,
        },
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  const getMonthlySubscriptionSales = async (req, res) => {
    try {
      const { from, to } = req.query;
  
      let startDate, endDate;
  
      if (from && to) {
        startDate = moment(from).startOf('day').toDate();
        endDate = moment(to).endOf('day').toDate();
      } else {
        // Default: current year
        const currentYear = moment().year();
        startDate = moment(`${currentYear}-01-01`).startOf('day').toDate();
        endDate = moment(`${currentYear}-12-31`).endOf('day').toDate();
      }
  
      // Initialize all months with 0
      const monthlySales = {
        Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
        Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
      };
  
      const salesData = await SubscriptionPurchase.aggregate([
        {
          $match: {
            status: "active",
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $project: {
            month: { $month: "$createdAt" },
            subscription_price: 1
          }
        },
        {
          $group: {
            _id: "$month",
            totalSales: { $sum: "$subscription_price" }
          }
        }
      ]);
  
      // Populate sales in the monthlySales object
      salesData.forEach(entry => {
        const monthIndex = entry._id - 1; // Convert 1–12 to 0–11
        const monthName = moment().month(monthIndex).format("MMM");
        monthlySales[monthName] = parseFloat(entry.totalSales.toFixed(2));
      });
  
      return res.status(200).json({
        success: true,
        data: {monthlySales}
      });
  
    } catch (error) {
      console.error("Error in subscription monthly sales:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  };

  const changePassword = async (req, res) => {
    try {
      // Validate request body
      const { error } = changePasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: error.details[0].message });
      }
  
      const userId = req.user.id;
      const { current_password, new_password } = req.body;
  
      // Find the admin by ID
      const admin = await Admin.findById(userId).select('+password');
      console.log("admin===", admin);
      
  
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(current_password, admin.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      // Check if the new password is the same as the current one
      const isSameAsOld = await bcrypt.compare(new_password, admin.password);
      if (isSameAsOld) {
        return res.status(400).json({
          success: false,
          message: 'New password cannot be the same as the current password. Please try another.',
        });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(new_password, 10);
  
      // Update the admin's password
      admin.password = hashedPassword;
      await admin.save();
  
      res.status(200).json({
        success: true,
        message: 'Password changed successfully!',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  const getTransferableSkills = async (req, res) => {
    
    try {
  
      // const userId = req.user.id;
      const { userId } = req.params;
      if (!userId) {
        
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
  
        // Fetch the main transferable skills data
        const transferableSkills = await TransferableSkills.findOne({ userId })
            .populate('military.branch_of_service', 'service_name')
            .populate('military.rank', 'rank_name topics')
            .populate('athlete.primary_sport', 'sport_name')
            .populate('athlete.sport_position', 'position_name topics')
            .populate('favorite_hobby1', 'hobbie_name topics')
            .populate('favorite_hobby2', 'hobbie_name topics')
            .populate('favorite_middle_school_subject', 'subject_name topics')
            .select('-createdAt -updatedAt -userId')
            .lean();
  
        if (!transferableSkills) {
          return res.status(200).json({
            success: true,
            data: {},
        });
        }
       
        
        // Fetch ALL user's selected favorites from UserTransferableSkills
        const userTransferableSkillsList = await UserTransferableSkills.find({ userId }).lean();
  
        // Aggregate all descriptionIds from all documents
        const favoriteDescriptionIds = {
            militaryRank: new Set(),
            athleteSportPosition: new Set(),
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

  const userGoals = async (req, res) => {
    try {

      const { error } = transferableSkillsSchema.validate(req.params);
      if (error) {
        return res.status(400).json({ success: false, error: error.details[0].message });
      }
      const { userId } = req.params;
      
    
        // Fetch goals for the user
        const goals = await Goal.find({ userId }).select('main_goal_name deadline status createdAt').sort({ createdAt: -1 });;
    
        return res.status(200).json({
          success: true,
          data: goals,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
}

const goalDetails = async (req, res) => {
  try {
    // Validate the request body
    const { error } = goalDetailsSchema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { goalId } = req.params;

    // Find the goal by ID
    const goal = await Goal.findById(goalId).select('-userId -updatedAt');

    if (!goal) {
      return res.status(400).json({
        success: false,
        message: "Goal not found!",
      });
    }

    return res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const userCareerRecommendations = async (req, res) => {
  try {

    const { error } = careerRecommendationssSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const { userId } = req.params;

      // Fetch all career recommendations for the user
      let recommendations = await CareerRecommendation.find({ user: userId }).lean();

      // Convert career IDs from string to ObjectIds
      for (let rec of recommendations) {
          for (let dataItem of rec.data) {
              if (mongoose.Types.ObjectId.isValid(dataItem.career)) {
                  dataItem.career = new mongoose.Types.ObjectId(dataItem.career);
              }
          }
      }

      // Collect all unique career IDs
      const careerIds = recommendations.flatMap(rec => rec.data.map(d => d.career));
      const careers = await Career.find({ _id: { $in: careerIds } }).select("_id career_name");

      // Convert careers array to a Map for quick lookup
      const careerMap = new Map(careers.map(c => [c._id.toString(), { id: c._id, name: c.career_name }]));

      // Fetch favorite recommendations for the user
      const favoriteRecommendations = await FavoriteCareer.find({ user: userId }).select("recommendationId");
      const favoriteSet = new Set(favoriteRecommendations.map(fav => fav.recommendationId.toString()));

      // Process each recommendation separately, keeping only the top 5 for each
      const processedRecommendations = recommendations.map(rec => {
          const sortedCareers = rec.data
              .map(d => ({
                  career: careerMap.get(d.career.toString()) || { id: d.career, name: "Unknown Career" },
                  point: d.point
              }))
              .sort((a, b) => b.point - a.point) // Sort by points (highest first)
              .slice(0, 5); // Keep only top 5

          return {
              recommendationId: rec._id,
              createdAt: rec.createdAt,
              careers: sortedCareers,
              is_favorite: favoriteSet.has(rec._id.toString()), // Check if this recommendation is favorited
          };
      });

      return res.status(200).json({
          success: true,
          data: processedRecommendations
      });

  } catch (error) {
      console.error("Error fetching career recommendations:", error);
      return res.status(500).json({
          success: false,
          message: "Internal Server Error"
      });
  }
};

const careerRecommendationById = async (req, res) => {
  try {
      const { recommendationId } = req.params;
      const userId = req.user.id;

      // Validate input
      const { error } = validateCareerRecommendationDetails.validate(req.params);
      if (error) {
          return res.status(400).json({ success: false, message: error.details[0].message });
      }

      
      let recommendation = await CareerRecommendation.findById(recommendationId).lean();

      if (!recommendation) {
          return res.status(400).json({ success: false, message: "Recommendation not found" });
      }

      // Convert career IDs from string to ObjectIds
      for (let dataItem of recommendation.data) {
          if (mongoose.Types.ObjectId.isValid(dataItem.career)) {
              dataItem.career = new mongoose.Types.ObjectId(dataItem.career);
          }
      }

      // Extract career IDs
      const careerIds = recommendation.data.map(d => d.career);

      // Fetch career details
      const careers = await Career.find({ _id: { $in: careerIds } })
          .select("_id career_name description sample_job_titles career_pathways education_training career_growth_opportunities career_link")
          .lean();

      // Fetch user's favorite careers for this recommendation
      const userFavorites = await FavoriteCareer.findOne({ user: userId, recommendationId }).lean();
      const favoriteCareerIds = userFavorites ? userFavorites.careers.map(c => c.toString()) : [];

      // Convert careers array to a map for quick lookup
      const careerMap = new Map(
          careers.map(c => [
              c._id.toString(),
              {
                  id: c._id,
                  name: c.career_name,
                  description: c.description,
                  sample_job_titles: c.sample_job_titles,
                  career_pathways: c.career_pathways,
                  education_training: c.education_training,
                  career_growth_opportunities: c.career_growth_opportunities,
                  career_link: c.career_link,
              }
          ])
      );

      // Process the recommendation to keep only the top 5 careers
      const topCareers = recommendation.data
          .map(d => ({
              career: careerMap.get(d.career.toString()) || { id: d.career, name: "Unknown Career" },
              point: d.point,
              is_favorite: favoriteCareerIds.includes(d.career.toString()), // Check if career is a favorite
          }))
          .sort((a, b) => b.point - a.point) // Sort by points (highest first)
          .slice(0, 5); // Keep only top 5

      return res.status(200).json({
          success: true,
          data: {
              recommendationId: recommendation._id,
              careers: topCareers,
              createdAt: recommendation.createdAt,
          }
      });

  } catch (error) {
      console.error("Error fetching career recommendation:", error);
      return res.status(500).json({
          success: false,
          message: "Internal Server Error"
      });
  }
};

const userResumes = async (req, res) => {
  try {

    const { error } = resumeSchema.validate(req.params);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }
    const { userId } = req.params;

    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 })
    // .populate('userId', 'name email phone -_id');


    return res.status(200).json({
      success: true,
      data: resumes,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const sendNotificationAdmin = async (req, res) => {
  // Validate request body
  const { error } = notificationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  const { notification_title, notification_message } = req.body;
  const admin_id = req.user.id;
  try {
    const newNotification = new NotificationContent({
      admin_id,
      title: notification_title,
      message: notification_message
    });

    await newNotification.save();
    // send notification in background process
    setImmediate(async() => {
      // Fetch all device tokens
    const notificationRecords = await Notification.find({ notification_enabled: true }, 'devices');
    const registrationTokens = notificationRecords.flatMap(record =>
      record.devices
        .filter(device => device.fcmToken) // ensure token exists
        .map(device => device.fcmToken)
    );
   
     // Send notifications
     if (registrationTokens.length > 0) {
      await sendNotification(registrationTokens, notification_title, notification_message);
    }
    })
    

    res.status(201).json({ success: true, message: 'Notifications send successfully!'});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdminNotifications = async (req, res) => {
  try {
    const admin_id = req.user.id;
    const { from, to } = req.query;

    const filter = { admin_id };

    if (from && to) {
      const start = moment(from).startOf('day').toDate();
      const end = moment(to).endOf('day').toDate();
      filter.createdAt = { $gte: start, $lte: end };
    }

    const notifications = await NotificationContent.find(filter)
      .select('title message createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export {
  getUsers, 
  filterAndSearchUsers,
  getStates, 
  getMonthlySubscriptionSales,
  changePassword,
  getTransferableSkills,
  userGoals,
  goalDetails,
  userCareerRecommendations,
  careerRecommendationById,
  userResumes,
  sendNotificationAdmin,
  getAdminNotifications,
  
}  