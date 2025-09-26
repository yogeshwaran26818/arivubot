import { NextResponse } from 'next/server';
import { queryEmbeddings } from '../../../lib/embeddings.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const userId = 'default-user';

    const { query, websiteId } = await request.json();
    if (!query || !websiteId) {
      return NextResponse.json({ error: 'Query and website ID are required' }, { status: 400 });
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

    const prompt = `You are a professional representative for this company. Answer the user's question based on the website content provided. Be professional, helpful, and informative.

Website Content:
${contextText}

User Question: ${query}

Provide a professional response:`;

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    return NextResponse.json({
      response: answer,
      sources: context.map(item => ({ url: item.url, score: item.score }))
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process chat query' 
    }, { status: 500 });
  }
}