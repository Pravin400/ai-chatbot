import express, { json } from "express";
import cors from "cors";
import { connect } from "mongoose";
import Chat from "../schemas.js";
import model from "../utils.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(json());

// Simple CORS configuration - allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type'],
  credentials: false
}));

// MongoDB Connection (with caching to avoid reconnecting on every request)
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
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

// API Routes
app.get('/api/chat/sessions', async (req, res) => {
  try {
    await connectMongoDB();
    const sessions = await Chat.find({})
      .sort({ createdAt: -1 })
      .select('sessionId chats createdAt')
      .lean();
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Error fetching chat sessions', error: error.message });
  }
});

app.post('/api/chat/start', async (req, res) => {
  try {
    await connectMongoDB();
    const sessionId = Date.now().toString(); 
    const chat = new Chat({ sessionId });
    await chat.save();
    res.json({ sessionId, message: 'New chat session started' });
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ message: 'Error starting chat session', error: error.message });
  }
});

app.post('/api/chat/message', async (req, res) => {
  try {
    await connectMongoDB();
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

    res.json({ answer, chatHistory: chat.chats });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ message: 'Error processing chat', error: error.message });
  }
});

app.get('/api/chat/history/:sessionId', async (req, res) => {
  try {
    await connectMongoDB();
    const { sessionId } = req.params;
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ chatHistory: chat.chats });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Error fetching chat history', error: error.message });
  }
});

app.delete('/api/chat/:sessionId', async (req, res) => {
  try {
    await connectMongoDB();
    const { sessionId } = req.params;
    
    const result = await Chat.deleteOne({ sessionId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ message: 'Error deleting chat session', error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

export default app;
