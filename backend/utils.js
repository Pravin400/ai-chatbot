import { GoogleGenerativeAI } from "@google/generative-ai";

const KEY =
  process.env.GOOGLE_API_KEY || "AIzaSyBF_gP2x0V9Ui9hCKyumYr4YGgrVvsn2KE";

const genAI = new GoogleGenerativeAI(KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default model;
