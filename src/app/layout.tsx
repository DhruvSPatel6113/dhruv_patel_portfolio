import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://dhruv-patel-portfolio.vercel.app'),
  title: 'Dhruv Patel | The Cyber-Physical Journey',
  description: 'Interactive 3D narrative portfolio of Dhruv Patel — Computer Science & Engineering, Industrial Automation, Low-Level Systems, and Hardware Innovation.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Dhruv Patel | Interactive 3D Portfolio',
    description: 'Bridging algorithmic software, custom silicon, and real-world industrial machines.',
    images: ['/favicon.svg'],
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
      </body>
    </html>
  );
}
