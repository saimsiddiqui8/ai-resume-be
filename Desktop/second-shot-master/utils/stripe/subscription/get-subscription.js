import stripe from "../../../configs/stripe.js";

const getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice.payment_intent"],
    });

    return subscription;
  } catch (error) {
    throw new Error(error.message);
  }
};

export {getSubscription};
