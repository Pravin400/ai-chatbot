import { connect } from "mongoose";
import Chat from "../../schemas.js";
import model from "../../utils.js";
import dotenv from "dotenv";

dotenv.config();

let mongoConnected = false;

const connectMongoDB = async () => {
  if (mongoConnected) return;
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }
  
  try {
    await connect(process.env.MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    mongoConnected = true;
  } catch (err) {
    mongoConnected = false;
    throw err;
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectMongoDB();
    
    if (req.method === 'POST') {
      const { sessionId, question } = req.body;
      
      if (!sessionId || !question) {
        return res.status(400).json({ message: 'Session ID and question are required' });
      }

      const chat = await Chat.findOne({ sessionId });
      if (!chat) {
        return res.status(404).json({ message: 'Chat session not found' });
      }

      let answer = '';
      try {
        const result = await model.generateContent(question);
        answer = result.response.text();
      } catch (aiError) {
        console.error('AI Generation Error:', aiError);
        return res.status(500).json({ message: 'Error generating AI response', error: aiError.message });
      }

      chat.chats.push({ question, answer });
      await chat.save();

      return res.status(200).json({ answer, chatHistory: chat.chats });
    }
    
    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
}
