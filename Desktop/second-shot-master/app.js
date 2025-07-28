import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { dbConnect } from "./database/db-connect.js";
import { router as authRouter } from "./routes/auth.routes.js";
import { router as registrationQuestionsRouter } from "./routes/registration-questions.routes.js"; 
import { router as userRouter } from "./routes/user.routes.js";
import { router as subscriptionRouter } from "./routes/subscription.routes.js"; 
import {router as libraryRouter} from "./routes/my-library.routes.js"
import {router as resumeRouter} from "./routes/my-resume.routes.js"
import {router as successStoryRouter} from "./routes/success-story.routes.js"
import {router as subscriptionWebhookRouter} from "./routes/subscription-webhook.routes.js"
import {router as careerRecommendations} from "./routes/career-recommendations.routes.js"
import {router as IDPFormRouter} from "./routes/idp-form.routes.js"
import {router as adminAuthRouter} from "./routes/admin-auth.routes.js"
import {router as adminRouter} from "./routes/admin.routes.js"
import {} from './workers/crons/cron.js'
// import {router as webhookRouter} from './utils/Stripe/Webhooks/stripe-webhooks.js'
// import { router as userPurchase } from "./Google-In-App-Purchase/routes/user-purchase.routes.js"; 
// import { router as userChats } from "./Chats/routes/user-chat.routes.js"; 
import cors from 'cors';
import multer from "multer";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import timeout from 'connect-timeout'
import bodyParser from "body-parser";


dotenv.config();

const app = express();
// app.use(webhookRouter);
const PORT = process.env.PORT || 5000;
const api = process.env.API_URL;
// Middleware to set a timeout for all requests
app.use(timeout('5m')); // 5 minutes timeout

app.use((req, res, next) => {
    if (!req.timedout) next();
});

app.use((req, res, next) => {
  if (req.timedout) {
      res.status(503).json({
          success: false,
          message: 'Request timed out.',
      });
  } else {
      next();
  }
});
app.use(`${api}/subscription`,subscriptionWebhookRouter);

app.use(express.json({ limit: '15mb' }));
const corsOptions = {
  origin: '*', // Replace with your allowed origin
  optionsSuccessStatus: 200, // Default is 204
};
// Multer setup for in-memory storage with a size limit of 50 MB per file
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads/pictures');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors(corsOptions))
// route checking
app.use((req, res, next) => {
  console.log(req.method, req.url);
  const userAgent = req.get('User-Agent') || '';
  let source = 'Unknown';
  
  if (/mobile/i.test(userAgent)) {
    source = 'Mobile App';
  } else if (/Mozilla|Chrome|Safari|Firefox/i.test(userAgent)) {
    source = 'Web Browser';
  }
  console.log(`Source: ${source}`);
  next();
});
app.use(`${api}/auth`, authRouter);
app.use(`${api}/auth/admin`, adminAuthRouter);
// // app.use(`${api}/auth/admin`, adminAuthRouter);
app.use(`${api}/user`, userRouter);
app.use(`${api}/services`, registrationQuestionsRouter);
app.use(`${api}/subscription`,subscriptionRouter);
app.use(`${api}/user`, libraryRouter);
app.use(`${api}/user`, resumeRouter);
app.use(`${api}/user`, IDPFormRouter);
app.use(`${api}/user`, careerRecommendations);
app.use(`${api}/admin`,successStoryRouter);
app.use(`${api}/admin`,adminRouter);
// app.use(`${api}/`, userChats);


app.get("/test", (req, res) => {
  res.send("This is a test route!");
});

mongoose.set("strictQuery", false);

app.listen(PORT, async() => {
  console.log(`Server is running on PORT:${PORT}`);
  await dbConnect();
});
