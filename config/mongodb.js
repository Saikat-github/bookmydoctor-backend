import mongoose from "mongoose";
import { setupCronJobs } from "../utils/scheduledJobs.js";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB");
      try {
        setupCronJobs();
      } catch (error) {
        console.error("Failed to setup scheduled jobs:", error);
      }
    });
    await mongoose.connect(`${process.env.MONGO_URI}/prescripto`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;