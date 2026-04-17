import type { Metadata } from 'next';
import './globals.css';
import AnalyticsTracker from '@/components/AnalyticsTracker';

export const metadata: Metadata = {
  title: 'CutTheCrap — Federal Legislation, Connected',
  description: 'See what a bill actually does, what it changes, and who is connected to it. Free, non-partisan civic tool.',
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
              </div>
            </div>
          </div>
        </nav>
        <AnalyticsTracker />
        <main>{children}</main>
        <footer className="mt-12 py-8 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p className="text-sm">
              CutTheCrap &copy; {new Date().getFullYear()} &middot; Open source civic tool &middot; <a href="https://github.com/n8daniels/CutTheCrap" className="text-primary-600 hover:underline">GitHub</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
