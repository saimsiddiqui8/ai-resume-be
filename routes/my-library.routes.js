import express from "express";
import { Router } from "express";
import { usersignUp, verifyOTP, verifyOTPPhone } from "../controllers/auth/account/auth.controller.js";
import rateLimit from '../middlewares/rate-limit.js'
import { changePassword, deleteAccount, logoutUser, myProfile, setProfile, storeDeviceToken, updateProfile } from "../controllers/user/user-controller.js";
import { createMulter } from "../utils/Multer/createMulter.js";
import { authMiddlewareUser } from "../middlewares/authMiddlewareUser.js";
import { getRegistrationQuestions, registrationQuestions } from "../controllers/registration-question/registration-questions-controller.js";
import { getTransferableSkills } from "../controllers/transferable-skills/transferable-skills.controller.js";
import { getUserTransferableSkills, toggleTransferableSkill } from "../controllers/my-library/my-library.controller.js";
const upload = createMulter("./uploads/pictures/");
const router = Router();


router.post('/toggle-transferable-skill', authMiddlewareUser, toggleTransferableSkill);
router.get('/get-user-transferable-skills', authMiddlewareUser, getUserTransferableSkills);




export { router };