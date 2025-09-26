# Website RAG Chatbot

A Next.js application that allows users to upload websites, scrape their content, create embeddings, and chat with the website content using AI.

## Features

- **Website Upload & Scraping**: Upload any website URL and automatically scrape all pages
- **Content Chunking**: Split website content into chunks for better processing
- **Vector Embeddings**: Create embeddings using Google Gemini and store in Pinecone
- **RAG Chat**: Chat with website content using retrieval-augmented generation
- **User Authentication**: Secure authentication with Clerk
- **Duplicate Prevention**: Prevents uploading the same website twice

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   All required environment variables are already set in `.env`:
   - MongoDB connection
   - Clerk authentication keys
   - Google Gemini API key
   - Pinecone API key and index name

3. **Database Setup**
   The application uses MongoDB with these collections:
   - `links`: Tracks uploaded websites
   - `scrapedLinks`: Stores scraped page content
   - `websiteData`: Stores chunked content for embeddings

4. **Pinecone Setup**
   Make sure your Pinecone index `pineproj` is created with:
   - Dimension: 768 (for text-embedding-004)
   - Metric: cosine

5. **Run the Application**
   ```bash
   npm run dev
   ```

## Usage

1. **Sign In**: Use Clerk authentication to sign in
2. **Upload Website**: Enter a website URL to scrape all pages
3. **Train Website**: Click "Train" to create embeddings and store in Pinecone
4. **Chat**: Ask questions about the website content

## API Endpoints

- `POST /api/scrape`: Scrape website content
- `POST /api/train`: Create embeddings and train the model
- `POST /api/chat`: Chat with website content
- `GET /api/websites`: Get user's uploaded websites

## Tech Stack

- **Frontend**: Next.js 14, React
- **Authentication**: Clerk
- **Database**: MongoDB
- **Vector Database**: Pinecone
- **AI/ML**: Google Gemini (embeddings & chat), LangChain
- **Web Scraping**: Axios, Cheerio