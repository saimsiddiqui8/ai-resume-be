import express from "express";
import { Router } from "express";
import rateLimit from '../middlewares/rate-limit.js'
import { deleteAccount, logoutUser, myProfile, setProfile, storeDeviceToken, updateProfile } from "../controllers/user/user-controller.js";
import { createMulter } from "../utils/Multer/createMulter.js";
import { authMiddlewareUser } from "../middlewares/authMiddlewareUser.js";
import { addSupportPeople, getRegistrationQuestions, registrationQuestions } from "../controllers/registration-question/registration-questions-controller.js";
import { allSuccessStory, myMatchProfiles, searchSuccessStory, successStoryById } from "../controllers/success-story/success-story.controller.js";
import { addSupportPeopleGoal, changeGoalStatus, createGoal, deleteGoal, updateSubGoalStatus,  } from "../controllers/goal/goal.controller.js";
import { deleteNotification, markNotificationsAsRead, myNotifications, myNotificationSetting, toggleNotification } from "../controllers/notifications/notification.controller.js";
import { chatWithBot } from "../controllers/chatbot/chatbot.controller.js";
import { subscriptionMiddlewareUser } from "../middlewares/subscriptionMiddlewareUser.js";
import { careerRecommendationById, changePassword, filterAndSearchUsers,  getAdminNotifications, getMonthlySubscriptionSales, getStates, getTransferableSkills, getUsers, goalDetails,  sendNotificationAdmin, userCareerRecommendations, userGoals, userResumes } from "../controllers/admin/admin-controller.js";
const upload = createMulter();
const router = Router();

// profile
router.post('/change-password', authMiddlewareUser, changePassword);
router.get('/users', authMiddlewareUser, getUsers);
router.get('/users/filter-search', authMiddlewareUser, filterAndSearchUsers);

router.get('/states', authMiddlewareUser, getStates);
router.get('/monthly-subscription', authMiddlewareUser, getMonthlySubscriptionSales);

//dashboard
router.get('/user-transferable-skills/:userId', authMiddlewareUser, getTransferableSkills);
router.get('/user-goals/:userId', authMiddlewareUser, userGoals);
router.get('/goal-details/:goalId', authMiddlewareUser, goalDetails);
router.get('/user-career-recommendations/:userId', authMiddlewareUser, userCareerRecommendations);
router.get('/career-recommendation-details/:recommendationId', authMiddlewareUser, careerRecommendationById);
router.get('/user-resumes/:userId', authMiddlewareUser, userResumes);


//Notifications

router.post('/send-notification', authMiddlewareUser, sendNotificationAdmin);
router.get('/notifications', authMiddlewareUser, getAdminNotifications);

router.post('/logout', authMiddlewareUser, logoutUser);
router.delete('/delete-account', authMiddlewareUser, deleteAccount);
router.post('/complete-registration-questions',authMiddlewareUser, registrationQuestions);
router.post('/add-support-people-transferablleSkills', authMiddlewareUser, upload.single('transferablleSkills'), addSupportPeople);
router.get('/get-registration-questions',authMiddlewareUser, getRegistrationQuestions);

// getTransferableSkills

// get success stories
router.get('/get-success-stories',authMiddlewareUser, subscriptionMiddlewareUser, allSuccessStory);
router.post('/success-story-by-id',authMiddlewareUser, subscriptionMiddlewareUser, successStoryById);
router.get('/search-success-story',authMiddlewareUser, subscriptionMiddlewareUser, searchSuccessStory);
router.get('/my-match-profiles',authMiddlewareUser, subscriptionMiddlewareUser, myMatchProfiles);

//Goals

router.post('/create-goal',authMiddlewareUser, subscriptionMiddlewareUser, createGoal);
router.post('/change-goal-status', authMiddlewareUser, subscriptionMiddlewareUser, changeGoalStatus);
router.post('/update-sub-goal-status', authMiddlewareUser,subscriptionMiddlewareUser, updateSubGoalStatus);
router.post('/add-support-people-goal', authMiddlewareUser, subscriptionMiddlewareUser,addSupportPeopleGoal);
router.delete('/delete-goal', authMiddlewareUser,subscriptionMiddlewareUser, deleteGoal);

// Notifications
router.get('/my-notifications',authMiddlewareUser, myNotifications);
router.get('/mark-notifications-read',authMiddlewareUser, markNotificationsAsRead);
router.delete('/delete-notification',authMiddlewareUser, deleteNotification);
router.post('/toggle-notification',authMiddlewareUser, toggleNotification);
router.get('/my-notification-setting',authMiddlewareUser, myNotificationSetting);

// Chatbot
router.post('/chat-with-bot',authMiddlewareUser, chatWithBot);

export { router };  