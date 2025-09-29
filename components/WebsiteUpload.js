'use client';

import { useState } from 'react';

export default function WebsiteUpload({ onUploadSuccess }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showReScrape, setShowReScrape] = useState(false);
  const [existingData, setExistingData] = useState(null);

  const handleSubmit = async (e, reScrape = false) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setMessage('');
    setShowReScrape(false);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), reScrape })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setUrl('');
        setExistingData(null);
        onUploadSuccess?.();
      } else {
        if (data.alreadyScraped && !reScrape) {
          setMessage(`⚠️ Website already scraped and stored (${data.anchorCount} pages)`);
          setShowReScrape(true);
          setExistingData(data);
        } else {
          setMessage(`❌ ${data.error}`);
        }
      }
    } catch (error) {
      setMessage('❌ Failed to upload website');
    } finally {
      setLoading(false);
    }
  };

  const handleReScrape = (e) => {
    handleSubmit(e, true);
  };

  return (
    <div className="card">
      <h2>Upload Website</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          className="input"
          placeholder="Enter website URL (e.g., https://example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button 
          type="submit" 
          className="button"
          disabled={loading}
        >
          {loading ? <span className="loading"></span> : 'Upload & Scrape'}
        </button>
      </form>
      {message && (
        <div className={message.includes('✅') ? 'success' : 'error'}>
          {message}
        </div>
      )}
      {showReScrape && (
        <div style={{ marginTop: '10px' }}>
          <button 
            className="button small"
            onClick={handleReScrape}
            disabled={loading}
            style={{ background: '#ff6b35' }}
          >
            Re-scrape Website
          </button>
        </div>
      )}
    </div>
  );
}