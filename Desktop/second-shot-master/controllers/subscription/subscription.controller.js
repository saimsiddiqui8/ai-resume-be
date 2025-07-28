import Coupon from "../../models/stripe-coupon/coupon.model.js";
import PromoCode from "../../models/stripe-Promo-Code/promo.model.js";
import SubscriptionProduct from "../../models/subscription/product/subscription-product-model.js";
import SubscriptionPurchase from "../../models/subscription/subscription-purchase.js";
import SubscriptionRecord from "../../models/subscription/subscription-record.model.js";
import User from "../../models/user-model/user.model.js";
import { createPriceId } from "../../utils/stripe/product/create-price-id.js";
import { createStripeProduct } from "../../utils/stripe/product/create-stripe-product.js";
import { verifyPromotionCode } from "../../utils/stripe/promo-code/check-promotion-code.js";
import { createCoupon } from "../../utils/stripe/promo-code/create-coupon.js";
import { createPromotionCode } from "../../utils/stripe/promo-code/create-promotion-code.js";
import { cancelSubscriptionStripe } from "../../utils/stripe/subscription/cancel-subscription.js";
import { createSubscription } from "../../utils/stripe/subscription/create-subscription.js";
import { getSubscription } from "../../utils/stripe/subscription/get-subscription.js";
import { couponSchema, createSubscriptionSchema, promotionCodeSchema, subscriptionProductSchema, verifyPromotionCodeSchema, verifySubscriptionSchema } from "../../validators/subscription-validations.js";


