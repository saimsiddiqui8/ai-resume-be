import { admin } from "../../../configs/admin-authorizer.js";
import OTPPhone from "../../../models/auth/otp-phone.model.js";
import OTP from "../../../models/auth/otp.model.js";
import PhoneRegister from "../../../models/auth/register-phone-model.js";
import User from "../../../models/user-model/user.model.js";
import { generateOTP } from "../../../utils/auth/generate-otp.js";
import { signToken } from "../../../utils/auth/sign-token.js";
import { verifyFirebaseToken } from "../../../utils/auth/verify-firebase-token.js";
// import { verifyFirebaseToken } from "../../../utils/auth/verify-firebase-token.js";
import sendEmail from "../../../utils/email/send-email.js";
import { sendSMS } from "../../../utils/phone/sendSMS.js";
import { createStripeCustomer } from "../../../utils/stripe/customer/create-stripe-customer.js";
import { forgetPasswordSchema, loginSchema, registerPhoneSchema, resendOTPPhoneSchema, resendOTPSchema, resetPasswordSchema, signUpSchema, socialSchema, verifyOTPPhoneSchema, verifyOTPSchema, verifyRegisteredOtpSchema, verifyUserSchema } from "../../../validators/auth-validations.js";
import bcrypt from 'bcryptjs'
import rateLimit from "express-rate-limit";



const usersignUp = async (req, res) => {
  // Validate request body
  const { error } = signUpSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  const { name, email, phone = "", password, idToken } = req.body;
  const otpCode = generateOTP();

  try {
    // Verify Firebase ID token
    const tokenResult = await verifyFirebaseToken(idToken);
    if (!tokenResult.success) {
      return res.status(401).json({ success: false, error: tokenResult.errorMessage });
    }

    const { uid } = tokenResult;
    console.log("uid===", uid);
    
    // Check if the email exists in the user collection
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      if (existingUser.is_active) {
        return res.status(400).json({
          success: false,
          error: 'You already have an account with this email, Please use a new email to register.',
        });
      } else {
        // If the existing user is inactive, update and activate the account
        const user = existingUser;
        user.name = name;
        user.phone = phone;
        user.password = await bcrypt.hash(password, 10);
        // user.is_active=true
         user.uid = uid; // Update Firebase UID
        await user.save();

        // Handle OTP and sending email/SMS for re-activation
        await OTP.findOneAndUpdate(
          { email },
          { otp: otpCode, time: Date.now() },
          { upsert: true, new: true }
        );
        await sendEmail(email, name, otpCode);
      const token = signToken(user._id);
        console.log("user====", user);
        

        return res.status(200).json({ success: true, message: 'User reactivated successfully!', /* token */ });
      }
    } else {
      // If no user exists, proceed with account creation
      const stripeCustomerId = await createStripeCustomer(email);
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        stripe_customer_id: stripeCustomerId,
        // is_active:true
        uid, // Save Firebase UID
      });

      // Create OTP and send notifications
      await OTP.findOneAndUpdate(
        { email },
        { otp: otpCode, time: Date.now() },
        { upsert: true, new: true }
      );
      await sendEmail(email, name, otpCode);
      const token = signToken(user._id);


      return res.status(201).json({ success: true, message: 'User registered successfully!', /* token */ });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const checkFirebaseUser = async (req, res) => {
  // Validate request body
  const { error } = verifyUserSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ success: false, error: error.details[0].message });
  }
  try {
    const { email } = req.body;
    const user = await User.findOne({email});
    if (!user) {
      return res.status(200).json({
        success: true,
       message: "User does not exist"
      });
    }
    if (user && !user.is_active) {
      await admin.auth().deleteUser(user.uid);
      await User.findOneAndUpdate({email}, {email: ""})
    }
    return res.status(200).json({
      success: true,
      message: "Email checked Successfully"
    });
  } catch (error) {
    console.error(error);

  }
};


