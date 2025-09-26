import './globals.css'

export const metadata = {
  title: 'Website RAG Chatbot',
  description: 'Chat with any website using AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}