const createSubscriptionProduct = async (req, res) => {
    try {
        // Validate request body
        const { error } = subscriptionProductSchema.validate(req.body);
        if (error) {
          return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const {product_name, price, subscription_duration, description} = req.body
        // Create new subscription product
        const newSubscriptionProduct = new SubscriptionProduct({
          product_name,
          price,
          subscription_duration,
          description
        });
    
        // Save subscription product to database
        const savedSubscriptionProduct = await newSubscriptionProduct.save();
        // create stipe product
        const stripeProductId = await createStripeProduct(product_name, savedSubscriptionProduct._id.toString());
        const stripePriceId = await createPriceId(savedSubscriptionProduct._id.toString(), price); 
       
        await SubscriptionProduct.findOneAndUpdate(
            { _id: savedSubscriptionProduct._id },
            {
              stripe_product_id: stripeProductId.id.toString(),
              stripe_price_id: stripePriceId.id.toString(),
            },
            { new: true }
          );

        return res.status(201).json({
          success: true,
          data: savedSubscriptionProduct,
          message: 'subscription product created successfully',
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
  };

const getSubscriptionProduct = async (req, res) => {
  try {
    const SubscriptionProducts = await SubscriptionProduct.find().select('-stripe_price_id -product_type -createdAt -updatedAt -stripe_product_id').sort({ _id: -1 });

    return res.status(200).json({
      success: true,
      data: SubscriptionProducts,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const createSubscriptionIntent = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createSubscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const userId = req.user.id;
    const { product_id, promoCode } = value;

    const product = await SubscriptionProduct.findById(product_id);

    if (!product) {
      return res.status(400).json({ success: false, message: "No Subscription found!" });
    }
    
    // Check if a subscription record already exists for this user
    // const existingSubscription = await SubscriptionRecord.findOne({ userId });

    // if (existingSubscription) {
    //   return res.status(200).json({
    //     success: true,
    //     message: "Subscription created successfully.",
    //     stripeSubscriptionId: existingSubscription.stripeSubscriptionId,
    //     clientSecret: existingSubscription.clientSecret,
    //     paymentIntentId: existingSubscription.paymentIntentId,
    //   });
    // }

    // Create the subscription
    const stripeSubRecord = await createSubscription(
      product.stripe_price_id,
      req.user.stripe_customer_id,
      promoCode
    );

    const amountToPay = stripeSubRecord.latest_invoice.payment_intent;
    const amountToPayInCents = amountToPay.amount;
    const amountToPayInDollars = (amountToPayInCents / 100).toFixed(2);

    const newSubscription = new SubscriptionRecord({
      userId,
      stripeSubscriptionId: stripeSubRecord.id,
      paymentIntentId: stripeSubRecord.latest_invoice.payment_intent.id,
      clientSecret: stripeSubRecord.latest_invoice.payment_intent.client_secret,

    });

    await newSubscription.save();
    res.status(200).json({
      success: true,
      message: "Subscription created successfully.",
      stripeSubscriptionId: stripeSubRecord.id,
      clientSecret: stripeSubRecord.latest_invoice.payment_intent.client_secret,
      paymentIntentId: stripeSubRecord.latest_invoice.payment_intent.id,
      amountToPay: amountToPayInDollars
    });
  } catch (error) {
    console.error("Error creating subscription:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const verifySubscription = async (req, res) => {
  try {
   
    const { error, value } = verifySubscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const userId = req.user.id;
    const { stripeSubscriptionId, paymentIntentId, product_id } = value;


    const product = await SubscriptionProduct.findById(product_id);

    if (!product) {
      return res.status(400).json({ success: false, message: "No Subscription found!" });
    }
    console.log("product======", product);
    
    // Retrieve the subscription from Stripe
    const subscription = await getSubscription(stripeSubscriptionId);    
        
    // Check the subscription status
    if (subscription.status === "active" || subscription.status === "trialing") {
      // Find and update or create subscription record
    const updatedSubscription = await SubscriptionPurchase.findOneAndUpdate(
      { userId },
      {
      userId,
      paymentIntent_id: paymentIntentId,
      subscription_id: stripeSubscriptionId,
      subscription_price: product.price,
      subscription_plan: product.product_name,
      platform: "stripe",
      status: subscription.status,
      renewed: subscription.current_period_start ? 1 : 0, },
      { new: true, upsert: true }
    );
    await User.findByIdAndUpdate(userId, {is_subscription_paid : true, current_subscription_plan: product.product_name})
      return res.status(200).json({
        success: true,
        message: "Subscription is verified and active.",
      });
    } else {
      return res.status(200).json({
        success: false,
        message: `Subscription is not active. Current status: ${subscription.status}`,
      });
    }
  } catch (error) {
    console.error("Error verifying subscription:", error.message);
    return res.status(500).json({ success: false, message: "Error verifying subscription", error: error.message });
  }
}

const getMySubscriptionPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("userId=====", userId);
    
    const subscription = await SubscriptionPurchase.findOne({ userId });
    

    if (!subscription) {
      return res.status(400).json({ success: false, message: "No subscription found for this user." });
    }

    // Find the product using the subscription_plan
    const subscriptionProduct = await SubscriptionProduct.findOne({ product_name : subscription.subscription_plan });

    if (!subscriptionProduct) {
      return res.status(400).json({ success: false, message: "No matching product found for this subscription plan." });
    }
    
    // Return the subscription details
    return res.status(200).json({
      success: true,
      message: "Subscription retrieved successfully.",
      data: {
        subscriptionProduct,
        subscription_plan: subscription.subscription_plan,
        subscription_id: subscription.subscription_id,
        status: subscription.status,
        platform: subscription.platform
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching subscription details.",
      error: error.message,
    });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user's subscription
    const subscription = await SubscriptionPurchase.findOne({ userId });

    if (!subscription) {
      return res.status(400).json({ success: false, message: "No active subscription found." });
    }

    if (!subscription.subscription_id) {
      return res.status(400).json({ success: false, message: "No Stripe subscription ID found." });
    }

    // Call the cancel function
    const isCanceled = await cancelSubscriptionStripe(subscription.subscription_id);
    console.log("isCanceled=========", isCanceled);
    
    if (!isCanceled.success) {
      return res.status(400).json({ success: false, message: "Failed to cancel the subscription." });
    }

    // Update the subscription status in the database
    subscription.status = 'cancelled';
    await subscription.save();
    await User.findByIdAndUpdate(userId, {is_subscription_paid : false, current_subscription_plan: ""})
    await SubscriptionRecord.findOneAndDelete({userId})

    return res.status(200).json({
      success: true,
      message: "Subscription canceled successfully.",
    });
  } catch (error) {
    console.error("Error canceling subscription:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error canceling subscription.",
      error: error.message,
    });
  }
};

const createSubscriptionCoupon = async (req, res) => {
  try {
    // Validate using Joi
    const { error, value } = couponSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { name, percent_off } = value;

    const coupon = await createCoupon(name, percent_off);

    const savedCoupon = await Coupon.create({
      name,
      percent_off,
      stripe_coupon_id: coupon.id,
      duration: coupon.duration,
      max_redemptions: coupon.max_redemptions,
      metadata: coupon.metadata,
    });

    return res.status(200).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createStripePromotionCode = async (req, res) => {
  try {
    const { error, value } = promotionCodeSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { couponId, code, expirationDate } = value;

    const promotionCode = await createPromotionCode(couponId, code, expirationDate);

    const coupon = await Coupon.findOne({ stripe_coupon_id: req.body.couponId });
    if (!coupon) {
      return res.status(400).json({ success: false, message: "Coupon not found" });
    }

    const newPromo = new PromoCode({
      couponId: coupon._id, 
      code: promotionCode.code,
      expirationDate: expirationDate
    });

    await newPromo.save();

    return res.status(200).json({
      success: true,
      message: "Promotion code created successfully",
      data: promotionCode,
    });
  } catch (err) {
    console.error("Error creating promotion code:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const verifySubscriptionPromotionCode = async (req, res) => {
  try {
    const { error, value } = verifyPromotionCodeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { code } = value;
    const promotionCode = await verifyPromotionCode(code);

    if (!promotionCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired promotion code.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promotion code is valid.",
      data: promotionCode,
    });
  } catch (err) {
    console.error("Error verifying promotion code:", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const getAllPromotionCodes = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [promoCodes, totalCount] = await Promise.all([
      PromoCode.find()
        .populate({
          path: "couponId",
          model: "Coupon",
          select: "name stripe_coupon_id percent_off",
        })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),

      PromoCode.countDocuments(),
    ]);

    

    const formattedData = promoCodes.map((promo) => ({
      _id: promo._id,
      code: promo.code,
      percent_off: promo.couponId.percent_off,
      coupon: promo.couponId ? promo.couponId.name : null,
      createdAt: promo.createdAt,
    }));

    return res.status(200).json({
      success: true,
     data: {
        records: formattedData,
          totalCount,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Error fetching promo codes:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .select("name stripe_coupon_id percent_off duration max_redemptions createdAt")
      .sort({ createdAt: -1 }); // Optional: latest coupons first

    return res.status(200).json({
      success: true,
      message: "All coupons fetched successfully",
      data: coupons,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deletePromotionCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || id.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid promo code ID provided.",
      });
    }

    // Check if promo code exists
    const promo = await PromoCode.findById(id);
    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Promotion code not found.",
      });
    }

    // Delete the promo code
    await PromoCode.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Promotion code deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting promo code:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

  export {createSubscriptionProduct, getSubscriptionProduct, createSubscriptionIntent, verifySubscription, getMySubscriptionPlan, cancelSubscription, createSubscriptionCoupon, createStripePromotionCode, verifySubscriptionPromotionCode, getAllPromotionCodes, getAllCoupons, deletePromotionCode}