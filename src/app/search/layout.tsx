import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Bills — CutTheCrap',
  description: 'Search federal legislation by keyword. Find any bill in Congress and see the full picture.',
  openGraph: {
    title: 'Search Bills — CutTheCrap',
    description: 'Search federal legislation. See what Congress is actually doing.',
    siteName: 'CutTheCrap',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
