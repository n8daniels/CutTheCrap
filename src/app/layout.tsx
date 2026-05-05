import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { ShowWhyButton } from '@/components/LandingModal';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const siteName = 'CutTheCrap';
const siteTitle = 'CutTheCrap — Federal Legislation, Connected';
const siteDescription =
  'See what a federal bill actually does, what it changes, who sponsored it, and who funded them. Free, non-partisan civic tool built on public data.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: '%s · CutTheCrap',
  },
  description: siteDescription,
  keywords: [
    'Congress',
    'federal legislation',
    'bills',
    'civic tech',
    'government transparency',
    'campaign finance',
    'lobbying',
    'public policy',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: '/' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-primary-600">CutTheCrap</h1>
                <span className="text-sm text-gray-500">Federal legislation, connected</span>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-primary-600">Home</a>
                <a href="/search" className="text-gray-700 hover:text-primary-600">Search</a>
                <a href="/spending" className="text-gray-700 hover:text-primary-600">Spending</a>
              </div>
            </div>
          </div>
        </nav>
        <AnalyticsTracker />
        <main>{children}</main>
        <footer className="mt-12 py-8 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p className="text-sm">
              CutTheCrap &copy; {new Date().getFullYear()} &middot; Open source civic tool &middot; <a href="https://github.com/n8daniels/CutTheCrap" className="text-primary-600 hover:underline">GitHub</a> &middot; <ShowWhyButton />
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
