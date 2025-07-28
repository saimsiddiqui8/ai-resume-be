import express from "express";
import { Router } from "express";
import { usersignUp, verifyOTP, verifyOTPPhone } from "../controllers/auth/account/auth.controller.js";
import rateLimit from '../middlewares/rate-limit.js'
import { myProfile, setProfile, updateProfile } from "../controllers/user/user-controller.js";
import { createMulter } from "../utils/Multer/createMulter.js";
import { authMiddlewareUser } from "../middlewares/authMiddlewareUser.js";
import { getRegistrationQuestions, registrationQuestions } from "../controllers/registration-question/registration-questions-controller.js";
import { getTransferableSkills } from "../controllers/transferable-skills/transferable-skills.controller.js";
import { cancelSubscription, createStripePromotionCode, createSubscriptionCoupon, createSubscriptionIntent, createSubscriptionProduct, deletePromotionCode, getAllCoupons, getAllPromotionCodes, getMySubscriptionPlan, getSubscriptionProduct, verifySubscription, verifySubscriptionPromotionCode } from "../controllers/subscription/subscription.controller.js";
import { SubscriptionWebhook } from "../controllers/subscription/webhook/stripe-webhook-controller.js";
import { verifyAccessCode } from "../controllers/access-code/access-code.controller.js";
import { subscriptionNotification, subscriptionNotificationIOS, verifyUserPayment, verifyUserPaymentIOS } from "../controllers/in-app-purchases/subscription-purchase.controller.js";
const upload = createMulter("./uploads/pictures/");
const router = Router();


router.post('/create-subscription-product', authMiddlewareUser, createSubscriptionProduct);
router.get('/subscription-products', authMiddlewareUser, getSubscriptionProduct);
router.post('/create-subscription-intent', authMiddlewareUser, createSubscriptionIntent);
router.post('/verify-subscription', authMiddlewareUser, verifySubscription);
router.get('/my-subscription-plan', authMiddlewareUser, getMySubscriptionPlan);
router.delete('/cancel-subscription', authMiddlewareUser, cancelSubscription);
router.post('/create-subscription-coupon', authMiddlewareUser, createSubscriptionCoupon);
router.get('/get-coupons', authMiddlewareUser, getAllCoupons);
router.post('/create-promotion-code', authMiddlewareUser, createStripePromotionCode);
router.post('/verify-promotion-code', authMiddlewareUser, verifySubscriptionPromotionCode);
router.get('/promo-codes', authMiddlewareUser, getAllPromotionCodes);
router.delete('/promo-code/:id', authMiddlewareUser, deletePromotionCode);

// for access code users
router.post('/verify-access-code', authMiddlewareUser, verifyAccessCode);
// router.post('/subscription-webhook',  SubscriptionWebhook);


router.post('/subscription-notification', subscriptionNotification);
router.post('/subscription-notification-ios', subscriptionNotificationIOS);

// in app
router.post('/verify-subscription-android', authMiddlewareUser, verifyUserPayment);
router.post('/verify-subscription-ios', authMiddlewareUser, verifyUserPaymentIOS);


export { router };