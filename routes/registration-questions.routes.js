import express from "express";
import { Router } from "express";

import rateLimit from '../middlewares/rate-limit.js'
import { setProfile } from "../controllers/user/user-controller.js";

import { authMiddlewareUser } from "../middlewares/authMiddlewareUser.js";
import { addNewRank, addNewService, getAllRanks, getAllServices } from "../controllers/registration-question/services.controller.js";
import { addNewSport, addNewSportPosition, getAllSports, getAllSportsPosition, updateSportTopics } from "../controllers/registration-question/sports.controller.js";
import { addNewHobby, getAllHobbies } from "../controllers/registration-question/hobbies.controller.js";
import { addNewSubject, getAllSubjects } from "../controllers/registration-question/subjects.controller.js";
import { getAllQuestionOptions } from "../controllers/registration-question/registration-questions-controller.js";

const router = Router();


router.post('/add-new-service',authMiddlewareUser, addNewService);
router.get('/get-services',authMiddlewareUser, getAllServices);
router.post('/add-new-rank',authMiddlewareUser, addNewRank);
router.get('/get-ranks',authMiddlewareUser, getAllRanks);
router.post('/add-new-sport',authMiddlewareUser, addNewSport);
router.put('/update-sport-topics',authMiddlewareUser, updateSportTopics);
router.get('/get-sports',authMiddlewareUser, getAllSports);
router.post('/add-new-sport-position',authMiddlewareUser, addNewSportPosition);
router.get('/get-sport-positions',authMiddlewareUser, getAllSportsPosition);

// Hobbies
router.post('/add-new-hobby',authMiddlewareUser, addNewHobby);
router.get('/get-hobbies',authMiddlewareUser, getAllHobbies);

// Subjects
router.post('/add-new-subject',authMiddlewareUser, addNewSubject);
router.get('/get-subjects',authMiddlewareUser, getAllSubjects);

// onboarding registration question

router.get('/get-all-questions',authMiddlewareUser, getAllQuestionOptions);



export { router };