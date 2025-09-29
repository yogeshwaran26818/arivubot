'use client';

import { useState, useEffect } from 'react';

export default function Chat() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  useEffect(() => {
    fetchTrainedWebsites();
  }, []);

  useEffect(() => {
    if (selectedWebsite) {
      loadChatHistory(selectedWebsite);
      loadPrompt(selectedWebsite);
    }
  }, [selectedWebsite]);

  const fetchTrainedWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      if (response.ok) {
        const data = await response.json();
        const trained = data.websites?.filter(w => w.isEmbedded) || [];
        setWebsites(trained);
        if (trained.length > 0 && !selectedWebsite) {
          setSelectedWebsite(trained[0].originalUrl);
        }
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    }
  };

  const loadChatHistory = async (websiteId) => {
    try {
      const response = await fetch(`/api/chat-history?websiteId=${encodeURIComponent(websiteId)}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages.map(msg => ({
          type: msg.type,
          content: msg.content,
          sources: msg.sources
        })));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadPrompt = async (websiteId) => {
    try {
      const response = await fetch(`/api/prompts?websiteId=${encodeURIComponent(websiteId)}`);
      if (response.ok) {
        const data = await response.json();
        setPrompt(data.prompt);
        setHasPrompt(data.hasPrompt);
      }
    } catch (error) {
      console.error('Failed to load prompt:', error);
    }
  };

  const savePrompt = async () => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: selectedWebsite,
          prompt
        })
      });
      if (response.ok) {
        setHasPrompt(true);
        setShowPromptModal(false);
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const saveChatMessage = async (message, type) => {
    try {
      await fetch('/api/chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: selectedWebsite,
          message,
          type
        })
      });
    } catch (error) {
      console.error('Failed to save chat message:', error);
    }
  };

  const deleteChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat-history?websiteId=${encodeURIComponent(selectedWebsite)}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete chat history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !selectedWebsite || !hasPrompt) return;

    const userMessage = { type: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(userMessage, 'user');
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(), 
          websiteId: selectedWebsite 
        })
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage = { 
          type: 'bot', 
          content: data.response,
          sources: data.sources 
        };
        setMessages(prev => [...prev, botMessage]);
        await saveChatMessage(botMessage, 'bot');
      } else {
        const errorMessage = { 
          type: 'bot', 
          content: `Error: ${data.error}` 
        };
        setMessages(prev => [...prev, errorMessage]);
        await saveChatMessage(errorMessage, 'bot');
      }
    } catch (error) {
      const errorMessage = { 
        type: 'bot', 
        content: 'Failed to get response. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveChatMessage(errorMessage, 'bot');
    } finally {
      setLoading(false);
    }
  };

  if (websites.length === 0) {
    return (
      <div className="card">
        <h2>Chat</h2>
        <p>No trained websites available. Please upload and train a website first.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Chat with Website</h2>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
        <select 
          value={selectedWebsite} 
          onChange={(e) => setSelectedWebsite(e.target.value)}
          className="input"
          style={{ flex: 1 }}
        >
          {websites.map(website => (
            <option key={website._id} value={website.originalUrl}>
              {website.originalUrl}
            </option>
          ))}
        </select>
        <button 
          onClick={() => setShowPromptModal(true)}
          className="button"
          style={{ background: hasPrompt ? '#28a745' : '#ffc107', padding: '8px 16px' }}
        >
          {hasPrompt ? 'Edit Prompt' : 'Set Prompt'}
        </button>
        <button 
          onClick={deleteChatHistory}
          className="button"
          style={{ background: '#dc3545', padding: '8px 16px' }}
        >
          Delete Chat
        </button>
        {hasPrompt && (
          <button 
            onClick={() => setShowEmbedModal(true)}
            className="button"
            style={{ background: '#17a2b8', padding: '8px 16px' }}
          >
            Get Embed Code
          </button>
        )}
      </div>

      <div className="chat-container">
        {messages.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center' }}>
            Start a conversation about the selected website...
          </p>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div>{message.content}</div>
              {message.sources && message.sources.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
                  Sources: {message.sources.map(s => s.url).join(', ')}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="message bot">
            <span className="loading"></span> Thinking...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          className="textarea"
          placeholder="Ask a question about the website..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
        />
        <button 
          type="submit" 
          className="button"
          disabled={loading || !query.trim() || !hasPrompt}
        >
          {!hasPrompt ? 'Set Prompt First' : 'Send'}
        </button>
      </form>

      {showPromptModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '20px', borderRadius: '8px',
            width: '90%', maxWidth: '500px'
          }}>
            <h3>Set Chat Prompt</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your custom prompt for the AI assistant..."
              rows={6}
              style={{
                width: '100%', padding: '10px', border: '1px solid #ddd',
                borderRadius: '4px', marginBottom: '10px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowPromptModal(false)}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Cancel
              </button>
              <button 
                onClick={savePrompt}
                disabled={!prompt.trim()}
                style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmbedModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '20px', borderRadius: '8px',
            width: '90%', maxWidth: '600px'
          }}>
            <h3>Embed Chatbot Widget for {selectedWebsite}</h3>
            <p>Copy this code and paste it into your website where you want the chatbot to appear:</p>
            <div style={{
              background: '#f4f4f4', padding: '15px', borderRadius: '5px',
              fontFamily: 'monospace', fontSize: '14px', marginBottom: '15px',
              border: '1px solid #ddd', wordBreak: 'break-all'
            }}>
              {`<script src="https://arivubot-seven.vercel.app/api/widget/${encodeURIComponent(selectedWebsite)}"></script>`}
            </div>
            <div style={{
              background: '#e7f3ff', padding: '10px', borderRadius: '4px',
              fontSize: '12px', marginBottom: '15px'
            }}>
              <strong>Note:</strong> This chatbot is specifically configured for {selectedWebsite} and will only respond with content from this website.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowEmbedModal(false)}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Close
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`<script src="https://arivubot-seven.vercel.app/api/widget/${encodeURIComponent(selectedWebsite)}"></script>`);
                  alert('Embed code copied to clipboard!');
                }}
                style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}