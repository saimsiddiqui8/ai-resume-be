import express from "express";
import { Router } from "express";
import { createMulter } from "../utils/Multer/createMulter.js";
import { authMiddlewareUser } from "../middlewares/authMiddlewareUser.js";
import { addSupportPeople, createResume, deleteResume, getMyResumes, updateResume } from "../controllers/resume/resume.controller.js";
import { allSuccessStory, createSuccessStoryProfile, deleteSuccessStory, updateSuccessStory } from "../controllers/success-story/success-story.controller.js";
import { addQuestion, addCareer, addAnswer, getAllAnswer, updateCareer, addIDPQuestion } from "../controllers/career-recommendations/career-recommendations-data.controller.js";
import { generateAccessCode, getAllAccessCodes } from "../controllers/access-code/access-code.controller.js";
const upload = createMulter();
const router = Router();


router.post('/create-success-story', authMiddlewareUser, upload.single('profile_img'), createSuccessStoryProfile);
router.put('/update-success-story/:id', authMiddlewareUser, upload.single('profile_img'), updateSuccessStory);
router.delete("/success-stories/:id", authMiddlewareUser, deleteSuccessStory);
router.get('/get-success-stories',authMiddlewareUser, allSuccessStory);
router.post('/add-question', authMiddlewareUser, addQuestion);
router.post('/add-career', authMiddlewareUser, addCareer);
router.put('/update-career', authMiddlewareUser, updateCareer);
router.post('/add-answer', authMiddlewareUser, addAnswer);
router.get('/get-answers', authMiddlewareUser, getAllAnswer);
router.post('/generate-access-code', authMiddlewareUser, generateAccessCode);
router.get('/access-codes', authMiddlewareUser, getAllAccessCodes);
router.post('/add-idp-question', authMiddlewareUser, addIDPQuestion);






export { router };