import mongoose from "mongoose";
import logger from "./logger.js";
import { flushLogsAndExit } from "../utils/shutdown.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`, {
      stack: error.stack,
    });
    flushLogsAndExit(1);
  }
};

export default connectDB;
