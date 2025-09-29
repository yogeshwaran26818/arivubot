import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb.js';

export async function POST() {
  try {
    const userId = 'default-user';
    const websiteId = 'https://sspackcare.com/';
    
    const client = await clientPromise;
    const db = client.db();

    // Check if website exists and is trained
    const website = await db.collection('links').findOne({
      originalUrl: websiteId,
      userId,
      isEmbedded: true
    });

    if (!website) {
      return NextResponse.json({ 
        error: 'sspackcare.com not found or not trained' 
      }, { status: 404 });
    }

    // Check if prompt exists, if not create a default one
    let promptData = await db.collection('prompts').findOne({ userId, websiteId });
    
    if (!promptData) {
      // Create default prompt
      const defaultPrompt = "You are a helpful customer service representative for SSPackCare. Answer questions about our packaging products and services based on the website content provided. Be professional and informative.";
      
      await db.collection('prompts').insertOne({
        userId,
        websiteId,
        prompt: defaultPrompt,
        createdAt: new Date()
      });
      
      promptData = { prompt: defaultPrompt };
    }

    // Generate unique embed ID
    const embedId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Create embed configuration
    const embedConfig = {
      embedId,
      userId,
      websiteId,
      prompt: promptData.prompt,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('embedConfigs').insertOne(embedConfig);

    const embedScript = `<script src="https://arivubot-seven.vercel.app/api/widget/${embedId}"></script>`;

    return NextResponse.json({
      success: true,
      embedId,
      embedScript,
      websiteId,
      prompt: promptData.prompt
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to setup embed configuration' 
    }, { status: 500 });
  }
}