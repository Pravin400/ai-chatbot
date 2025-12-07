import { connect } from "mongoose";
import Chat from "../../schemas.js";
import model from "../../utils.js";
import dotenv from "dotenv";

dotenv.config();

let mongoConnected = false;

const connectMongoDB = async () => {
  if (mongoConnected) return;
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set');
    throw new Error('MONGODB_URI is not set');
  }
  
  try {
    await connect(process.env.MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    mongoConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    mongoConnected = false;
    console.error('❌ MongoDB error:', err.message);
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
    console.log('📍 POST /api/chat/message');
    console.log('Body:', JSON.stringify(req.body));
    
    await connectMongoDB();
    
    if (req.method === 'POST') {
      const { sessionId, question } = req.body;
      
      if (!sessionId || !question) {
        console.log('❌ Missing sessionId or question');
        return res.status(400).json({ message: 'Session ID and question are required' });
      }

      console.log(`🔍 Looking for session: ${sessionId}`);
      const chat = await Chat.findOne({ sessionId });
      if (!chat) {
        console.log(`❌ Session not found: ${sessionId}`);
        return res.status(404).json({ message: 'Chat session not found' });
      }

      console.log(`💭 Generating response for: "${question.substring(0, 50)}..."`);
      
      if (!model) {
        console.error('❌ Model is not initialized');
        return res.status(500).json({ message: 'AI model not initialized', error: 'Model is null' });
      }

      let answer = '';
      try {
        console.log('🤖 Calling generateContent...');
        const result = await model.generateContent(question);
        answer = result.response.text();
        console.log(`✅ Generated response (${answer.length} chars)`);
      } catch (aiError) {
        console.error('❌ AI Generation Error:', aiError.message);
        console.error('Error stack:', aiError.stack);
        return res.status(500).json({ 
          message: 'Error generating AI response', 
          error: aiError.message,
          details: aiError.toString()
        });
      }

      chat.chats.push({ question, answer });
      await chat.save();
      console.log(`✅ Message saved to database`);

      return res.status(200).json({ answer, chatHistory: chat.chats });
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('❌ Catch-all error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error processing message', 
      error: error.message,
      details: error.toString()
    });
  }
}
