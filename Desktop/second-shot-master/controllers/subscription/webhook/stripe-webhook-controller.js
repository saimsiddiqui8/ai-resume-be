import stripe from "../../../configs/stripe.js";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();

const SubscriptionWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers["stripe-signature"]; // Signature sent by Stripe to verify the request

  let event;
  

  try {
    // Verify and construct the event using the Stripe SDK
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  console.log("event=== webhook", event.type);
  

  // Handle the event based on its type
  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      console.log("delete===");
      
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Acknowledge receipt of the event
  res.json({ received: true });
};

// Handler for subscription creation
const handleSubscriptionCreated = async (subscription) => {
  try {
    console.log("Subscription created:", subscription);
    // Add logic to save the subscription details in your database
    // Example:
    /*
    const subscriptionData = {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      plan: subscription.items.data[0].plan.nickname,
      startDate: new Date(subscription.start_date * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };

    await SubscriptionModel.create(subscriptionData);
    */
  } catch (err) {
    console.error("Error handling subscription creation:", err.message);
  }
};

// Handler for subscription updates
const handleSubscriptionUpdated = async (subscription) => {
  try {
    console.log("Subscription updated:", subscription);
    // Add logic to update the subscription details in your database
  } catch (err) {
    console.error("Error handling subscription update:", err.message);
  }
};

// Handler for subscription deletion
const handleSubscriptionDeleted = async (subscription) => {
  try {
    console.log("Subscription deleted:", subscription);
    // Add logic to delete the subscription details from your database
  } catch (err) {
    console.error("Error handling subscription deletion:", err.message);
  }
};

export {SubscriptionWebhook};
