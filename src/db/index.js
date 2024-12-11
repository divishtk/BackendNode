import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(`\n MongoDB Connected!! DB HOST: ${connectionInstance.connection.host}`);
  } catch (err) {
    console.log("MONGO DB connection error", err);
    process.exit(1);
    throw err;
  }
};

export default connectDB