const verifyOTP = async (req, res) => {
  try {
    const { error } = verifyOTPSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
    const { email, otp, phone , type} = req.body;

    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found" });
    }
    // Fetch user based on role
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Account does not exist!",
      });
    }
    const currentTime = new Date();
    const otpTime = new Date(otpRecord.time);
    const timeDifference = currentTime - otpTime;
    const otpExpiry = 5 * 60 * 1000;
    if (timeDifference > otpExpiry) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }
    // after verify email otp send an OTP to Phone
    // if (phone) {
    //   const otpCodePhone = generateOTP();
    //   await sendSMS(phone, otpCodePhone);
    //   //update phone otp record
    //   await OTPPhone.findOneAndUpdate(
    //     { phone },
    //     { otp: otpCodePhone, time: Date.now() },
    //     { upsert: true, new: true }
    //   );
    // }
    if (type === "signup") {
      const token = signToken(user._id);
      await User.findOneAndUpdate({email: user.email}, {is_active:true})

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully!",
        token,
        name: user.name,
        email, email,
        phone: user.phone
      });
    }
    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully"});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const verifyOTPPhone = async (req, res) => {
  try {
    const { error } = verifyOTPPhoneSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }
    const { phone, otp} = req.body;
  
    const otpRecord = await OTPPhone.findOne({ phone });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "OTP not found" });
    }
    // Fetch user based on role
   
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Account does not exist!",
      });
    }
    const currentTime = new Date();
    const otpTime = new Date(otpRecord.time);
    const timeDifference = currentTime - otpTime;
    const otpExpiry = 5 * 60 * 1000;
    if (timeDifference > otpExpiry) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }
    const token = signToken(user._id);
    await User.findOneAndUpdate({email: user.email}, {is_active:true})
    return res
      .status(200)
      .json({ success: true, message: "OTP verified successfully", token: token});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const otpRateLimiter = rateLimit({
  windowMs: 30 * 1000, // 1 minute
  max: 1,
  message: { success: false, message: "Wait for 30 secound to retry" },
});

const resendOtpEmail = async (req, res) => {
  try {
    otpRateLimiter(req, res, async () => {
    const { error, value } = resendOTPSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
      const { email } = value;

      // Find the OTP record associated with the provided phone number
      let otpRecord = await OTP.findOne({ email });
      
      // If OTP record doesn't exist, create a new one
      if (!otpRecord) {
        return res.status(400).json({ success: false, message: "User Not Found" });
      }

      // Check if the number of retries has reached the limit
      if (otpRecord.otp_retries >= 3) {
          // Check if cooldown period has passed (10 minutes)
          const currentTime = new Date();
          const lastRetryTime = new Date(otpRecord.lastRetryTime);
          const cooldownDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
          const timeDifference = currentTime - lastRetryTime;

          if (timeDifference < cooldownDuration) {
              // Cooldown period has not passed, return error message
              const remainingCooldown = cooldownDuration - timeDifference;
              return res.status(400).json({
                  success: false,
                  message: `You have exceeded the maximum retry limit. Please wait for ${Math.floor(remainingCooldown / 60000)} minutes before retrying.`
              });
          } else {
              // Cooldown period has passed, reset retry count and last retry time
              otpRecord.otp_retries = 0;
              otpRecord.lastRetryTime = null;
          }
      }

      // Generate new OTP code
      const otpCode = generateOTP();

      // Update OTP record with new OTP code and retry count
      otpRecord.otp = otpCode;
      otpRecord.otp_retries++;
      otpRecord.lastRetryTime = new Date();
      otpRecord.time = Date.now()
      await otpRecord.save();
      const user = await User.findOne({email})
      if (!user) {
        return res.status(400).json({ success: false, message: "Account does not exist!" });
      }
      // Send SMS with OTP
      await sendEmail(email,user.name, otpCode);
      


      res.status(200).json({ success: true, message: "OTP sent successfully" });
    });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const resendOtpPhone = async (req, res) => {
  try {
    otpRateLimiter(req, res, async () => {
    const { error, value } = resendOTPPhoneSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
      const { phone } = value;

      // Find the OTP record associated with the provided phone number
      let otpRecord = await OTPPhone.findOne({ phone });

      // If OTP record doesn't exist, create a new one
      if (!otpRecord) {
        return res.status(400).json({ success: false, message: "User Not Found" });
      }

      // Check if the number of retries has reached the limit
      if (otpRecord.otp_retries >= 3) {
          // Check if cooldown period has passed (10 minutes)
          const currentTime = new Date();
          const lastRetryTime = new Date(otpRecord.lastRetryTime);
          const cooldownDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
          const timeDifference = currentTime - lastRetryTime;

          if (timeDifference < cooldownDuration) {
              // Cooldown period has not passed, return error message
              const remainingCooldown = cooldownDuration - timeDifference;
              return res.status(400).json({
                  success: false,
                  message: `You have exceeded the maximum retry limit. Please wait for ${Math.floor(remainingCooldown / 60000)} minutes before retrying.`
              });
          } else {
              // Cooldown period has passed, reset retry count and last retry time
              otpRecord.otp_retries = 0;
              otpRecord.lastRetryTime = null;
          }
      }

      // Generate new OTP code
      const otpCode = generateOTP();

      // Update OTP record with new OTP code and retry count
      otpRecord.otp = otpCode;
      otpRecord.otp_retries++;
      otpRecord.lastRetryTime = new Date();
      otpRecord.time = Date.now()
      await otpRecord.save();
      const user = await User.findOne({phone})
      if (!user) {
        return res.status(400).json({ success: false, message: "Account does not exist!" });
      }
      // Send SMS with OTP (Assuming sendSMS function is asynchronous)
      await sendSMS(phone, otpCode);

      res.status(200).json({ success: true, message: "OTP sent successfully" });
    });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { error } = forgetPasswordSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Account does not exist!" });
    }
    //otp
    const otpCode = generateOTP();
    await OTP.findOneAndUpdate(
      { email },
      { otp: otpCode, time: Date.now(), otp_retries: 0 },
      { upsert: true, new: true }
    );
    // Send OTP via email
    await sendEmail(email, user.name, otpCode);


    return res
      .status(200)
      .json({ success: true, message: "Password reset OTP sent successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, password } = value;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Account does not exist!' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const registerPhonewithEmail = async (req, res) => {
  try {
    const { error, value } = registerPhoneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, phone } = value;
    const otp = generateOTP();

    await sendSMS(phone, otp);
    const phoneUpdate = await PhoneRegister.findOneAndUpdate(
      { email },
      { newPhone: phone, otp },
      { new: true, upsert: true }
    );


    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error requesting phone update OTP:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }

}

const verifyRegisteredOtp = async (req, res) => {
  try {
    const { error, value } = verifyRegisteredOtpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, otp } = value;
    const phoneUpdate = await PhoneRegister.findOne({ email, otp });

    if (!phoneUpdate) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or it has expired",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Account does not exist!",
      });
    }
    user.phone = phoneUpdate.newPhone;
    await user.save();

    await PhoneRegister.deleteOne({ _id: phoneUpdate._id });

    res.status(200).json({ success: true, message: "Phone number verified successfully!"});
  } catch (error) {
    console.error("Error verifying phone update OTP:", error);
    res.status(500).json({ success: false, message: "Internal Server Error"});
  }
};

