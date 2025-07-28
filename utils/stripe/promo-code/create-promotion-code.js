import stripe from "../../../configs/stripe.js";

const createPromotionCode = async (couponId, code, expirationDate) => {
    try {
      const promotionCode = await stripe.promotionCodes.create({
        coupon: couponId,
        code, // The actual code users will enter (e.g., "SUMMER2025")
        expires_at: Math.floor(new Date(expirationDate).getTime() / 1000), // Convert to Unix timestamp
        // max_redemptions: 1, // optional: limit usage to once
      });
  
      return promotionCode;
    } catch (error) {
      throw new Error(error.message);
    }
  };
  
  export {createPromotionCode};