import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CutTheCrap - AI-Powered Legislative Analysis",
  description: "Understand federal legislation without the fluff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
