import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CutTheCrap - Bills in Plain Language',
  description: 'U.S. bills explained in clean, honest, everyday language. No jargon, no fog, no nonsense.',
  keywords: ['bills', 'legislation', 'politics', 'congress', 'plain language'],
  authors: [{ name: 'CutTheCrap' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2E5AAC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
