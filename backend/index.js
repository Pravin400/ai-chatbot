import express, { json } from "express";
import cors from "cors";
import { connect } from "mongoose";
import Chat from "./schemas.js";
import model from "./utils.js";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
app.use(json());

 app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type'],
  credentials: false
}));

 
if (!process.env.MONGODB_URI) {
  console.error('⚠️ Error: MONGODB_URI is not set in .env file');
  console.error('Please create a .env file with your MongoDB connection string');
  process.exit(1);
}

console.log('🔄 Attempting to connect to MongoDB...');
connect(process.env.MONGODB_URI, { 
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000,
})
  .then(() => {
    console.log('✅ Successfully connected to MongoDB');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('📌 Make sure MongoDB is running on your machine');
    console.error('💡 If using local MongoDB, start it with: mongod');
    process.exit(1);
  });

 
app.get('/api/chat/sessions', async (req, res) => {
  try {
    const sessions = await Chat.find({})
      .sort({ createdAt: -1 })
      .select('sessionId chats createdAt')
      .lean();
    
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat sessions', error: error.message });
  }
});

 
app.post('/api/chat/start', async (req, res) => {
  try {
    const sessionId = Date.now().toString(); 
    const chat = new Chat({ sessionId });
    await chat.save();
    res.json({ sessionId, message: 'New chat session started' });
  } catch (error) {
    res.status(500).json({ message: 'Error starting chat session', error: error.message });
  }
});

 
app.post('/api/chat/message', async (req, res) => {
  try {
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
    const { sessionId } = req.params;
    const chat = await Chat.findOne({ sessionId });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ chatHistory: chat.chats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat history', error: error.message });
  }
});

 
app.delete('/api/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('Attempting to delete session:', sessionId);
    
    const result = await Chat.deleteOne({ sessionId });
    console.log('Delete result:', result);
    
    if (result.deletedCount === 0) {
      console.log('No document found to delete');
      return res.status(404).json({ message: 'Chat session not found' });
    }

    console.log('Successfully deleted session');
    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ message: 'Error deleting chat session', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/chat/message`);
});
