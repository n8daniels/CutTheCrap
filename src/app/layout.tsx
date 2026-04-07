import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CutTheCrap - AI-Powered Federal Legislation Analysis',
  description: 'Understand federal legislation with AI-powered analysis and intelligent insights',
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
                <span className="text-sm text-gray-500">No fluff, just results</span>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-700 hover:text-primary-600">Home</a>
                <a href="/about" className="text-gray-700 hover:text-primary-600">About</a>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="mt-12 py-8 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>Built with focus. No fluff, no BS, just results.</p>
            <p className="mt-2 text-sm">
              CutTheCrap &copy; {new Date().getFullYear()} - Powered by AI
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
