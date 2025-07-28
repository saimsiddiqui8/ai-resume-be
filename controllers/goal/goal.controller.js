import Goal from "../../models/Goal/goal.model.js";
import { NotificationContent } from "../../models/notifications/notification-content.model.js";
import Notification from "../../models/notifications/notification.model.js";
import { sendGoalSupportEmails } from "../../utils/email/send-goal-support-emails.js";
import sendNotification from "../../utils/notification/send-notification.js";
import { addSupportPeopleGoalSchema, changeGoalStatusSchema, createGoalSchema, deleteGoalSchema, goalDetailsSchema, updateSubGoalSchema } from "../../validators/goal-validation.js";
import moment from "moment";


const createGoal = async (req, res) => {
    try {
        // Validate request body using Joi
        const { error, value } = createGoalSchema.validate(req.body, {
          abortEarly: false,
        });
    
        if (error) {
          return res.status(400).json({
            success: false,
            message: error.details[0].message
          });
        }
    
        const userId = req.user.id;

        const {main_goal_name, deadline, sub_goals, support_people} = value;
    
        // Create and save a new goal
        const newGoal = new Goal({
          userId,
          main_goal_name,
          deadline,
          sub_goals: sub_goals || [],
          support_people: support_people || [],
        });
    
        await newGoal.save();

        // Fetch all device tokens for the user
        const userNotification = await Notification.findOne({ userId });

        const formattedDeadline = moment(deadline).format("MMMM Do, YYYY");
        // Check if notifications are enabled
        if (userNotification?.notification_enabled) {
          const registrationTokens = userNotification.devices.map(device => device.fcmToken) || [];

          // Format the deadline date

          // Send notification if tokens exist
          if (registrationTokens.length > 0) {
            await sendNotification(
              registrationTokens, 
              "Goal Set Successfully!", 
              `Your goal has been set and will end on ${formattedDeadline}. Good Luck!`
            );
          }
        }

        // Store notification in the database
        await NotificationContent.create({
          userId,
          title: "Goal Set Successfully!",
          message: `Your goal has been set and will end on ${formattedDeadline}. Good Luck!`,
          notification_type: "created",
          data: {
            goalId: newGoal._id,
          }
        });

        // **Send Emails to Support People using the helper function**
        await sendGoalSupportEmails(support_people, req.user, main_goal_name, formattedDeadline);
    
        return res.status(201).json({
          success: true,
          message: 'Goal created successfully',
          data: newGoal,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
}

const goalDetails = async (req, res) => {
    try {
      // Validate the request body
      const { error } = goalDetailsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const { goalId } = req.body;
  
      // Find the goal by ID
      const goal = await Goal.findById(goalId).select('-userId -updatedAt');
  
      if (!goal) {
        return res.status(400).json({
          success: false,
          message: "Goal not found!",
        });
      }
  
      return res.status(200).json({
        success: true,
        data: goal,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

const myGoals = async (req, res) => {
    try {
        const  userId  = req.user.id;
    
        // Fetch goals for the user
        const goals = await Goal.find({ userId }).select('main_goal_name deadline status createdAt').sort({ createdAt: -1 });;
    
        return res.status(200).json({
          success: true,
          data: goals,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
}

const changeGoalStatus = async (req, res) => {
    try {
      // Validate request body
      const { error } = changeGoalStatusSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { goalId } = req.body;

      // Find the goal by ID
      const goal = await Goal.findById(goalId);

      if (!goal) {
        return res.status(400).json({
          success: false,
          message: "Goal not found!",
        });
      }

      // Check if the status is already "Completed"
      if (goal.status === "Completed") {
        return res.status(400).json({
          success: false,
          message: "Goal is already marked as Completed!",
        });
      }

      // Update all sub-goals to `is_completed: true` if the goal has sub-goals
      // if (goal.sub_goals && goal.sub_goals.length > 0) {
      //     goal.sub_goals = goal.sub_goals.map((subGoal) => ({
      //       ...subGoal.toObject(),
      //       is_completed: true,
      //     }));
      //   }

      // Update the status to "Completed"
      goal.status = "Completed";
      // goal.sub_goal_status = "Completed";
      await goal.save();

      // Define notification title & message
      const notificationTitle = "Congratulations! 🎉";
      const notificationMessage = `You've successfully completed your goal. Great job!`;

      const userNotification = await Notification.findOne({
        userId: goal.userId,
      });

      // Check if notifications are enabled
      if (userNotification?.notification_enabled) {
        const registrationTokens =
          userNotification.devices.map((device) => device.fcmToken) || [];

        // Send notification if tokens exist
        if (registrationTokens.length > 0) {
          await sendNotification(
            registrationTokens,
            notificationTitle,
            notificationMessage
          );
        }
      }

      // ✅ Save notification in the database
      await NotificationContent.create({
        userId: goal.userId,
        title: notificationTitle,
        message: notificationMessage,
        notification_type: "created",
        data: { goalId },
      });

      // Send Email Notifications to Newly Added Support People
      const formattedDeadline = moment(goal.deadline).format("MMMM Do, YYYY");
      await sendGoalSupportEmails(goal.support_people, req.user, goal.main_goal_name, formattedDeadline, "completed");

      return res.status(200).json({
        success: true,
        message: "Goal status updated to Completed",
        data: goal,
      });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
}

const updateSubGoalStatus = async (req, res) => {
  try {
    // Validate Request Body
    const { error } = updateSubGoalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { goalId, subGoalId } = req.body;

    const goal = await Goal.findById(goalId);

    if (!goal) {
      return res.status(400).json({
        success: false,
        message: 'Goal not found!',
      });
    }

    // Find the sub-goal within the goal
    const subGoal = goal.sub_goals.id(subGoalId);
    
    if (!subGoal) {
      return res.status(400).json({
        success: false,
        message: 'Sub-goal not found!',
      });
    }

    // Check if the sub-goal is already completed
    if (subGoal.is_completed) {
      return res.status(400).json({
        success: false,
        message: 'Sub-goal is already completed!',
      });
    }

    // Update the sub-goal's is_completed status to true
    subGoal.is_completed = true;

    // ⚡ First, update status if it was 'Not Started yet'
    if (goal.status === 'Not Started yet') {
      goal.status = 'In Progress';
      goal.sub_goal_status = 'In Progress';
    }
    

    // ⚡ Then, check if all sub-goals are completed
    const allSubGoalsCompleted = goal.sub_goals.every(sub => sub.is_completed);

    if (allSubGoalsCompleted) {
           goal.sub_goal_status = 'Completed';
    } else {
      if (goal.status === 'Completed') {
        goal.sub_goal_status = 'In Progress';
      } else {
        goal.sub_goal_status = 'In Progress';
      }
    }

    await goal.save();

    return res.status(200).json({
      success: true,
      message: 'Sub-goal marked as completed and goal status updated!',
      data: goal,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

  const addSupportPeopleGoal = async (req, res) => {
    try {
        // Validate the request body
        const { error, value } = addSupportPeopleGoalSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { goalId, supportPeople } = value;

        // Find the goal by ID
        const goal = await Goal.findById(goalId);
        if (!goal) {
            return res.status(400).json({
                success: false,
                message: "Goal not found!",
            });
        }

        let existingSupportPeople = goal.support_people;

        // Filter out duplicate support people
        const uniqueNewSupportPeople = supportPeople.filter(person => 
            !existingSupportPeople.some(existing => 
                existing.full_name === person.full_name &&
                existing.email_address === person.email_address &&
                existing.phone_number === person.phone_number
            )
        );

        // Ensure final count does not exceed 2
        const finalSupportPeopleCount = existingSupportPeople.length + uniqueNewSupportPeople.length;

        if (finalSupportPeopleCount > 2) {
            return res.status(400).json({
                success: false,
                message: "A goal can have a maximum of 2 support people.",
            });
        }

        // Add only unique new support people
        goal.support_people.push(...uniqueNewSupportPeople);

        // Save the updated goal
        await goal.save();

        // Send Email Notifications to Newly Added Support People
        const formattedDeadline = moment(goal.deadline).format("MMMM Do, YYYY");
        await sendGoalSupportEmails(uniqueNewSupportPeople, req.user, goal.main_goal_name, formattedDeadline);

        return res.status(200).json({
            success: true,
            message: "Support people added successfully!",
            data: goal,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

  const deleteGoal = async (req, res) => {
    try {
      // Validate the request body
      const { error } = deleteGoalSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
  
      const { goalId } = req.body;
      const userId = req.user.id;
  
      // Find the goal by ID
      const goal = await Goal.findById(goalId);
  
      if (!goal) {
        return res.status(400).json({
          success: false,
          message: "Goal not found!",
        });
      }
  
      // Check if the goal belongs to the authenticated user
      if (goal.userId.toString() !== userId.toString()) {
        return res.status(400).json({
          success: false,
          message: "You are not authorized to delete this goal!",
        });
      }
  
      // Delete the goal
      await Goal.findByIdAndDelete(goalId);
  
      return res.status(200).json({
        success: true,
        message: "Goal deleted successfully!",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

export {
    createGoal,
    myGoals,
    goalDetails,
    changeGoalStatus,
    updateSubGoalStatus,
    addSupportPeopleGoal,
    deleteGoal
}