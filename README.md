# WOODY Website

Site-ul public WOODY pe MultiversX: homepage, Command Center, Buy Hub și Forest Adventure. Token oficial: `WOODY-5f9d9c`.

## Dezvoltare

Necesită Node.js 18.18+ și npm. Instalează dependențele din lockfile și rulează:

```bash
npm ci
npm run dev
```

Pentru verificarea producției:

```bash
npm run lint
npm run build
```

## Date și portofel

- `/api/woody-status` preia statusul WOODY Monitor de la Railway. Răspunsurile vechi sau marcate ca stale primesc HTTP 503.
- `/app` afișează preț, holderi, volum, semnale și rezerve pe pool. Totalul USD este o **estimare**: pentru fiecare pool lizibil, `2 × rezerva WOODY × prețul USD WOODY`. Poolurile indisponibile sunt excluse; tokenurile pereche nu sunt evaluate independent.
- Portofelul xPortal folosește WalletConnect, iar soldurile EGLD/WOODY se citesc din API-ul public MultiversX. Este necesar `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` pentru conexiune. Restabilirea unei sesiuni se bazează pe sesiunea autentificată din provider, nu doar pe adresa salvată în browser.
- `/buy` conține linkuri către xExchange, OneDex și JEX. Verifică tokenul și ruta înainte de semnare.
- Forest Adventure stochează scorurile local în browser; punctele din joc nu au valoare de token.

Deployul public este pe Vercel din ramura `main`: https://woody-website.vercel.app/.
