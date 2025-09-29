import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb.js';

export async function GET(request) {
  try {
    const userId = 'default-user';
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const promptData = await db.collection('prompts').findOne({ userId, websiteId });

    return NextResponse.json({ 
      prompt: promptData?.prompt || '',
      hasPrompt: !!promptData?.prompt 
    });

  } catch (error) {
    console.error('Get prompt error:', error);
    return NextResponse.json({ 
      error: 'Failed to get prompt' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = 'default-user';
    const { websiteId, prompt } = await request.json();

    if (!websiteId || !prompt) {
      return NextResponse.json({ error: 'Website ID and prompt are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection('prompts').updateOne(
      { userId, websiteId },
      { $set: { userId, websiteId, prompt, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Save prompt error:', error);
    return NextResponse.json({ 
      error: 'Failed to save prompt' 
    }, { status: 500 });
  }
}