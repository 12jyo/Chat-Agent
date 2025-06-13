import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [chats, setChats] = useState({});
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadState = () => {
    try {
      const savedApiKey = localStorage.getItem('claude_api_key');
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }

      const savedChats = localStorage.getItem('claude_chats');
      let loadedChats = {};
      if (savedChats) {
        loadedChats = JSON.parse(savedChats);
      }
      setChats(loadedChats);

      const savedCurrentChat = localStorage.getItem('claude_current_chat');
      if (savedCurrentChat && loadedChats[savedCurrentChat]) {
        setCurrentChatId(savedCurrentChat);
      } else if (Object.keys(loadedChats).length > 0) {
        setCurrentChatId(Object.keys(loadedChats)[0]);
      } else {
        createNewChat();
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      setChats({});
      setCurrentChatId(null);
      createNewChat();
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('claude_chats', JSON.stringify(chats));
      if (currentChatId) {
        localStorage.setItem('claude_current_chat', currentChatId);
      } else {
        localStorage.removeItem('claude_current_chat');
      }
    } catch (error) {
      console.error('Error saving chats to localStorage:', error);
    }
  }, [chats, currentChatId]);

  const saveApiKey = useCallback((key) => {
    setApiKey(key);
    localStorage.setItem('claude_api_key', key);
  }, []);

  const deleteApiKey = useCallback(() => {
    setApiKey('');
    localStorage.removeItem('claude_api_key');

    clearAllChats();
  }, []);

  const createNewChat = useCallback(() => {
    const chatId = 'chat_' + Date.now();
    const chatTitle = 'New Chat';

    const newChat = {
      id: chatId,
      title: chatTitle,
      messages: [],
      createdAt: new Date().toISOString()
    };

    setChats(prevChats => ({ ...prevChats, [chatId]: newChat }));
    setCurrentChatId(chatId);
  }, []);

  const switchToChat = useCallback((chatId) => {
    setCurrentChatId(chatId);
  }, []);

  const deleteChat = useCallback((chatId) => {
    if (Object.keys(chats).length <= 1) {
      alert('Cannot delete the last chat');
      return;
    }

    setChats(prevChats => {
      const updatedChats = { ...prevChats };
      delete updatedChats[chatId];

      let newCurrentChatId = currentChatId;
      if (newCurrentChatId === chatId) {
        const remainingChatIds = Object.keys(updatedChats);
        newCurrentChatId = remainingChatIds[0];
      }
      setCurrentChatId(newCurrentChatId);
      return updatedChats;
    });
  }, [chats, currentChatId]);

  const clearAllChats = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all chats? This cannot be undone.')) {
      setChats({});
      setCurrentChatId(null);
      localStorage.removeItem('claude_chats');
      localStorage.removeItem('claude_current_chat');
      createNewChat();
    }
  }, [createNewChat]);

  const addMessage = useCallback((role, content, chatIdToUpdate = currentChatId) => {
    const message = { role, content, timestamp: new Date().toISOString() };

    setChats(prevChats => {
      const chatToUpdate = prevChats[chatIdToUpdate];
      if (!chatToUpdate) return prevChats;

      const updatedMessages = [...chatToUpdate.messages, message];
      const updatedChat = {
        ...chatToUpdate,
        messages: updatedMessages,
        title: chatToUpdate.messages.length === 0 && role === 'user'
          ? (content.substring(0, 50) + (content.length > 50 ? '...' : ''))
          : chatToUpdate.title
      };
      return { ...prevChats, [chatIdToUpdate]: updatedChat };
    });
  }, [currentChatId]);

  const callClaudeAPI = useCallback(async (currentMessages) => {
    const messagesForApi = currentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // const response = await fetch('http://localhost:3001/api/claude', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     messages: messagesForApi,
    //     apiKey: apiKey, 
    //     model: 'claude-3-5-sonnet-20241022' 
    //   })
    // });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: messages,
        system: "You are Claude, a helpful AI assistant created by Anthropic."
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || error.message || 'API request failed');
    }

    const data = await response.json();
    return data.content[0].text;
  }, [apiKey]);

  const sendMessage = useCallback(async (messageText) => {
    if (!apiKey) {
      alert('Please enter your API key first');
      return;
    }
    if (!messageText.trim() || isLoading) return;

    setIsLoading(true);

    const userMessage = { role: 'user', content: messageText.trim(), timestamp: new Date().toISOString() };

    const currentChatBeforeUpdate = chats[currentChatId];

    setChats(prevChats => {
      const chatToUpdate = prevChats[currentChatId];
      if (!chatToUpdate) return prevChats;
      const updatedMessages = [...chatToUpdate.messages, userMessage];
      const updatedChat = {
        ...chatToUpdate,
        messages: updatedMessages,
        title: chatToUpdate.messages.length === 0
          ? (messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''))
          : chatToUpdate.title
      };
      return { ...prevChats, [currentChatId]: updatedChat };
    });

    try {
      const messagesForClaude = [...currentChatBeforeUpdate.messages, userMessage];
      const response = await callClaudeAPI(messagesForClaude);
      addMessage('assistant', response);
    } catch (error) {
      console.error('API Error:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, isLoading, chats, currentChatId, addMessage, callClaudeAPI]);

  const sortedChats = Object.values(chats).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const currentChatMessages = currentChatId ? chats[currentChatId]?.messages : [];

  const MessageDisplay = React.memo(({ message }) => {
    return (
      <div className={`message ${message.role}`}>
        <div className="message-content">
          {message.content}
        </div>
      </div>
    );
  });

  const ApiKeyConfig = ({ saveApiKey }) => {
    const [inputKey, setInputKey] = useState('');

    const handleSave = () => {
      if (inputKey.trim()) {
        saveApiKey(inputKey.trim());
        setInputKey('');
      }
    };

    return (
      <div className="api-config">
        <div>Enter your Claude API Key to get started:</div>
        <input
          type="password"
          className="api-input"
          placeholder="sk-ant-api03-..."
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
        />
        <button className="save-api-btn" onClick={handleSave}>Save</button>
      </div>
    );
  };

  const ChatSidebar = React.memo(({ chats, currentChatId, createNewChat, switchToChat, deleteChat, clearAllChats, deleteApiKey }) => {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewChat}>+ New Chat</button>
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={clearAllChats}
              style={{ width: '100%', padding: '8px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginBottom: '5px' }}
            >
              Clear All Chats
            </button>
            <button
              onClick={deleteApiKey}
              style={{ width: '100%', padding: '8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              Delete API Key
            </button>
          </div>
        </div>
        <div className="chat-list">
          {chats.map(chat => (
            <div key={chat.id} style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
              <button
                className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => switchToChat(chat.id)}
                style={{ flex: 1, marginRight: '5px' }}
              >
                {chat.title}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                style={{ width: '24px', height: '24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
                onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  });

  const ChatWindow = ({ apiKey, saveApiKey, messages, isLoading, sendMessage }) => {
    const [messageInput, setMessageInput] = useState('');
    const chatAreaRef = useRef(null);

    useEffect(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }, [messages, isLoading]);

    const handleSendMessage = () => {
      sendMessage(messageInput);
      setMessageInput('');
    };

    const handleKeyPress = (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    };

    return (
      <div className="main-content">
        {/* Conditionally render API Key configuration section if no key is set */}
        {!apiKey && <ApiKeyConfig saveApiKey={saveApiKey} />}

        <div className="main-header">
          <h2>Claude powered chatbot</h2>
        </div>

        <div className="chat-area" ref={chatAreaRef}>
          {/* Display empty state message if no messages and not currently loading */}
          {messages.length === 0 && !isLoading && (
            <div className="empty-state">
              <h3>How can I help you today?</h3>
              <p>Start a new conversation by typing a message below.</p>
            </div>
          )}

          {/* Map through messages and render each using the MessageDisplay component */}
          {messages.map((message, index) => (
            <MessageDisplay key={index} message={message} />
          ))}

          {/* Display a loading indicator when the assistant is processing a response */}
          {isLoading && (
            <div className="loading">
              Claude is thinking...
            </div>
          )}
        </div>

        <div className="input-area">
          <div className="input-container">
            <textarea
              className="message-input"
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight) + 'px';
              }}
            ></textarea>
            <button
              id="sendBtn"
              className="send-btn"
              onClick={handleSendMessage}
              disabled={isLoading || !messageInput.trim()}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <ChatSidebar
        chats={sortedChats}
        currentChatId={currentChatId}
        createNewChat={createNewChat}
        switchToChat={switchToChat}
        deleteChat={deleteChat}
        clearAllChats={clearAllChats}
        deleteApiKey={deleteApiKey}
      />
      <ChatWindow
        apiKey={apiKey}
        saveApiKey={saveApiKey}
        messages={currentChatMessages}
        isLoading={isLoading}
        sendMessage={sendMessage}
      />
    </div>
  );
}

export default App; 