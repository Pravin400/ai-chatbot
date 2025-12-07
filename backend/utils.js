import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure dotenv with the correct path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const KEY = process.env.GOOGLE_API_KEY;

if (!KEY) {
  console.error("⚠️ Warning: GOOGLE_API_KEY is not set in .env file");
  console.error("Please create a .env file in the backend directory with your API key");
  console.error("Example: GOOGLE_API_KEY=your_api_key_here");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export default model;
