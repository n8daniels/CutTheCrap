import type { Metadata } from 'next'
import './globals.css'
import AuthButton from '@/components/AuthButton'
import Link from 'next/link'

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
      <body className="antialiased min-h-screen flex flex-col">
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-dem-blue">CutTheCrap</span>
            </Link>
            <AuthButton />
          </div>
        </header>
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 md:py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
