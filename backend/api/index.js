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
    console.error('❌ MONGODB_URI not found in environment');
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
    mongoConnected = false;
    throw err;
  }
};

// Health check endpoint - NO MongoDB needed
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.get('/api/chat/sessions', async (req, res) => {
  try {
    console.log('📍 GET /api/chat/sessions');
    await connectMongoDB();
    const sessions = await Chat.find({})
      .sort({ createdAt: -1 })
      .select('sessionId chats createdAt')
      .lean();
    
    console.log(`✅ Found ${sessions.length} sessions`);
    res.json({ sessions });
  } catch (error) {
    console.error('❌ Error fetching sessions:', error.message);
    res.status(500).json({ message: 'Error fetching chat sessions', error: error.message });
  }
});

app.post('/api/chat/start', async (req, res) => {
  try {
    console.log('📍 POST /api/chat/start');
    await connectMongoDB();
    const sessionId = Date.now().toString(); 
    const chat = new Chat({ sessionId });
    await chat.save();
    console.log(`✅ Started session: ${sessionId}`);
    res.json({ sessionId, message: 'New chat session started' });
  } catch (error) {
    console.error('❌ Error starting chat:', error.message);
    res.status(500).json({ message: 'Error starting chat session', error: error.message });
  }
});

app.post('/api/chat/message', async (req, res) => {
  try {
    console.log('📍 POST /api/chat/message');
    await connectMongoDB();
    const { sessionId, question } = req.body;
    
    if (!sessionId || !question) {
      return res.status(400).json({ message: 'Session ID and question are required' });
    }

    console.log(`🔍 Looking for session: ${sessionId}`);
    const chat = await Chat.findOne({ sessionId });
    if (!chat) {
      console.log(`❌ Session not found: ${sessionId}`);
      return res.status(404).json({ message: 'Chat session not found' });
    }

    console.log(`💭 Generating response for: "${question}"`);
    let answer = '';
    try {
      const result = await model.generateContent(question);
      answer = result.response.text();
      console.log(`✅ Generated response (${answer.length} chars)`);
    } catch (aiError) {
      console.error('❌ AI Generation Error:', aiError.message);
      return res.status(500).json({ message: 'Error generating AI response', error: aiError.message });
    }

    chat.chats.push({ question, answer });
    await chat.save();
    console.log(`✅ Message saved`);

    res.json({ answer, chatHistory: chat.chats });
  } catch (error) {
    console.error('❌ Chat endpoint error:', error.message);
    res.status(500).json({ message: 'Error processing chat', error: error.message });
  }
});

app.get('/api/chat/history/:sessionId', async (req, res) => {
  try {
    console.log(`📍 GET /api/chat/history/${req.params.sessionId}`);
    await connectMongoDB();
    const { sessionId } = req.params;
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      console.log(`❌ Session not found: ${sessionId}`);
      return res.status(404).json({ message: 'Chat session not found' });
    }

    console.log(`✅ Found history with ${chat.chats.length} messages`);
    res.json({ chatHistory: chat.chats });
  } catch (error) {
    console.error('❌ Error fetching history:', error.message);
    res.status(500).json({ message: 'Error fetching chat history', error: error.message });
  }
});

app.delete('/api/chat/:sessionId', async (req, res) => {
  try {
    console.log(`📍 DELETE /api/chat/${req.params.sessionId}`);
    await connectMongoDB();
    const { sessionId } = req.params;
    
    const result = await Chat.deleteOne({ sessionId });
    
    if (result.deletedCount === 0) {
      console.log(`❌ Session not found: ${sessionId}`);
      return res.status(404).json({ message: 'Chat session not found' });
    }

    console.log(`✅ Deleted session: ${sessionId}`);
    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting chat session:', error.message);
    res.status(500).json({ message: 'Error deleting chat session', error: error.message });
  }
});

// Catch all - log unmatched requests
app.use((req, res) => {
  console.log(`⚠️ 404: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found', path: req.path, method: req.method });
});

export default app;
