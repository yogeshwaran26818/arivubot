import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { index } from './pinecone.js';
import clientPromise from './mongodb.js';

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  modelName: 'text-embedding-004'
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  separators: ["\n\n", ". ", " "]
});

export async function processAndEmbed(websiteId, userId) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const scrapedPages = await db.collection('scrapedLinks')
      .find({ originalUrl: websiteId, userId, isEmbedded: false })
      .toArray();

    if (scrapedPages.length === 0) {
      throw new Error('No pages found to process');
    }

    const allChunks = [];
    
    for (const page of scrapedPages) {
      // Clean content by removing markdown formatting
      const cleanContent = page.pageContent
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
        .replace(/\* /g, '') // Remove bullet points
        .replace(/#{1,6} /g, '') // Remove headers
        .replace(/\n{2,}/g, '\n') // Replace multiple newlines with single
        .trim();
      
      const docs = await splitter.createDocuments([cleanContent]);
      
      for (let i = 0; i < docs.length; i++) {
        const chunk = docs[i];
        const chunkId = `${page._id}_${i}`;
        
        const embedding = await embeddings.embedQuery(chunk.pageContent);
        
        await db.collection('websiteData').insertOne({
          websiteId,
          url: page.anchorUrl,
          text: chunk.pageContent,
          content: chunk.pageContent,
          createdAt: new Date()
        });

        allChunks.push({
          id: chunkId,
          values: embedding,
          metadata: {
            websiteId,
            url: page.anchorUrl,
            text: chunk.pageContent,
            userId
          }
        });
      }

      await db.collection('scrapedLinks').updateOne(
        { _id: page._id },
        { $set: { isEmbedded: true } }
      );
    }

    if (allChunks.length > 0) {
      await index.upsert(allChunks);
    }

    await db.collection('links').updateOne(
      { originalUrl: websiteId, userId },
      { $set: { isEmbedded: true } }
    );

    return { success: true, chunksProcessed: allChunks.length };
  } catch (error) {
    throw new Error(`Embedding failed: ${error.message}`);
  }
}

export async function queryEmbeddings(query, websiteId, userId) {
  try {
    const queryEmbedding = await embeddings.embedQuery(query);
    
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: 5,
      filter: { websiteId, userId },
      includeMetadata: true
    });

    return searchResults.matches.map(match => ({
      text: match.metadata.text,
      url: match.metadata.url,
      score: match.score
    }));
  } catch (error) {
    throw new Error(`Query failed: ${error.message}`);
  }
}