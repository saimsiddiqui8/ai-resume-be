import mongoose from "mongoose";
import Answer from "../../models/career-recommendations/answer.model.js";
import CareerRecommendation from "../../models/career-recommendations/career-recommendation.model.js";
import Question from "../../models/career-recommendations/question.model.js";
import { assessmentSchema, validateCareerRecommendation, validateCareerRecommendationDetails, validateFavoriteDetails, validateToggleFavorite } from "../../validators/career-recommendations-validations.js";
import Career from "../../models/career-recommendations/career.model.js";
import Notification from "../../models/notifications/notification.model.js";
import sendNotification from "../../utils/notification/send-notification.js";
import { NotificationContent } from "../../models/notifications/notification-content.model.js";
import FavoriteCareer from "../../models/career-recommendations/favorite-career.model.js";



// const submitAssessment = async (req, res) => {
//     try {
//         const { error } = assessmentSchema.validate(req.body);
//         if (error) return res.status(400).json({ success: false, message: error.details[0].message });

//         const { answers } = req.body;
//         const questionIds = answers.map(({ questionId }) => questionId);

//         const existingCount = await Question.countDocuments({ _id: { $in: questionIds } });
//         console.log("existingCount>>", existingCount);
        

//         if (existingCount !== questionIds.length) {
//             return res.status(400).json({ success: false, message: "Some question IDs are invalid or do not exist." });
//         }

//         return res.status(201).json({ success: true, message: "Assessment submitted successfully!", data: { userId: req.user.id, answers } });
//     } catch (error) {
//         console.error("Error submitting assessment:", error);
//         return res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

