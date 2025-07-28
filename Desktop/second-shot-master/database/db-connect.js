import mongoose from "mongoose";
import dotenv from "dotenv";

const dbConnect = async () => {
    try {
      const connect = await mongoose.connect(process.env.CONNECTION_STRING);
      console.log("Database Connected..");
    } catch (error) {
      console.log("Database Connection Error: ", error.message);
    }
  };
  
export {dbConnect}  