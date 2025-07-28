import stripe from "../../../configs/stripe.js";


const verifyPromotionCode = async (code) => {
    try {
      const promoCodes = await stripe.promotionCodes.list({
        code,
        active: true,
        limit: 1,
      });
  
      if (promoCodes.data.length === 0) {
        return null; // Not found or inactive
      }
  
      return promoCodes.data[0]; // Return valid promotion code details
    } catch (error) {
      throw new Error(error.message);
    }
  };
  
  export { verifyPromotionCode };