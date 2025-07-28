import Notification from "../../models/notifications/notification.model.js";
import SubscriptionProduct from "../../models/subscription/product/subscription-product-model.js";
import SubscriptionPurchase from "../../models/subscription/subscription-purchase.js";
import User from "../../models/user-model/user.model.js";
import sendNotification from "../../utils/notification/send-notification.js";
import { subscriptionVerifySchema } from "../../validators/subscription-validations.js";
import jwt from "jsonwebtoken";


const verifyUserPayment = async (req, res) => {
  try {
    const { error, value } = subscriptionVerifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const userId = req.user.id;
    const { purchase_token, subscription , product_id} = value;

    const paymentVerificationResult = {
      success: true
    }
    // Verify the Android subscription
    // const paymentVerificationResult = await verifyAndroidSubscription(
    //   purchase_token,
    //   product_id
    // );

    if (paymentVerificationResult.success) {
      // Find the subscription plan using subscription
      const subscription_plan = await SubscriptionProduct.findOne({ product_name: subscription });

      if (!subscription_plan) {
        return res.status(400).json({
          success: false,
          message: "Subscription plan not found",
        });
      }

      // Use findOneAndUpdate to update existing subscription or create a new one
      const subscriptionPurchase = await SubscriptionPurchase.findOneAndUpdate(
        {
          userId,
        },
        {
          $set: {
            subscription_id: "",
            purchase_token: purchase_token,
            subscription_price: subscription_plan.price,
            subscription_plan: subscription_plan.product_name,
            platform: "in-app",
            status: "active",
          },
          $inc: { renewed: 1 },  // Increment renewal count if the record exists
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create a new document if none exists
          setDefaultsOnInsert: true, // Apply default values when creating
        }
      );
      const userSubscriptionStatus = await User.findByIdAndUpdate(userId, {is_subscription_paid: true, current_subscription_plan: subscription_plan.product_name})
      return res.status(200).json({
        success: true,
        message: "Subscription verified successfully!",
        subscription: subscriptionPurchase,
      });
    } else {
      // Payment verification failed
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const verifyUserPaymentIOS = async (req, res) => {
  try {
    const { error, value } = subscriptionVerifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const userId = req.user.id;
    const { purchase_token, subscription , product_id} = value;

    const paymentVerificationResult = {
      success: true
    }

    if (paymentVerificationResult.success) {
      // Find the subscription plan using subscription
      const subscription_plan = await SubscriptionProduct.findOne({ product_name: subscription });

      if (!subscription_plan) {
        return res.status(400).json({
          success: false,
          message: "Subscription plan not found",
        });
      }

      // Use findOneAndUpdate to update existing subscription or create a new one
      const subscriptionPurchase = await SubscriptionPurchase.findOneAndUpdate(
        {
          userId,
        },
        {
          $set: {
            subscription_id: "",
            purchase_token: purchase_token,
            subscription_price: subscription_plan.price,
            subscription_plan: subscription_plan.product_name,
            platform: "ios",
            status: "active",
          },
          $inc: { renewed: 1 },  // Increment renewal count if the record exists
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create a new document if none exists
          setDefaultsOnInsert: true, // Apply default values when creating
        }
      );
      const userSubscriptionStatus = await User.findByIdAndUpdate(userId, {is_subscription_paid: true, current_subscription_plan: subscription_plan.product_name})
      return res.status(200).json({
        success: true,
        message: "Subscription verified successfully!",
        subscription: subscriptionPurchase,
      });
    } else {
      // Payment verification failed
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const subscriptionNotification = async (req, res) => {
    const message = req.body.message;
    let status;
    
    if (message && message.data) {
      // Decode the base64 encoded message
      const bufferString = Buffer.from(message.data, "base64");
      // console.log("bufferString==========", bufferString);
      
      const decodedMessage = JSON.parse(bufferString.toString("utf-8"));  
      if (decodedMessage?.subscriptionNotification) {
        const temp = decodedMessage.subscriptionNotification;
        
        if (temp.notificationType == 2) {
          // Subscription renewed
          status = "active";

          const subscriptionPurchase = await SubscriptionPurchase.findOneAndUpdate(
            {
              purchase_token: temp.purchaseToken
            },
            {
              $set: {
                status: "active",
              },
              $inc: { renewed: 1 },  // Increment renewal count if the record exists
            },
            {
              new: true, // Return the updated document
            }
          );

          if (!subscriptionPurchase) {
            return  res.status(400).send();
          }

  
        //   const user = await SubscriptionPurchase.findOne({purchase_token: temp.purchaseToken});
        //   if (!user) {
        //     return  res.status(400).send();
        //   }
        //   const user_id = user.listerId;
        //   console.log("user ==", user_id);
        //  let usercheck =  await User.findByIdAndUpdate(user_id, { $inc: { subscription_count: 1 } }, { new: true });
        //  console.log("reniew increment========", usercheck);
      } 
      else if (temp.notificationType == 3) {
        //cancelled
        status = "cancelled";
        let userPurchase = await SubscriptionPurchase.findOneAndUpdate({ purchase_token: temp.purchaseToken }, {status: status }, { new: true })
        console.log("cancelled >>>>===", userPurchase);
        if (userPurchase) {
          const userId = userPurchase.userId;
          // change is_subscription_paid status to again false
          const subscriptionStatus = await User.findByIdAndUpdate(userId, {is_subscription_paid: false, current_subscription_plan: "" });
          
          // Notification on cancel

          // Fetch all device tokens for the user
          const userNotification = await Notification.findOne({ userId });

          // Check if notifications are enabled
          if (userNotification?.notification_enabled) {
            const registrationTokens = userNotification.devices.map(device => device.fcmToken) || [];

            // Format the deadline date

            // Send notification if tokens exist
            if (registrationTokens.length > 0) {
              await sendNotification(
                registrationTokens, 
                "Subscription cancelled!", 
                `Your Subscription has been cancelled!`
              );
            }
          }
          }
    }
      else if (temp.notificationType == 13) {
        // Subscription expired
        status = "expired";
        let userPurchase = await SubscriptionPurchase.findOneAndUpdate({ purchase_token: temp.purchaseToken }, {status: status }, { new: true })
        console.log("cancelled >>>>===", userPurchase);
        if (userPurchase) {
          const userId = userPurchase.userId;
          // change is_subscription_paid status to again false
          const subscriptionStatus = await User.findByIdAndUpdate(userId, {is_subscription_paid: false, current_subscription_plan: ""});
        }
        
    }
      }
      // Process the message
      console.log("Received message:", decodedMessage);
  
      // Acknowledge the message
      res.status(204).send();
    } else {
      // Handle the case where the message format is incorrect
      res.status(400).send("Invalid Pub/Sub message format");
    }
  };

  const subscriptionNotificationIOS = async (req, res) => {
    const { body } = req;
    const decodedPayload = jwt.decode(body.signedPayload, { complete: true });
    let status = "";
    const temp = decodedPayload.payload.data;
    // const signedTransactionInfo = jwt.decode(
    //   decodedPayload.payload.data.signedTransactionInfo,
    //   { complete: true }
    // );
    const signedTransactionInfo = jwt.decode(decodedPayload.payload.data.signedTransactionInfo, { complete: true })
    const signedRenewalInfo = jwt.decode(decodedPayload.payload.data.signedRenewalInfo, { complete: true })
    console.log(
      signedTransactionInfo.payload,
      "signedTransactionInfo PAYLOAD++++++++++++++++++++++++++++++++++++++++"
    );

    console.log("decodedPayload?.payload============>>", decodedPayload?.payload);
    console.log("decodedPayload?.payload?.notificationType==========", decodedPayload?.payload?.notificationType);
    
    
  
    
      if (decodedPayload?.payload?.notificationType === 'DID_RENEW') {
        
        console.log("signedTransactionInfo?.payload?.originalTransactionId =====Purchased========", signedTransactionInfo?.payload?.originalTransactionId);
        
        // Subscription renewed
        status = "active";

        const subscriptionPurchase = await SubscriptionPurchase.findOneAndUpdate(
          {
            purchase_token: signedTransactionInfo?.payload?.originalTransactionId
          },
          {
            $set: {
              status: "active",
            },
            $inc: { renewed: 1 },  // Increment renewal count if the record exists
          },
          {
            new: true, // Return the updated document
          }
        );

        if (!subscriptionPurchase) {
          return  res.status(400).send();
        }

      } else if (decodedPayload?.payload?.notificationType === 'CANCELLED') {
        //cancelled
        status = "cancelled";

        let userPurchase = await SubscriptionPurchase.findOneAndUpdate({ purchase_token: signedTransactionInfo?.payload?.originalTransactionId }, {status: status }, { new: true })
        console.log("cancelled >>>>===", userPurchase);
        if (userPurchase) {
          const userId = userPurchase.userId;
          // change is_subscription_paid status to again false
          const subscriptionStatus = await User.findByIdAndUpdate(userId, {is_subscription_paid: false, current_subscription_plan: "" });
         
        }

      }
      else if (decodedPayload?.payload?.notificationType === 'DID_CHANGE_RENEWAL_STATUS' && decodedPayload?.payload.subtype == 'AUTO_RENEW_DISABLED') {
      console.log("decodedPayload?.payload.subtype============>>", decodedPayload?.payload.subtype);

        //cancelled
        status = "cancelled";
        console.log("signedTransactionInfo?.payload?.originalTransactionId=========", signedTransactionInfo?.payload?.originalTransactionId);
        
        let userPurchase = await SubscriptionPurchase.findOneAndUpdate({ purchase_token: signedTransactionInfo?.payload?.originalTransactionId }, {status: status }, { new: true })
        console.log("cancelled >>>>===", userPurchase);
        if (userPurchase) {
          const userId = userPurchase.userId;
          // change is_subscription_paid status to again false
          const subscriptionStatus = await User.findByIdAndUpdate(userId, {is_subscription_paid: false, current_subscription_plan: "" });
        // Notification on cancel

          // Fetch all device tokens for the user
          const userNotification = await Notification.findOne({ userId });

          // Check if notifications are enabled
          if (userNotification?.notification_enabled) {
            const registrationTokens = userNotification.devices.map(device => device.fcmToken) || [];

            // Format the deadline date

            // Send notification if tokens exist
            if (registrationTokens.length > 0) {
              await sendNotification(
                registrationTokens, 
                "Subscription cancelled!", 
                `Your Subscription has been cancelled!`
              );
            }
          }
         
        }
      

      } else if (
        decodedPayload?.payload?.notificationType === 'EXPIRED' || decodedPayload?.payload?.notificationType === 'DID_FAIL_TO_RENEW'
      ) {
        //cancelled
        status = "expired";

        let userPurchase = await SubscriptionPurchase.findOneAndUpdate({ purchase_token: signedTransactionInfo?.payload?.originalTransactionId }, {status: status }, { new: true })
        console.log("expired >>>>===", userPurchase);
        if (userPurchase) {
          const userId = userPurchase.userId;
          // change is_subscription_paid status to again false
          const subscriptionStatus = await User.findByIdAndUpdate(userId, {is_subscription_paid: false, current_subscription_plan: "" });
         
        }

      } else if (
        decodedPayload?.payload?.notificationType === 'SUBSCRIBED'
      ) {
        //purchased
        status = "active";
      }
   
  
    res.status(200).json({
      success: true,
    });
  };

  export {subscriptionNotification, verifyUserPayment, verifyUserPaymentIOS, subscriptionNotificationIOS}