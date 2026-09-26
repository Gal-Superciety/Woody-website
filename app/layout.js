import './globals.css';
import SiteNav from './components/SiteNav';
import { Orbitron, Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata = {
  metadataBase: new URL('https://woody-website.vercel.app'),
  title: 'WOODY Meme',
  description: 'Community-driven meme ecosystem on MultiversX',
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'WOODY Meme',
    description: 'Community-driven meme ecosystem on MultiversX',
    images: [{ url: '/woody-logo.png', alt: 'WOODY Meme logo' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WOODY Meme',
    description: 'Community-driven meme ecosystem on MultiversX',
    images: ['/woody-logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable}`}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteNav />
        <div id="main-content" tabIndex={-1}>
        {children}
        </div>
      </body>
    </html>
  );
}
