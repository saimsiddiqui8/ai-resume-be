import Notification from "../../models/notifications/notification.model.js";
import User from "../../models/user-model/user.model.js";
import uploadManager from "../../utils/Multer/uploadManager.js";
import { changePasswordSchema, deviceTokenSchema, profileSchema, setProfileSchema, updateProfileSchema, verifyPasswordSchema } from "../../validators/user-profile-validations.js";
import bcrypt from 'bcryptjs'
import { deleteUserFromFirebase } from "../../utils/auth/delete-user-firebase.js";
import sendNotification from "../../utils/notification/send-notification.js";
import { logoutSchema } from "../../validators/auth-validations.js";
import { NotificationContent } from "../../models/notifications/notification-content.model.js";


const storeDeviceToken = async (req, res) => {
  const userId = req.user.id;

  // Validate request body
  const { error, value } = deviceTokenSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  const { deviceId, deviceToken } = value;

  try {
    // Find existing notification record for the user
    let notification = await Notification.findOne({ userId });

    if (!notification) {
      // If no record exists, create a new one
      notification = new Notification({
        userId,
        user_type: "user",
        devices: [{ deviceId, fcmToken: deviceToken }]
      });
    } else {
      // Check if the device ID already exists
      const existingDeviceIndex = notification.devices.findIndex(
        (device) => device.deviceId === deviceId
      );

      if (existingDeviceIndex !== -1) {
        // Update existing device token
        notification.devices[existingDeviceIndex].fcmToken = deviceToken;
      } else {
        // Add new device record
        notification.devices.push({ deviceId, fcmToken: deviceToken });
      }
    }

    // Save the updated notification record
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Device token stored successfully"
    });
  } catch (error) {
    console.error("Error storing device token:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

const setProfile = async (req, res) => {
    console.log(req.file)
    try {
        const userId = req.user.id;
      // Validate request body
      const { error: fileError } = profileSchema.validate(req.file, { allowUnknown: true });
      if (fileError) {
        return res.status(400).json({ success: false, error: fileError.details[0].message });
      }
  
      // Validate body fields
      const { error: bodyError } = setProfileSchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ success: false, error: bodyError.details[0].message });
      }
      const { state, city, address } = req.body;
  
      // const { profile_img} = req.file;  
  
      let profilePicture = "" ;
      console.log("req.file======", req.file);
      
      if(req.file){
        console.log("in");
        
        const profilePictureDocumentPath = await uploadManager.upload({
          fileName: req.file.filename,
          key: `pictures`, // Organize documents within a user folder
          fileReference: req.file.path, // Assuming single file upload for each field
          contentType: "image",
        });
        profilePicture = profilePictureDocumentPath.Location;
  
      }
       await User.findByIdAndUpdate(
         userId ,
        {
          profile_img: profilePicture || "",
          state: state,
          city: city,
          address: address,
          is_profile_completed: true,
          is_active: true
        },
        { new: true }
      );
      // Extract file from request
      res.status(200).json({
        success: true,
        message: 'Profile Completed!',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  const myProfile = async (req, res) => {
    try {
      const user_id = req.user.id;
      const user = await User.findById(user_id).select('name phone email profile_img state city address is_subscription_paid is_registration_question_completed is_profile_completed current_subscription_plan');
      return res.status(200).json({ success: true, data: user });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }

  const updateProfile = async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Validate body fields
      const { error: bodyError } = updateProfileSchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          success: false,
          message: bodyError.details[0].message,
        });
      }
  
      const { name, state, city, address } = req.body;
      const updates = {};
      
      if (name) {
        updates.name = name;
      }
      if (state) {
        updates.state = state;
      }
      if (city) {
        updates.city = city;
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "address")) {
        updates.address = address;
      }
    
      // Handle file upload (profile image)
      if (req.file) {
        const uploadedFile = await uploadManager.upload({
          fileName: req.file.filename,
          key: `pictures`, 
          fileReference: req.file.path,
          contentType: "image",
        });
  
        updates.profile_img = uploadedFile.Location;
      }
  
      // Update the user's profile in the database
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updates, { new: true }
      );


      // 🔔 Fetch user's devices for notification
      const userNotification = await Notification.findOne({ userId });

      if (userNotification?.notification_enabled) {
        const registrationTokens = userNotification.devices.map(device => device.fcmToken) || [];

        // Format the deadline date

        // Send notification if tokens exist
        if (registrationTokens.length > 0) {
          await sendNotification(
            registrationTokens, 
            "Profile Updated Successfully!", 
            `Your profile has been updated successfully!`
          );
        }
      }
      // Store notification in the database
      await NotificationContent.create({
        userId,
        title: "Profile Updated Successfully!",
        message: `Your profile has been updated successfully!`,
        notification_type: "created",
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        data: updatedUser,
      });
    } catch (error) {
      console.error('Error updating profile:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal Server Error',
      });
    }
  };

  const changePassword = async (req, res) => {
    try {
      // Validate request body
      const { error } = changePasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: error.details[0].message });
      }
  
      const userId = req.user.id;
      const { current_password, new_password } = req.body;
  
      // Find the user by ID
      const user = await User.findById(userId).select('password');
  
  
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      // Check if the new password is the same as the current one
      const isSameAsOld = await bcrypt.compare(new_password, user.password);
      if (isSameAsOld) {
        return res.status(400).json({
          success: false,
          message: 'New password cannot be the same as the current password. Please try another.',
        });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(new_password, 10);
  
      // Update the user's password
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({
        success: true,
        message: 'Password changed successfully!',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  const verifyPassword = async (req, res) => {
    try {
      // Validate request body
      const { error } = verifyPasswordSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: error.details[0].message });
      }
  
      const userId = req.user.id;
      const { current_password, } = req.body;
  
      // Find the user by ID
      const user = await User.findById(userId).select('password');
  
  
      // Check if the current password is correct
      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
  
      res.status(200).json({
        success: true,
        message: 'Password verified successfully!',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  const logoutUser = async (req, res) => {
    try {
      // Validate request body
      const { error, value } = logoutSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const userId = req.user.id;
      const { deviceId } = value;
  
      // Remove only the matching device from the devices array
      await Notification.findOneAndUpdate(
        { userId },
        { $pull: { devices: { deviceId } } },
        { new: true }
      );
  
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Error in logout:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  };

  const deleteAccount = async (req, res) => {
    try {
    
      const userId = req.user.id;
      const userUid = req.user.uid;

      try {
        await deleteUserFromFirebase(userUid);
      } catch (firebaseError) {
        return res.status(400).json({
          success: false,
          message: firebaseError.message,
        });
      }
      
      const user = await User.findByIdAndUpdate(
        userId,
        {
          is_deleted: true,
          email: "",
          tokenInvalidatedAt: new Date(),
        },
        { new: true }
      );
    
      // Delete the user's notification record
    await Notification.findOneAndDelete({ userId });
      return res.status(200).json({
        success: true,
        message: "Account has been deleted successfully!.",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };

export {storeDeviceToken, setProfile, myProfile, updateProfile, changePassword, logoutUser, deleteAccount, verifyPassword}  