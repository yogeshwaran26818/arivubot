import { NextResponse } from 'next/server';
import { queryEmbeddings } from '../../../lib/embeddings.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import clientPromise from '../../../lib/mongodb.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const userId = 'default-user';

    const { query, websiteId } = await request.json();
    if (!query || !websiteId) {
      return NextResponse.json({ error: 'Query and website ID are required' }, { status: 400 });
    }

    // Get stored prompt
    const client = await clientPromise;
    const db = client.db();
    const promptData = await db.collection('prompts').findOne({ userId, websiteId });
    
    if (!promptData?.prompt) {
      return NextResponse.json({ 
        error: 'Please set a prompt first before chatting' 
      }, { status: 400 });
    }

    // Get relevant context from embeddings
    const context = await queryEmbeddings(query, websiteId, userId);
    
    if (context.length === 0) {
      return NextResponse.json({ 
        response: "I couldn't find relevant information about your query in the website content. Please make sure the website has been trained first." 
      });
    }

    // Prepare context for the model
    const contextText = context
      .map(item => `Content from ${item.url}: ${item.text}`)
      .join('\n\n');

    const fullPrompt = `${promptData.prompt}

Website Content:
${contextText}

User Question: ${query}`;

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const answer = response.text();

    return NextResponse.json({
      response: answer,
      sources: context.map(item => ({ url: item.url, score: item.score }))
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to process chat query' 
    }, { status: 500 });
  }
}