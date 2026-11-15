'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/app', label: 'Command Center' },
  { href: '/arcade', label: 'Arcade' },
  { href: '/buy', label: 'Buy WOODY' },
  { href: '/profile', label: 'My Profile', prominent: true },
];

const isActive = (path, href) =>
  path === href || (href === '/arcade' && ['/forest-adventure', '/woody-casino'].includes(path));

export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="site-header">
      <nav className="site-nav site-nav-v3" aria-label="Main navigation">
        <Link href="/" className="site-brand">
          <Image src="/woody-logo.png" alt="" width={40} height={40} priority />
          <span>WOODY<small>ON MULTIVERSX</small></span>
        </Link>
        <button
          className="site-mobile-toggle"
          type="button"
          aria-controls="woody-site-links"
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          {open ? 'Close' : 'Menu'} <span aria-hidden="true">{open ? '×' : '☰'}</span>
        </button>
        <div id="woody-site-links" className={`site-links site-links-v3 ${open ? 'is-open' : ''}`}>
          {links.map(({ href, label, prominent }) => (
            <Link
              href={href}
              key={href}
              className={prominent ? 'site-profile-link' : undefined}
              aria-current={isActive(path, href) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
