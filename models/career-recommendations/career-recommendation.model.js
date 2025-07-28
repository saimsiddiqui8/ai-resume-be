import mongoose from "mongoose";

const { Schema } = mongoose;

const CareerRecommendationSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    data: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const DataSchema = new Schema({
  career: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Career",
  },
  point: {
    type: Number,
    default: 0,
  },
});

const CareerRecommendation = mongoose.model(
  "CareerRecommendation",
  CareerRecommendationSchema
);

export default CareerRecommendation;
