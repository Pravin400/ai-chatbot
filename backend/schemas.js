import { Schema, model } from "mongoose";

const chatSchema = Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  chats: [{
    question: String,
    answer: String,
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Chat = model("Chat", chatSchema);

export default Chat;
