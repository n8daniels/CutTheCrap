import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CutTheCrap - AI-Powered Analysis Platform',
  description: 'Train AI models that understand your data. No fluff, no BS, just results.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
