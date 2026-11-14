import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

await connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
