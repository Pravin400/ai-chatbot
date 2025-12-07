import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTrash, faPlus, faRobot, faUser, faClock, faSpinner, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import FormattedMessage from './FormattedMessage';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allChatSessions, setAllChatSessions] = useState([]);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [typing, setTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus input when component mounts and after each message
  useEffect(() => {
    inputRef.current?.focus();
  }, [chatHistory]);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Load current session from localStorage on initial load
  useEffect(() => {
    const savedSessionId = localStorage.getItem('currentSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadChatSession(savedSessionId);
    } else {
      startNewChat();
    }
    fetchAllChatSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAllChatSessions = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:3000/api/chat/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch chat sessions');
      }
      const data = await response.json();
      setAllChatSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      setError('Failed to load chat history');
    }
  };

  const startNewChat = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:3000/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to start new chat');
      }
      const data = await response.json();
      setSessionId(data.sessionId);
      localStorage.setItem('currentSessionId', data.sessionId);
      setChatHistory([]);
      await fetchAllChatSessions();
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Failed to start new chat');
    }
  };

  const loadChatSession = async (sessionId) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:3000/api/chat/history/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to load chat session');
      }
      const data = await response.json();
      setSessionId(sessionId);
      localStorage.setItem('currentSessionId', sessionId);
      setChatHistory(data.chatHistory);
    } catch (error) {
      console.error('Error loading chat session:', error);
      setError('Failed to load chat session');
    }
  };

  const deleteChatSession = async (sessionIdToDelete) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:3000/api/chat/${sessionIdToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete chat session');
      }

      if (sessionIdToDelete === sessionId) {
        localStorage.removeItem('currentSessionId');
        await startNewChat();
      } else {
        await fetchAllChatSessions();
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
      setError('Failed to delete chat session');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    
    // Show user message immediately
    setChatHistory(prev => [...prev, { question: userMessage, answer: '' }]);
    
    setIsLoading(true);
    setTyping(true);
    setIsStreaming(true);
    setStreamingText('');
    
    try {
      setError(null);
      const response = await fetch('http://localhost:3000/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          question: userMessage,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      const data = await response.json();
      
      // Simulate streaming response
      const fullResponse = data.answer;
      await simulateStreaming(fullResponse);
      
      // Update chat history with complete response
      setChatHistory(data.chatHistory);
      await fetchAllChatSessions();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
      setTyping(false);
      setIsStreaming(false);
      setStreamingText('');
      inputRef.current?.focus();
    }
  };

  const simulateStreaming = async (text) => {
    let displayText = '';
    // Split by lines and display line by line
    const lines = text.split('\n');
    
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      // Display each character in the line quickly
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        displayText += line[charIdx];
        setStreamingText(displayText);
        // Ultra fast: 0.5ms per character
        await new Promise(resolve => setTimeout(resolve, 0.5));
      }
      // Add newline after each line
      displayText += '\n';
      setStreamingText(displayText);
      // Small pause between lines
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex h-[calc(100vh-4rem)] relative transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      
      <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${
        darkMode 
          ? 'from-indigo-900/20 to-purple-900/20 backdrop-blur-sm' 
          : 'from-blue-100/50 to-purple-100/50 backdrop-blur-sm'
      }`}></div>
      
       
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
          darkMode 
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
            : 'bg-white text-gray-800 hover:bg-gray-100'
        } shadow-lg z-20`}
      >
        <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
      </button>
      
       
      <div className={`w-64 p-4 overflow-y-auto relative z-10 border-r transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800/80 border-gray-700/50' 
          : 'bg-white/80 border-gray-200/50'
      } backdrop-blur-md custom-scrollbar`}>
        <button
          onClick={startNewChat}
          className={`w-full mb-4 p-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
            darkMode 
              ? 'bg-indigo-600/90 hover:bg-indigo-700/90 text-white shadow-lg hover:shadow-indigo-500/20' 
              : 'bg-blue-600/90 hover:bg-blue-700/90 text-white shadow-lg hover:shadow-blue-500/20'
          }`}
        >
          <FontAwesomeIcon icon={faPlus} />
          New Chat
        </button>
        
        {error && (
          <div className={`mb-4 p-2 rounded-lg text-sm ${
            darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
          }`}>
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <div className={`text-sm font-medium mb-2 ${
            darkMode ? 'text-white/80' : 'text-gray-700'
          }`}>
            Chat History
          </div>
          {allChatSessions.map((session) => (
            <div
              key={session.sessionId}
              className={`group relative p-2 rounded-lg cursor-pointer transition-all duration-300 ${
                sessionId === session.sessionId
                  ? darkMode 
                    ? 'bg-indigo-600/50' 
                    : 'bg-blue-600/50'
                  : darkMode 
                    ? 'hover:bg-gray-700/50' 
                    : 'hover:bg-gray-100/50'
              }`}
            >
              <div
                className="flex items-center gap-2"
                onClick={() => loadChatSession(session.sessionId)}
              >
                <FontAwesomeIcon
                  icon={faClock}
                  className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${
                    darkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    {session.chats[0]?.question || 'New Chat'}
                  </div>
                  <div className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatDate(session.createdAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this chat?')) {
                    deleteChatSession(session.sessionId);
                  }
                }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>

       
      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {chatHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl mb-4 ${
                  darkMode ? 'text-indigo-400/50' : 'text-blue-400/50'
                }`}>
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <h2 className={`text-2xl font-semibold mb-2 ${
                  darkMode ? 'text-white/80' : 'text-gray-800'
                }`}>
                  Welcome to AI Chat
                </h2>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                  Start a conversation by typing a message below
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((chat, index) => (
                <div key={index} className="mb-6 animate-fade-in">
                  
                  <div className="flex items-end gap-3 mb-4 justify-end">
                    <div className={`p-4 rounded-3xl max-w-[70%] shadow-lg transform transition-all duration-300 hover:shadow-xl ${
                      darkMode ? 'bg-indigo-600/80 text-white' : 'bg-blue-600/80 text-white'
                    } backdrop-blur-sm animate-slide-in-right`}>
                      <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                        {chat.question}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      darkMode ? 'bg-indigo-600/30' : 'bg-blue-600/30'
                    }`}>
                      <FontAwesomeIcon 
                        icon={faUser} 
                        className={darkMode ? 'text-indigo-400' : 'text-blue-400'} 
                      />
                    </div>
                  </div>
                  
                  
                  <div className="flex items-start gap-3 mb-4 animate-slide-in-left">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      darkMode ? 'bg-purple-600/30' : 'bg-purple-500/30'
                    }`}>
                      <FontAwesomeIcon 
                        icon={faRobot} 
                        className={darkMode ? 'text-purple-400' : 'text-purple-500'} 
                      />
                    </div>
                    <div className={`p-4 rounded-3xl max-w-[70%] shadow-lg transform transition-all duration-300 hover:shadow-xl ${
                      darkMode ? 'bg-gray-800/90 text-gray-100' : 'bg-gray-200/90 text-gray-900'
                    } backdrop-blur-sm`}>
                      <FormattedMessage content={chat.answer} darkMode={darkMode} />
                    </div>
                  </div>
                </div>
              ))}
              
            
              {isStreaming && streamingText && (
                <div className="flex items-start gap-3 mb-4 animate-fade-in">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    darkMode ? 'bg-purple-600/30' : 'bg-purple-500/30'
                  }`}>
                    <FontAwesomeIcon 
                      icon={faRobot} 
                      className={darkMode ? 'text-purple-400' : 'text-purple-500'} 
                    />
                  </div>
                  <div className={`p-4 rounded-3xl max-w-[70%] shadow-lg ${
                    darkMode ? 'bg-gray-800/90 text-gray-100' : 'bg-gray-200/90 text-gray-900'
                  } backdrop-blur-sm`}>
                    <div className={`text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      <FormattedMessage content={streamingText} darkMode={darkMode} />
                      <span className={`inline-block w-2 h-5 ml-1 rounded-sm animate-pulse ${
                        darkMode ? 'bg-purple-400' : 'bg-purple-600'
                      }`}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {typing && !isStreaming && (
            <div className="flex items-start gap-3 mb-4 animate-fade-in">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                darkMode ? 'bg-purple-600/30' : 'bg-purple-500/30'
              }`}>
                <FontAwesomeIcon 
                  icon={faRobot} 
                  className={darkMode ? 'text-purple-400' : 'text-purple-500'}
                />
              </div>
              <div className={`p-4 rounded-3xl max-w-[70%] shadow-lg ${
                darkMode ? 'bg-gray-800/90' : 'bg-gray-200/90'
              } backdrop-blur-sm flex items-center justify-center`}>
                <div className="relative w-6 h-6">
                  <div className={`absolute inset-0 rounded-full border-2 border-transparent ${
                    darkMode ? 'border-t-purple-400 border-r-purple-400' : 'border-t-purple-600 border-r-purple-600'
                  } animate-spin`}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

       
        <div className={`px-3 py-2 border-t transition-colors duration-300 ${
          darkMode 
            ? 'border-gray-700/50 bg-gray-800/80' 
            : 'border-gray-200/50 bg-white/80'
        } backdrop-blur-sm`}>
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-1">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className={`flex-1 p-3 rounded-lg focus:outline-none focus:ring-2 transition-colors duration-300 ${
                  darkMode
                    ? 'bg-gray-900/80 text-white border-gray-700/50 focus:ring-indigo-500/50 placeholder-gray-500'
                    : 'bg-white text-gray-800 border-gray-200/50 focus:ring-blue-500/50 placeholder-gray-400'
                } border`}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  darkMode
                    ? 'bg-indigo-600/90 hover:bg-indigo-700/90 text-white shadow-lg hover:shadow-indigo-500/20'
                    : 'bg-blue-600/90 hover:bg-blue-700/90 text-white shadow-lg hover:shadow-blue-500/20'
                } disabled:opacity-50 disabled:hover:bg-indigo-600/90`}
              >
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat; 