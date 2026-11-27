import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://dhruvpatel-umber.vercel.app'),
  title: 'Dhruv Patel — Robotics, Edge AI & Systems',
  description: 'Interactive 3D narrative portfolio of Dhruv Patel — Computer Science & Engineering, Industrial Automation, Low-Level Systems, and Hardware Innovation.',
  icons: {
    icon: './public/favicon.svg',
  },
  openGraph: {
    title: 'Dhruv Patel — Robotics, Edge AI & Systems',
    description: 'Bridging algorithmic software, custom silicon, and real-world industrial machines.',
    images: ['./public/favicon.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#06070a] text-gray-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
