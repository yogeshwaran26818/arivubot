import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export async function scrapeWebsite(originalUrl, userId) {
  try {
    const baseUrl = new URL(originalUrl);
    const response = await axios.get(originalUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const links = new Set();
    const scrapedData = [];

    const uniqueUrls = new Set();
    
    // Add the main page first
    const mainPath = baseUrl.pathname || '/';
    uniqueUrls.add(originalUrl);
    links.add({ 
      url: originalUrl, 
      anchorUrl: mainPath, 
      text: $('title').text() || 'Home' 
    });

    // Get all anchor tags
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          const fullUrl = new URL(href, baseUrl).href;
          if (new URL(fullUrl).hostname === baseUrl.hostname && !uniqueUrls.has(fullUrl)) {
            uniqueUrls.add(fullUrl);
            const anchorUrl = new URL(fullUrl).pathname;
            links.add({ url: fullUrl, anchorUrl, text });
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });

    // Scrape each unique page
    for (const link of links) {
      try {
        const pageResponse = await axios.get(link.url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const page$ = cheerio.load(pageResponse.data);
        
        // Remove script and style elements
        page$('script, style, nav, footer, header').remove();
        
        // Get main content
        const content = page$('body').text()
          .replace(/\s+/g, ' ')
          .trim();

        if (content.length > 50) { // Only add pages with substantial content
          scrapedData.push({
            userId,
            originalUrl,
            anchorUrl: link.anchorUrl,
            anchorText: link.text,
            pageContent: content,
            isEmbedded: false,
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error(`Error scraping ${link.url}:`, error.message);
      }
    }

    return scrapedData;
  } catch (error) {
    throw new Error(`Failed to scrape website: ${error.message}`);
  }
}