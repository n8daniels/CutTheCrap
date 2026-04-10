import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Member Profile — CutTheCrap',
  description: 'See this member of Congress — their donors, voting record, sponsored bills, and financial connections.',
  openGraph: {
    title: 'Member Profile — CutTheCrap',
    description: 'Follow the money. See who funds this member of Congress.',
    siteName: 'CutTheCrap',
  },
};

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return children;
}
