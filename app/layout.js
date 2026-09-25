import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { Orbitron, Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata = {
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
        <header className="v2-site-header sticky top-0 z-30 border-b border-white/10 bg-[#080b12]/95 backdrop-blur-xl">
          <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/woody-logo.png" alt="WOODY logo" width={44} height={44} priority className="h-11 w-11" />
              <div>
                <p className="text-sm font-semibold tracking-[0.22em] text-orange-300">WOODY</p>
                <p className="text-xs text-white/60">Meme Ecosystem</p>
              </div>
            </Link>
            <div className="v2-site-nav flex flex-wrap items-center justify-end gap-2">
              <Link href="/" className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80 transition hover:border-sky-300/40 hover:text-sky-200">Home</Link>
              <Link href="/app" className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100 transition hover:border-sky-300 hover:bg-sky-400/20">Command Center</Link>
              <Link href="/buy" className="rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-200 transition hover:border-orange-300 hover:bg-orange-400/20">Buy WOODY</Link>
              <Link href="/forest-adventure" className="rounded-full border border-orange-400/40 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-200 transition hover:border-orange-300 hover:bg-orange-400/20">Arcade</Link>
              <span className="nav-live-badge"><span className="live-pulse-dot" /> LIVE</span>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
