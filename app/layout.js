import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'Website RAG Chatbot',
  description: 'Chat with any website using AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script 
          src="https://arivubot-seven.vercel.app/api/widget/https%3A%2F%2Fsspackcare.com%2F" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}