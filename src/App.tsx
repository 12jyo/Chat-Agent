import React, { useState, useEffect, useRef, useCallback, type ChangeEvent, type KeyboardEvent } from 'react';
import './App.css';

// Types
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

type Chats = Record<string, Chat>;

// Message display component
interface MessageDisplayProps {
  message: Message;
}

const MessageDisplay: React.FC<MessageDisplayProps> = React.memo(({ message }) => (
  <div className={`message ${message.role}`}>
    <div className="message-content">{message.content}</div>
  </div>
));

// API Key Configuration
interface ApiKeyConfigProps {
  saveApiKey: (key: string) => void;
}

const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ saveApiKey }) => {
  const [inputKey, setInputKey] = useState<string>('');

  const handleSave = () => {
    const trimmed = inputKey.trim();
    if (trimmed) {
      saveApiKey(trimmed);
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
        onChange={(e: ChangeEvent<HTMLInputElement>) => setInputKey(e.target.value)}
      />
      <button className="save-api-btn" onClick={handleSave}>Save</button>
    </div>
  );
};

// Sidebar component
interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  createNewChat: () => void;
  switchToChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  clearAllChats: () => void;
  deleteApiKey: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = React.memo(({
  chats,
  currentChatId,
  createNewChat,
  switchToChat,
  deleteChat,
  clearAllChats,
  deleteApiKey
}) => (
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
            onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
            style={{ width: '24px', height: '24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
            onMouseOver={e => (e.currentTarget.style.background = '#dc2626')}
            onMouseOut={e => (e.currentTarget.style.background = '#ef4444')}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  </div>
));

// Main chat window
interface ChatWindowProps {
  apiKey: string;
  saveApiKey: (key: string) => void;
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ apiKey, saveApiKey, messages, isLoading, sendMessage }) => {
  const [messageInput, setMessageInput] = useState<string>('');
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="main-content">
      {!apiKey && <ApiKeyConfig saveApiKey={saveApiKey} />}

      <div className="main-header"><h2>Claude powered chatbot</h2></div>

      <div className="chat-area" ref={chatAreaRef}>
        {messages.length === 0 && !isLoading && (
          <div className="empty-state">
            <h3>How can I help you today?</h3>
            <p>Start a new conversation by typing a message below.</p>
          </div>
        )}
        {messages.map((msg, idx) => <MessageDisplay key={idx} message={msg} />)}
        {isLoading && <div className="loading">Claude is thinking...</div>}
      </div>

      <div className="input-area">
        <div className="input-container">
          <textarea
            className="message-input"
            placeholder="Type your message..."
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            rows={1}
            onInput={e => {
              const target = e.currentTarget;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
          <button
            id="sendBtn"
            className="send-btn"
            onClick={handleSend}
            disabled={isLoading || !messageInput.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [chats, setChats] = useState<Chats>({});
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const createNewChat = useCallback(() => {
    const id = `chat_${Date.now()}`;
    const newChat: Chat = { id, title: 'New Chat', messages: [], createdAt: new Date().toISOString() };
    setChats(prev => ({ ...prev, [id]: newChat }));
    setCurrentChatId(id);
  }, []);

  const loadState = useCallback(() => {
    try {
      const savedKey = localStorage.getItem('claude_api_key');
      if (savedKey) setApiKey(savedKey);

      const saved = localStorage.getItem('claude_chats');
      const loaded: Chats = saved ? JSON.parse(saved) : {};
      setChats(loaded);

      const savedCurrent = localStorage.getItem('claude_current_chat');
      if (savedCurrent && loaded[savedCurrent]) {
        setCurrentChatId(savedCurrent);
      } else if (Object.keys(loaded).length > 0) {
        setCurrentChatId(Object.keys(loaded)[0]);
      } else {
        createNewChat();
      }
    } catch (err) {
      console.error('Error loading state:', err);
      setChats({});
      setCurrentChatId(null);
      createNewChat();
    }
  }, [createNewChat]);

  useEffect(() => { loadState(); }, [loadState]);

  useEffect(() => {
    try {
      localStorage.setItem('claude_chats', JSON.stringify(chats));
      if (currentChatId) {
        localStorage.setItem('claude_current_chat', currentChatId);
      } else {
        localStorage.removeItem('claude_current_chat');
      }
    } catch (err) {
      console.error('Error saving chats:', err);
    }
  }, [chats, currentChatId]);

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    localStorage.setItem('claude_api_key', key);
  }, []);

  const deleteApiKey = useCallback(() => {
    setApiKey('');
    localStorage.removeItem('claude_api_key');
    clearAllChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAllChats = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all chats? This cannot be undone.')) {
      setChats({});
      setCurrentChatId(null);
      localStorage.removeItem('claude_chats');
      localStorage.removeItem('claude_current_chat');
      createNewChat();
    }
  }, [createNewChat]);

  const switchToChat = useCallback((id: string) => { setCurrentChatId(id); }, []);

  const deleteChat = useCallback((id: string) => {
    if (Object.keys(chats).length <= 1) { alert('Cannot delete the last chat'); return; }
    setChats(prev => {
      const updated = { ...prev };
      delete updated[id];
      if (currentChatId === id) {
        const remaining = Object.keys(updated);
        setCurrentChatId(remaining[0]);
      }
      return updated;
    });
  }, [chats, currentChatId]);

  const addMessage = useCallback((role: Message['role'], content: string, chatId = currentChatId) => {
    if (!chatId) return;
    const msg: Message = { role, content, timestamp: new Date().toISOString() };
    setChats(prev => {
      const chat = prev[chatId];
      if (!chat) return prev;
      const updatedMsgs = [...chat.messages, msg];
      const updatedTitle = chat.messages.length === 0 && role === 'user'
        ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
        : chat.title;
      return {
        ...prev,
        [chatId]: { ...chat, messages: updatedMsgs, title: updatedTitle }
      };
    });
  }, [currentChatId]);

  const callClaudeAPI = useCallback(async (currentMessages: Message[]): Promise<string> => {
    const response = await fetch('https://qvpvs1nohh.execute-api.ap-south-1.amazonaws.com/claude-seq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
        apiKey: apiKey,
        model: 'claude-3-5-sonnet-20241022'
      })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API request failed');
    }
    const data = await response.json();
    return data.content[0].text;
  }, [apiKey]);

  const sendMessage = useCallback(async (text: string) => {
    if (!apiKey) { alert('Please enter your API key first'); return; }
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setIsLoading(true);
    addMessage('user', trimmed);
    try {
      const chat = chats[currentChatId!];
      const reply = await callClaudeAPI([...chat.messages, { role: 'user', content: trimmed, timestamp: new Date().toISOString() }]);
      addMessage('assistant', reply);
    } catch (err) {
      console.error('API Error:', err);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, isLoading, chats, currentChatId, addMessage, callClaudeAPI]);

  const sortedChats = Object.values(chats).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const currentMessages = currentChatId ? chats[currentChatId]?.messages || [] : [];

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
        messages={currentMessages}
        isLoading={isLoading}
        sendMessage={sendMessage}
      />
    </div>
  );
};

export default App;