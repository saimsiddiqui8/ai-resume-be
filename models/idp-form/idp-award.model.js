import mongoose from "mongoose";

const { Schema } = mongoose;

// Support People Schema
const SupportPersonSchema = new Schema(
  {
    full_name: { 
      type: String, 
      required: false, 
      default: null 
    },
    email_address: { 
      type: String, 
      required: false, 
      default: null 
    },
  },
  { _id: false } // Prevent creation of a separate _id for each support person
);

const IDPAwardSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  data: [
    {
      _id: false,
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IDPQuestion',
        required: true,
      },
      answer: {
        type: mongoose.Schema.Types.Mixed, // Can be String, Array, or Null
        default: null,
      },
      
    },
  ],
  support_people: {
    type: [SupportPersonSchema],
    validate: {
      validator: function (value) {
        return value.length <= 2; // Maximum 2 support people
      },
      message: "IDP can have a maximum of 2 support people.",
    },
    default: [], // Default to an empty array
  },
}, { timestamps: true }
);

const IDPAward = mongoose.model("IDPAward", IDPAwardSchema);

export default IDPAward;
