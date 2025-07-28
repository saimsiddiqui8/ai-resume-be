import express from "express";
import { Router } from "express";
import rateLimit from '../middlewares/rate-limit.js'
import { changePassword, deleteAccount, logoutUser, myProfile, setProfile, storeDeviceToken, updateProfile, verifyPassword } from "../controllers/user/user-controller.js";
import { createMulter } from "../utils/Multer/createMulter.js";
import { authMiddlewareUser } from "../middlewares/authMiddlewareUser.js";
import { addSupportPeople, getRegistrationQuestions, registrationQuestions } from "../controllers/registration-question/registration-questions-controller.js";
import { getTransferableSkills, sendToEmail } from "../controllers/transferable-skills/transferable-skills.controller.js";
import { allSuccessStory, myMatchProfiles, searchSuccessStory, successStoryById } from "../controllers/success-story/success-story.controller.js";
import { addSupportPeopleGoal, changeGoalStatus, createGoal, deleteGoal, goalDetails, myGoals, updateSubGoalStatus,  } from "../controllers/goal/goal.controller.js";
import { deleteNotification, markNotificationsAsRead, myNotifications, myNotificationSetting, toggleNotification } from "../controllers/notifications/notification.controller.js";
import { chatWithBot } from "../controllers/chatbot/chatbot.controller.js";
import { subscriptionMiddlewareUser } from "../middlewares/subscriptionMiddlewareUser.js";
const upload = createMulter("./uploads/pictures/");
const router = Router();


router.post('/store-device-token', authMiddlewareUser, storeDeviceToken);
router.post('/set-profile', authMiddlewareUser, upload.single('profile_img'), setProfile);
router.get('/my-profile', authMiddlewareUser, myProfile);
router.put('/update-profile', authMiddlewareUser, upload.single('profile_img'), updateProfile);
router.post('/change-password', authMiddlewareUser, changePassword);
router.post('/verify-password', authMiddlewareUser, verifyPassword);
router.post('/logout', authMiddlewareUser, logoutUser);
router.delete('/delete-account', authMiddlewareUser, deleteAccount);
router.post('/complete-registration-questions',authMiddlewareUser, registrationQuestions);
router.post('/add-support-people-transferablleSkills', authMiddlewareUser, upload.single('transferablleSkills'), addSupportPeople);
router.get('/get-registration-questions',authMiddlewareUser, getRegistrationQuestions);

// getTransferableSkills
router.get('/my-transferable-skills',authMiddlewareUser, getTransferableSkills);
router.post('/send-skills', authMiddlewareUser, upload.single('transferablleSkills'), sendToEmail);


// get success stories
router.get('/get-success-stories',authMiddlewareUser, subscriptionMiddlewareUser, allSuccessStory);
router.post('/success-story-by-id',authMiddlewareUser, subscriptionMiddlewareUser, successStoryById);
router.get('/search-success-story',authMiddlewareUser, subscriptionMiddlewareUser, searchSuccessStory);
router.get('/my-match-profiles',authMiddlewareUser, subscriptionMiddlewareUser, myMatchProfiles);

//Goals

router.post('/create-goal',authMiddlewareUser, subscriptionMiddlewareUser, createGoal);
router.get('/my-goals', authMiddlewareUser,subscriptionMiddlewareUser, myGoals);
router.post('/goal-details', authMiddlewareUser,subscriptionMiddlewareUser, goalDetails);
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