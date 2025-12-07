import { connect } from "mongoose";
import Chat from "../../schemas.js";
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
      console.log('📍 Starting new chat session');
      const sessionId = Date.now().toString(); 
      const chat = new Chat({ sessionId });
      await chat.save();
      console.log(`✅ Session created: ${sessionId}`);
      return res.status(200).json({ sessionId, message: 'New chat session started' });
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Error in /start:', error.message);
    res.status(500).json({ message: 'Error', error: error.message });
  }
}
