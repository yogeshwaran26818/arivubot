import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb.js';

export async function POST(request) {
  try {
    const userId = 'default-user';
    const { websiteId } = await request.json();

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

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
        error: 'Website not found or not trained' 
      }, { status: 404 });
    }

    // Check if prompt exists
    const promptData = await db.collection('prompts').findOne({ userId, websiteId });
    
    if (!promptData?.prompt) {
      return NextResponse.json({ 
        error: 'Please set a prompt first before generating embed code' 
      }, { status: 400 });
    }

    // Generate unique embed ID
    const embedId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Check if embed config already exists
    let embedConfig = await db.collection('embedConfigs').findOne({ userId, websiteId });
    
    if (!embedConfig) {
      // Create new embed configuration
      embedConfig = {
        embedId,
        userId,
        websiteId,
        prompt: promptData.prompt,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('embedConfigs').insertOne(embedConfig);
    } else {
      // Update existing configuration
      await db.collection('embedConfigs').updateOne(
        { _id: embedConfig._id },
        { 
          $set: { 
            prompt: promptData.prompt,
            updatedAt: new Date()
          }
        }
      );
    }

    const embedScript = `<script src="https://arivubot-seven.vercel.app/api/widget/${embedConfig.embedId}"></script>`;

    return NextResponse.json({
      success: true,
      embedId: embedConfig.embedId,
      embedScript,
      websiteId,
      prompt: promptData.prompt
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to generate embed code' 
    }, { status: 500 });
  }
}