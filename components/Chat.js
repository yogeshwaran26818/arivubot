'use client';

import { useState, useEffect } from 'react';

export default function Chat() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrainedWebsites();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || !selectedWebsite) return;

    const userMessage = { type: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
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
      } else {
        const errorMessage = { 
          type: 'bot', 
          content: `Error: ${data.error}` 
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = { 
        type: 'bot', 
        content: 'Failed to get response. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
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
      
      <select 
        value={selectedWebsite} 
        onChange={(e) => setSelectedWebsite(e.target.value)}
        className="input"
      >
        {websites.map(website => (
          <option key={website._id} value={website.originalUrl}>
            {website.originalUrl}
          </option>
        ))}
      </select>

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
          disabled={loading || !query.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}