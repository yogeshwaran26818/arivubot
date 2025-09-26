import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb.js';
import { processAndEmbed } from '../../../lib/embeddings.js';

export async function POST(request) {
  try {
    const userId = 'default-user';

    const { websiteId } = await request.json();
    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if website exists and belongs to user
    const website = await db.collection('links').findOne({
      originalUrl: websiteId,
      userId
    });

    if (!website) {
      return NextResponse.json({ error: 'Website not found' }, { status: 404 });
    }

    if (website.isEmbedded) {
      return NextResponse.json({ 
        error: 'Website already trained',
        alreadyTrained: true 
      }, { status: 400 });
    }

    // Process and embed
    const result = await processAndEmbed(websiteId, userId);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${result.chunksProcessed} chunks`,
      chunksProcessed: result.chunksProcessed
    });

  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to train website' 
    }, { status: 500 });
  }
}