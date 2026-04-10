import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bill Analysis — CutTheCrap',
  description: 'See what this bill does, who sponsored it, who funded them, and how it connects to everything else.',
  openGraph: {
    title: 'Bill Analysis — CutTheCrap',
    description: 'Federal legislation, connected. See the full picture behind any bill.',
    siteName: 'CutTheCrap',
  },
};

export default function BillsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
