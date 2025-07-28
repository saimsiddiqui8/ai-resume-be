import mongoose from "mongoose";

const FavoriteCareerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recommendationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    careers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Career",
        _id: false,
        default: []
      }
    ],
    
  },
  { timestamps: true }
);

const FavoriteCareer = mongoose.model("FavoriteCareer", FavoriteCareerSchema);

export default FavoriteCareer;