const submitAssessment = async (req, res) => {
    try {
        const { error } = assessmentSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const { answers } = req.body;
        const questionIds = answers.map(({ questionId }) => questionId);

        // Ensure all question IDs exist
        const existingCount = await Question.countDocuments({ _id: { $in: questionIds } });
        if (existingCount !== questionIds.length) {
            return res.status(400).json({ success: false, message: "Some question IDs are invalid or do not exist." });
        }

        // Fetch career-wise points based on submitted answers
        const careerPointsMap = new Map(); // { careerId: totalPoints }

        for (const { questionId, answer } of answers) {
            
            const matchingAnswers = await Answer.find({
                questionId,
                answer: { $regex: `^${answer}$`, $options: "i" }
            });

            matchingAnswers.forEach(({ careerId, points }) => {
                if (careerPointsMap.has(careerId.toString())) {
                    careerPointsMap.set(careerId.toString(), careerPointsMap.get(careerId.toString()) + points);
                } else {
                    careerPointsMap.set(careerId.toString(), points);
                }
            });
        }

        // Prepare unique data for CareerRecommendation model
        const recommendationData = Array.from(careerPointsMap, ([career, point]) => ({ career, point }));

        // Insert new record in CareerRecommendation
        const newCareerRecommendation = new CareerRecommendation({
            user: req.user.id,
            data: recommendationData,
        });

        await newCareerRecommendation.save();

        // Fetch all device tokens for the user
    const userNotification = await Notification.findOne({ userId: req.user.id });

     // Define notification title & message
     const notificationTitle = "Your Career Recommendations Are Ready!";
     const notificationMessage = `Based on your answers, we’ve found 5 careers for you. Check them out now!`;

    if (userNotification?.notification_enabled) {
        const registrationTokens = userNotification.devices.map(device => device.fcmToken) || [];

        // Format the deadline date

        // Send notification if tokens exist
        if (registrationTokens.length > 0) {
            await sendNotification(registrationTokens, notificationTitle, notificationMessage);
        }
      }

      // ✅ Save notification in the database
      await NotificationContent.create({
        userId: req.user.id,
        title: notificationTitle,
        message: notificationMessage,
        notification_type: "created",
        
      });

        return res.status(201).json({ 
            success: true, 
            message: "Successfully completed the assessment!", 
            data: newCareerRecommendation 
        });

    } catch (error) {
        console.error("Error submitting assessment:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const myCareerRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

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
        const { recommendationId } = req.body;
        const userId = req.user.id;

        // Validate input
        const { error } = validateCareerRecommendationDetails.validate(req.body);
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

const toggleFavoriteCareer = async (req, res) => {
    try {

        const { error } = validateCareerRecommendation.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const userId = req.user.id;
        const { recommendationId, careers } = req.body;

       
        const recommendation = await CareerRecommendation.findById(recommendationId).lean();
        if (!recommendation) {
            return res.status(400).json({ success: false, message: "Recommendation not found" });
        }

        // Check if the recommendation already exists in favorites
        const existingFavorite = await FavoriteCareer.findOne({ user: userId, recommendationId });

        if (existingFavorite) {
            
            await FavoriteCareer.deleteOne({ _id: existingFavorite._id });
            return res.status(200).json({
                success: true,
                message: "Recommendation removed from favorites"
            });
        } else {
            
            const newFavorite = new FavoriteCareer({
                user: userId,
                recommendationId,
                careers
            });

            await newFavorite.save();

            return res.status(200).json({
                success: true,
                message: "Recommendation saved to favorites"
            });
        }
    } catch (error) {
        console.error("Error toggling favorite career:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const myFavoriteCareers = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch all favorite career recommendations for the user
        const favoriteRecommendations = await FavoriteCareer.find({ user: userId })
            .populate({
                path: "careers",
                select: "_id career_name"
            }).select('-user -updatedAt')
            .lean();

        if (!favoriteRecommendations.length) {
            return res.status(200).json({
                success: true,
                message: "No favorite careers found",
                data: []
            });
        }


        return res.status(200).json({
            success: true,
            data: favoriteRecommendations
        });

    } catch (error) {
        console.error("Error fetching favorite careers:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const favoriteCareerDetails = async (req, res) => {
    try {
        const { favoriteId } = req.body;
        const userId = req.user.id;

        // Validate request params
        const { error } = validateFavoriteDetails.validate({ favoriteId });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // Find the favorite career recommendation
        const favoriteCareer = await FavoriteCareer.findOne({ _id: favoriteId, user: userId })
            .populate({
                path: "careers",
                select: "_id career_name description career_growth_opportunities career_pathways education_training sample_job_titles createdAt career_link"
            })
            .select("-user -updatedAt")
            .lean();

        if (!favoriteCareer) {
            return res.status(400).json({
                success: false,
                message: "Favorite career not found"
            });
        }

        // Add is_favorite = true to each career object
        favoriteCareer.careers = favoriteCareer.careers.map(career => ({
            ...career,
            is_favorite: true
        }));

        return res.status(200).json({
            success: true,
            data: favoriteCareer
        });

    } catch (error) {
        console.error("Error fetching favorite career:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const toggleFavoriteCareerSingle = async (req, res) => {
    try {
        const { recommendationId, careerId } = req.body;
        
        const userId = req.user.id;

        // ✅ Validate input
        const { error } = validateToggleFavorite.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // ✅ Check if the favorite entry exists for this recommendationId
        let favorite = await FavoriteCareer.findOne({ user: userId, recommendationId });

        if (!favorite) {
            // ✅ If no favorite exists, create a new entry and add the careerId
            favorite = new FavoriteCareer({
                user: userId,
                recommendationId,
                careers: [careerId]
            });
            await favorite.save();
            return res.status(200).json({
                success: true,
                message: "Career saved to favorites",
            });
        }

        // ✅ If favorite exists, check if careerId is already present
        const careerIndex = favorite.careers.indexOf(careerId);

        if (careerIndex !== -1) {
            // ✅ If careerId exists, remove it
            favorite.careers.splice(careerIndex, 1);
            await favorite.save();

            // ✅ If no careers left, delete the favorite entry
            if (favorite.careers.length === 0) {
                await FavoriteCareer.deleteOne({ _id: favorite._id });
            }

            return res.status(200).json({
                success: true,
                message: "Career removed from favorites",
            });
        } else {
            // ✅ If careerId doesn't exist, add it
            favorite.careers.push(careerId);
            await favorite.save();

            return res.status(200).json({
                success: true,
                message: "Career added to favorites",
            });
        }

    } catch (error) {
        console.error("Error toggling favorite career:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};
    export {submitAssessment, myCareerRecommendations, careerRecommendationById, toggleFavoriteCareer, myFavoriteCareers, favoriteCareerDetails, toggleFavoriteCareerSingle}