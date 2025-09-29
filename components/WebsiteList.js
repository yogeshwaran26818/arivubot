'use client';

import { useState, useEffect } from 'react';

export default function WebsiteList({ refreshTrigger }) {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainingStates, setTrainingStates] = useState({});
  const [expandedWebsite, setExpandedWebsite] = useState(null);
  const [scrapedPages, setScrapedPages] = useState({});

  const fetchWebsites = async () => {
    try {
      const response = await fetch('/api/websites');
      if (response.ok) {
        const data = await response.json();
        setWebsites(data.websites || []);
      }
    } catch (error) {
      console.error('Failed to fetch websites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, [refreshTrigger]);

  const fetchScrapedPages = async (websiteId) => {
    try {
      const response = await fetch(`/api/pages?websiteId=${websiteId}`);
      if (response.ok) {
        const data = await response.json();
        setScrapedPages(prev => ({ ...prev, [websiteId]: data.pages }));
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    }
  };

  const toggleExpanded = (websiteId) => {
    if (expandedWebsite === websiteId) {
      setExpandedWebsite(null);
    } else {
      setExpandedWebsite(websiteId);
      if (!scrapedPages[websiteId]) {
        fetchScrapedPages(websiteId);
      }
    }
  };

  const handleTrain = async (websiteId) => {
    setTrainingStates(prev => ({ ...prev, [websiteId]: 'training' }));

    try {
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId })
      });

      const data = await response.json();

      if (response.ok) {
        setTrainingStates(prev => ({ ...prev, [websiteId]: 'success' }));
        fetchWebsites(); // Refresh to show updated status
      } else {
        if (data.alreadyTrained) {
          setTrainingStates(prev => ({ ...prev, [websiteId]: 'already-trained' }));
        } else {
          setTrainingStates(prev => ({ ...prev, [websiteId]: 'error' }));
        }
      }
    } catch (error) {
      setTrainingStates(prev => ({ ...prev, [websiteId]: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading"></div> Loading websites...
      </div>
    );
  }

  if (websites.length === 0) {
    return (
      <div className="card">
        <p>No websites uploaded yet. Upload a website to get started!</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Your Websites</h2>
      {websites.map((website) => (
        <div key={website._id}>
          <div className="website-item">
            <div className="website-info">
              <h3>{website.originalUrl}</h3>
              <p>
                {website.anchorCount} pages • 
                {website.isEmbedded ? ' ✅ Trained' : ' ⏳ Not trained'}
              </p>
            </div>
            <div className="website-actions">
              <button
                className="button small"
                onClick={() => toggleExpanded(website.originalUrl)}
              >
                {expandedWebsite === website.originalUrl ? 'Hide Pages' : 'View Pages'}
              </button>
              <button
                className="button small"
                onClick={() => handleTrain(website.originalUrl)}
                disabled={trainingStates[website.originalUrl] === 'training'}
              >
                {trainingStates[website.originalUrl] === 'training' ? (
                  <span className="loading"></span>
                ) : (
                  website.isEmbedded ? 'Re-train' : 'Train'
                )}
              </button>
              {trainingStates[website.originalUrl] === 'success' && (
                <span style={{ color: 'green' }}>✅ Trained!</span>
              )}
              {trainingStates[website.originalUrl] === 'already-trained' && (
                <span style={{ color: 'orange' }}>Already trained</span>
              )}
              {trainingStates[website.originalUrl] === 'error' && (
                <span style={{ color: 'red' }}>❌ Error</span>
              )}
            </div>
          </div>
          {expandedWebsite === website.originalUrl && (
            <div style={{ marginLeft: '20px', marginTop: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
              <h4>Scraped Pages:</h4>
              {scrapedPages[website.originalUrl] ? (
                <ul style={{ marginTop: '8px' }}>
                  {scrapedPages[website.originalUrl].map((page, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      <strong>{page.anchorUrl}</strong> - {page.anchorText}
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Content length: {page.pageContent?.length || 0} characters
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="loading" style={{ marginTop: '8px' }}></div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}