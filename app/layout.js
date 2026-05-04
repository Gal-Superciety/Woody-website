import './globals.css';
import Image from 'next/image';
import { Orbitron, Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata = {
  title: 'WOODY Meme',
  description: 'WOODY Meme - Crypto community token landing page',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable}`}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#020617]/80 backdrop-blur-md">
          <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
            <a href="#" className="flex items-center gap-3">
              <Image src="/woody-head.svg" alt="WOODY logo" width={44} height={44} priority className="h-11 w-11" />
              <div>
                <p className="text-sm font-semibold tracking-[0.22em] text-orange-300">WOODY</p>
                <p className="text-xs text-white/60">Meme Ecosystem</p>
              </div>
            </a>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">LIVE</span>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
