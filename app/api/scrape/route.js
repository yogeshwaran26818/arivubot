import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb.js';
import { scrapeWebsite } from '../../../lib/scraper.js';

export async function POST(request) {
  try {
    const userId = 'default-user';

    const { url, reScrape = false } = await request.json();
    console.log('Received scrape request for URL:', url);
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if URL already exists
    const existingLink = await db.collection('links').findOne({
      userId,
      originalUrl: url
    });

    if (existingLink && !reScrape) {
      return NextResponse.json({
        success: false,
        alreadyScraped: true,
        message: 'Website already scraped and stored',
        anchorCount: existingLink.anchorCount
      });
    }

    // If re-scraping, delete existing data
    if (existingLink && reScrape) {
      await db.collection('scrapedLinks').deleteMany({ originalUrl: url, userId });
      await db.collection('websiteData').deleteMany({ websiteId: url });
      await db.collection('links').deleteOne({ originalUrl: url, userId });
    }

    // Scrape the website
    const scrapedData = await scrapeWebsite(url, userId);
    
    if (scrapedData.length === 0) {
      return NextResponse.json({ error: 'No content found to scrape' }, { status: 400 });
    }

    // Insert scraped links
    await db.collection('scrapedLinks').insertMany(scrapedData);

    // Insert main link record
    await db.collection('links').insertOne({
      userId,
      originalUrl: url,
      anchorCount: scrapedData.length,
      isEmbedded: false,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully scraped ${scrapedData.length} pages`,
      anchorCount: scrapedData.length
    });

  } catch (error) {
    console.error('Scrape error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      url: request.url
    });
    return NextResponse.json({ 
      error: error.message || 'Failed to scrape website' 
    }, { status: 500 });
  }
}