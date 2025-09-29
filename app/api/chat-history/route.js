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

    const chatHistory = await db.collection('chatHistory')
      .find({ userId, websiteId })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json({ messages: chatHistory });

  } catch (error) {
    console.error('Fetch chat history error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch chat history' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = 'default-user';
    const { websiteId, message, type } = await request.json();

    if (!websiteId || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const chatMessage = {
      userId,
      websiteId,
      type,
      content: message.content,
      sources: message.sources || null,
      createdAt: new Date()
    };

    await db.collection('chatHistory').insertOne(chatMessage);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Save chat message error:', error);
    return NextResponse.json({ 
      error: 'Failed to save chat message' 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userId = 'default-user';
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');

    if (!websiteId) {
      return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection('chatHistory').deleteMany({ userId, websiteId });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete chat history error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete chat history' 
    }, { status: 500 });
  }
}