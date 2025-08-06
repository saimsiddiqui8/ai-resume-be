import express from "express";
import { Router } from "express";
import { createMulter } from "../utils/Multer/createMulter.js";
import { authMiddlewareUser } from "../middlewares/authMiddlewareUser.js";
import { addSupportPeople, createResume, deleteResume, getMyResumes, resumeDetail, sendToEmail, updateResume } from "../controllers/resume/resume.controller.js";
import { subscriptionMiddlewareUser } from "../middlewares/subscriptionMiddlewareUser.js";
const upload = createMulter();
const router = Router();


router.post('/create-resume', authMiddlewareUser, subscriptionMiddlewareUser, createResume);
router.get('/get-my-resumes', authMiddlewareUser, subscriptionMiddlewareUser, getMyResumes);
router.post('/resume-detail', authMiddlewareUser, subscriptionMiddlewareUser, resumeDetail);
router.put('/update-resume', authMiddlewareUser, subscriptionMiddlewareUser, updateResume);
router.post('/add-support-people', authMiddlewareUser, upload.single('resume'), subscriptionMiddlewareUser, addSupportPeople);
router.post('/send-to-email', authMiddlewareUser, upload.single('resume'), subscriptionMiddlewareUser, sendToEmail);
router.delete('/delete-resume', authMiddlewareUser, subscriptionMiddlewareUser, deleteResume);




export { router };