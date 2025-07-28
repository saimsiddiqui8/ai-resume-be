import stripe from "../../../configs/stripe.js";

const cancelSubscriptionStripe = async (stripeSubscriptionId) => {
  try {
    // Cancel the subscription through Stripe API
    const subscription = await stripe.subscriptions.cancel(stripeSubscriptionId);
    console.log("subscription====", subscription);
    
    // Return success response with subscription details
    return {
      success: true,
      message: "Subscription canceled successfully",
      subscription
    };

  } catch (error) {
    // Handle specific Stripe API errors
    const errorDetails = {
      message: error.message,
      statusCode: error.statusCode || 500,
      type: error.type || 'StripeAPIError'
    };

    console.error("Stripe subscription cancellation failed:", errorDetails);
    
    // Return structured error response
    return {
      success: false,
      message: "Failed to cancel subscription",
      error: errorDetails
    };
  }
};

export { cancelSubscriptionStripe };