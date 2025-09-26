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

    const pages = await db.collection('scrapedLinks')
      .find({ originalUrl: websiteId, userId })
      .sort({ anchorUrl: 1 })
      .toArray();

    return NextResponse.json({ pages });

  } catch (error) {
    console.error('Fetch pages error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch pages' 
    }, { status: 500 });
  }
}