import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb.js';

export async function GET() {
  try {
    const userId = 'default-user';

    const client = await clientPromise;
    const db = client.db();

    const websites = await db.collection('links')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ websites });

  } catch (error) {
    console.error('Fetch websites error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch websites' 
    }, { status: 500 });
  }
}