// login

const login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email }).select('name password phone uid is_blocked is_deleted is_active is_subscription_paid is_profile_completed is_registration_question_completed');
    if (!user || user.is_deleted) {
      return res.status(400).json({ success: false, message: 'Account does not exist!' });
    }

    // Check if the account is blocked
    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended due to violation of Community Guidelines' });
    }

    // Check if the account is active
    if (!user.is_active) {
      return res.status(400).json({ success: false, message: 'Please complete your profile' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    // Create a token
    const token = signToken(user._id);

    return res.status(200).json({ success: true, message: 'Login successful', is_subscription_paid : user.is_subscription_paid, is_profile_completed: user.is_profile_completed, is_registration_question_completed: user.is_registration_question_completed, email: email, name: user.name, phone:user.phone, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const socialLogin = async (req, res) => {
  try {
    // Validate request body
    const { error } = socialSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { email, idToken, name } = req.body;

    // Verify Firebase ID token
    const tokenResult = await verifyFirebaseToken(idToken);
    if (!tokenResult.success) {
      return res.status(401).json({ success: false, error: tokenResult.errorMessage });
    }

    const { uid } = tokenResult;
    console.log("uid===", uid);

    // Find user by email (case-insensitive)
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // If the user is blocked, restrict access
      if (user.is_blocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended due to violation of Community Guidelines',
        });
      }

      // If the user is inactive, activate the account
      if (!user.is_active) {
        user.is_active = true;
        await user.save();
      }
    } else {
      // If user does not exist, create a new one
      user = new User({
        email: email.toLowerCase(),
        uid,
        name: name || '',
        is_active: true,
      });
      await user.save();
    }

    // Generate authentication token
    const token = signToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      is_subscription_paid: user.is_subscription_paid,
      is_profile_completed: user.is_profile_completed,
      is_registration_question_completed: user.is_registration_question_completed,
      email: user.email,
      name: user.name,
      phone: user.phone,
      token,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


export {
  usersignUp,
  checkFirebaseUser,
  verifyOTP,
  verifyOTPPhone,
  resendOtpEmail,
  resendOtpPhone,
  forgetPassword,
  resetPassword,
  registerPhonewithEmail,
  verifyRegisteredOtp,
  login,
  socialLogin
}  