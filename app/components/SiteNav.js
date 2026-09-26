'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const links = [['/', 'Home'], ['/app', 'Command Center'], ['/buy', 'Buy WOODY'], ['/forest-adventure', 'Arcade']];
export default function SiteNav() {
  const path = usePathname();
  return <header className="site-header"><nav className="site-nav" aria-label="Main navigation">
    <Link href="/" className="site-brand"><Image src="/woody-logo.png" alt="" width={40} height={40} priority /><span>WOODY<small>ON MULTIVERSX</small></span></Link>
    <div className="site-links">{links.map(([href,label]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>{label}</Link>)}</div>
  </nav></header>;
}
