import stripe from "../../../configs/stripe.js";


const createCoupon = async (name, percentOff) => {
  
    const coupon = await stripe.coupons.create({
      name,
      percent_off: percentOff,
      duration: "once",
    });
  
    return coupon;
  };

export {createCoupon}  