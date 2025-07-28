import express from "express";
import { Router } from "express";
import { authMiddlewareUser } from "../middlewares/authMiddlewareUser.js";
import { careerRecommendationById, favoriteCareerDetails, myCareerRecommendations, myFavoriteCareers, submitAssessment, toggleFavoriteCareer, toggleFavoriteCareerSingle } from "../controllers/career-recommendations/career-assessment.controller.js";
import { subscriptionMiddlewareUser } from "../middlewares/subscriptionMiddlewareUser.js";
import { addSupportPeople, getMyIDPAward, IDPQuestions, sendIDPForm, submitIDPForm, updateIDPAnswer } from "../controllers/idp-form/idp-form-controller.js";
import { createMulter } from "../utils/Multer/createMulter.js";
const router = Router();
const upload = createMulter("./uploads/pictures/");



router.get('/idp-questions', authMiddlewareUser, subscriptionMiddlewareUser, IDPQuestions);
router.post('/submit-idp-form', authMiddlewareUser,subscriptionMiddlewareUser, submitIDPForm);
router.get('/my-idp-award', authMiddlewareUser, subscriptionMiddlewareUser, getMyIDPAward);
router.post('/update-idp-form', authMiddlewareUser,subscriptionMiddlewareUser, updateIDPAnswer);
router.post('/send-idp-form', authMiddlewareUser, upload.single('idp-awards'), subscriptionMiddlewareUser, sendIDPForm);
router.post('/add-support-people-idp', authMiddlewareUser, upload.single('idp-awards'), subscriptionMiddlewareUser, addSupportPeople);

router.post('/toggle-favorite-career', authMiddlewareUser,subscriptionMiddlewareUser, toggleFavoriteCareer);
router.get('/my-favorite-careers', authMiddlewareUser,subscriptionMiddlewareUser, myFavoriteCareers);
router.post('/favorite-career-details', authMiddlewareUser, subscriptionMiddlewareUser,favoriteCareerDetails);
router.post('/toggle-favorite-single-career', authMiddlewareUser,subscriptionMiddlewareUser, toggleFavoriteCareerSingle);






export { router };