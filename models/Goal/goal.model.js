import mongoose from 'mongoose';

const { Schema } = mongoose;

// Sub-Goal Schema
const SubGoalSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    is_completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// Support Person Schema
const SupportPersonSchema = new Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    email_address: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (email) =>
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email),
        message: 'Invalid email address!',
      },
    },
    phone_number: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (phone) => /^\+?[0-9]{7,15}$/.test(phone),
        message: 'Invalid phone number!',
      },
    },
  },
  { _id: false } // Support people will not have separate IDs
);

// Main Goal Schema
const GoalSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    main_goal_name: {
      type: String,
      required: true,
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Completed', 'Not Started yet', 'In Progress'],
      default: 'Not Started yet',
    },
    sub_goal_status: {
      type: String,
      enum: ['Completed', 'Not Started yet', 'In Progress'],
      default: 'Not Started yet',
    },
    sub_goals: {
      type: [SubGoalSchema],
      default: [],
    },
    support_people: {
      type: [SupportPersonSchema],
      validate: {
        validator: (supportPeople) => supportPeople.length <= 2,
        message: 'A goal can have a maximum of 2 support people.',
      },
      default: [], // Optional: Starts with no support people
    },
  },
  { timestamps: true }
);


const Goal = mongoose.model('Goal', GoalSchema);
export default Goal;
