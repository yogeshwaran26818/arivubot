'use client';

import { useState } from 'react';

export default function WebsiteUpload({ onUploadSuccess }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setUrl('');
        onUploadSuccess?.();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to upload website');
    } finally {
      setLoading(false);
    }
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
    </div>
  );
}