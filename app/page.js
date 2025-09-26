'use client';

import { useState } from 'react';
import WebsiteUpload from '../components/WebsiteUpload';
import WebsiteList from '../components/WebsiteList';
import Chat from '../components/Chat';

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('websites');
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '20px' }}>
        <h1>Website RAG Chatbot</h1>
      </header>

      <nav style={{ marginBottom: '20px' }}>
        <button 
          className={`button ${activeTab === 'upload' ? '' : 'button-secondary'}`}
          onClick={() => setActiveTab('upload')}
          style={{ marginRight: '10px' }}
        >
          Upload Website
        </button>
        <button 
          className={`button ${activeTab === 'websites' ? '' : 'button-secondary'}`}
          onClick={() => setActiveTab('websites')}
          style={{ marginRight: '10px' }}
        >
          My Websites
        </button>
        <button 
          className={`button ${activeTab === 'chat' ? '' : 'button-secondary'}`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
      </nav>

      {activeTab === 'upload' && (
        <WebsiteUpload onUploadSuccess={handleUploadSuccess} />
      )}

      {activeTab === 'websites' && (
        <WebsiteList refreshTrigger={refreshTrigger} />
      )}

      {activeTab === 'chat' && (
        <Chat />
      )}
    </div>
  );
}