import stripe from "../../../configs/stripe.js";

const getPromotionCodeId = async (code) => {
  const promoCodes = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
  });

  if (promoCodes.data.length === 0) {
    throw new Error("Invalid or expired promo code.");
  }

  return promoCodes.data[0].id;
};

const createSubscription = async (priceId, stripeCustomerId, promoCode = null) => {
  try {

    let promotionCodeId = null;

    if (promoCode) {
      promotionCodeId = await getPromotionCodeId(promoCode);
    }

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: priceId,
        },
      ],
      ...(promotionCodeId && { promotion_code: promotionCodeId }),
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    return subscription;
  } catch (error) {
    throw new Error(error.message);
  }
};

export {createSubscription}
