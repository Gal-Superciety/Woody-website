import './globals.css';
import { Orbitron, Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

export const metadata = {
  title: 'WOODY Meme',
  description: 'WOODY Meme - Crypto community token landing page',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable}`}>{children}</body>
    </html>
  );
}
