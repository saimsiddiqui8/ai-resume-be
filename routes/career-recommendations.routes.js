import express from "express";
import { Router } from "express";
import { authMiddlewareUser } from "../middlewares/authMiddlewareUser.js";
import { getAllQuestion,  } from "../controllers/career-recommendations/career-recommendations-data.controller.js";
import { careerRecommendationById, favoriteCareerDetails, myCareerRecommendations, myFavoriteCareers, submitAssessment, toggleFavoriteCareer, toggleFavoriteCareerSingle } from "../controllers/career-recommendations/career-assessment.controller.js";
import { subscriptionMiddlewareUser } from "../middlewares/subscriptionMiddlewareUser.js";
const router = Router();


router.get('/get-questions', authMiddlewareUser, subscriptionMiddlewareUser, getAllQuestion);
router.post('/submit-assessment', authMiddlewareUser,subscriptionMiddlewareUser, submitAssessment);
router.get('/my-career-recommendations', authMiddlewareUser, subscriptionMiddlewareUser, myCareerRecommendations);
router.post('/career-recommendation-details', authMiddlewareUser,subscriptionMiddlewareUser, careerRecommendationById);
router.post('/toggle-favorite-career', authMiddlewareUser,subscriptionMiddlewareUser, toggleFavoriteCareer);
router.get('/my-favorite-careers', authMiddlewareUser,subscriptionMiddlewareUser, myFavoriteCareers);
router.post('/favorite-career-details', authMiddlewareUser, subscriptionMiddlewareUser,favoriteCareerDetails);
router.post('/toggle-favorite-single-career', authMiddlewareUser,subscriptionMiddlewareUser, toggleFavoriteCareerSingle);






export { router };