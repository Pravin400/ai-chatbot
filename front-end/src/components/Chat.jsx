import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTrash, faPlus, faRobot, faUser, faClock, faSpinner, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allChatSessions, setAllChatSessions] = useState([]);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [typing, setTyping] = useState(false);
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

    setIsLoading(true);
    setTyping(true);
    try {
      setError(null);
      const response = await fetch('http://localhost:3000/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          question: message,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      const data = await response.json();
      setChatHistory(data.chatHistory);
      setMessage('');
      await fetchAllChatSessions();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
      setTyping(false);
      // Focus input after message is sent
      inputRef.current?.focus();
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
      {/* Background Effects */}
      <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${
        darkMode 
          ? 'from-indigo-900/20 to-purple-900/20 backdrop-blur-sm' 
          : 'from-blue-100/50 to-purple-100/50 backdrop-blur-sm'
      }`}></div>
      
      {/* Theme Toggle */}
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
      
      {/* Sidebar */}
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

      {/* Main Chat Area */}
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
            chatHistory.map((chat, index) => (
              <div key={index} className="mb-6 animate-fade-in">
                {/* User Message */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-indigo-600/20' : 'bg-blue-600/20'
                  }`}>
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className={darkMode ? 'text-indigo-400' : 'text-blue-400'} 
                    />
                  </div>
                  <div className={`p-4 rounded-lg max-w-[80%] shadow-lg ${
                    darkMode ? 'bg-gray-800/80' : 'bg-white/80'
                  } backdrop-blur-sm`}>
                    <p className={darkMode ? 'text-white' : 'text-gray-800'}>
                      {chat.question}
                    </p>
                  </div>
                </div>
                
                {/* AI Response */}
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-purple-600/20' : 'bg-purple-500/20'
                  }`}>
                    <FontAwesomeIcon 
                      icon={faRobot} 
                      className={darkMode ? 'text-purple-400' : 'text-purple-500'} 
                    />
                  </div>
                  <div className={`p-4 rounded-lg max-w-[80%] shadow-lg ${
                    darkMode ? 'bg-indigo-900/80' : 'bg-blue-100/80'
                  } backdrop-blur-sm`}>
                    <p className={darkMode ? 'text-white' : 'text-gray-800'}>
                      {chat.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          {typing && (
            <div className="flex items-start gap-3 mb-3 animate-fade-in">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-purple-600/20' : 'bg-purple-500/20'
              }`}>
                <FontAwesomeIcon 
                  icon={faRobot} 
                  className={darkMode ? 'text-purple-400' : 'text-purple-500'} 
                />
              </div>
              <div className={`p-4 rounded-lg max-w-[80%] shadow-lg ${
                darkMode ? 'bg-indigo-900/80' : 'bg-blue-100/80'
              } backdrop-blur-sm`}>
                <div className="flex gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    darkMode ? 'bg-white/50' : 'bg-gray-800/50'
                  } animate-bounce`}></div>
                  <div className={`w-2 h-2 rounded-full ${
                    darkMode ? 'bg-white/50' : 'bg-gray-800/50'
                  } animate-bounce delay-100`}></div>
                  <div className={`w-2 h-2 rounded-full ${
                    darkMode ? 'bg-white/50' : 'bg-gray-800/50'
                  } animate-bounce delay-200`}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t transition-colors duration-300 ${
          darkMode 
            ? 'border-gray-700/50 bg-gray-800/80' 
            : 'border-gray-200/50 bg-white/80'
        } backdrop-blur-sm`}>
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
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