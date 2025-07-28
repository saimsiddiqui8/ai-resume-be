import express from "express";
import { Router } from "express";
import { SubscriptionWebhook } from "../controllers/subscription/webhook/stripe-webhook-controller.js";

const router = Router();


router.post('/subscription-webhook',  express.raw({ type: "application/json" }), SubscriptionWebhook);




export { router };