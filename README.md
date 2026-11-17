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
- Forest Adventure păstrează o copie locală pentru joc offline și sincronizează partidele încheiate, scorul maxim, nivelurile deblocate și timpii în PostgreSQL (Supabase), folosind profilul legat de adresa xPortal. `/arcade` și `/profile` afișează numărul real de profiluri create, jucătorii activi recent și jocurile salvate. Scorurile sunt **casual / neverificate**, nu eligibile pentru premii; punctele din joc nu au valoare de token.

Deployul public este pe Vercel din ramura `main`: https://woody-website.vercel.app/.


## WOODY 3.0 navigation and wallet sessions

Pages:
- `/` — public homepage, links to Command Center, Buy WOODY, Arcade and Profile.
- `/app` — public market / pool dashboard; wallet management is not duplicated here.
- `/arcade` — one hub for Forest Adventure and fictional-credit Mini Games.
- `/profile` — single wallet connection panel and persistent public player profile lookup.
- `/forest-adventure` and `/woody-casino` — existing game URLs still supported.

Use `/profile?returnTo=%2Fforest-adventure` to start the xPortal connect flow
and return directly to the game. Only internal allowlisted destinations are
accepted. Mobile WalletConnect return intent is temporarily saved as a route
hint, never as proof of wallet ownership.

Forest Adventure now verifies the live xPortal (or browser extension) provider
session before retrieving a profile. A bare `sessionStorage` wallet address
is **not** accepted as a connected session. This read-only check does not ask
for message signing or transaction approval.

### Security restriction before prizes

The existing `POST /api/forest/profile` and casual progress endpoints only validate address and supplied game data;
it DOES NOT cryptographically verify that the requester owns the address.
Do not use these profiles or current game data for monetary payouts, wallet
authorization or prize claims. A verified wallet challenge / NativeAuth session
must be added for registration, profile changes and prize-related actions.
Read-only connection can stay signature-free.

### Mobile acceptance checklist

1. On Android, open `/profile` and connect xPortal. Approve in the wallet.
2. Return to the website; verify wallet address and EGLD / WOODY balances.
3. Open `/arcade`, then `/forest-adventure`; verify existing username is reused.
4. Disconnect, reload and confirm the player gate requires an actual provider session.
5. Repeat using `/profile?returnTo=%2Fforest-adventure`.
6. Verify desktop QR flow, mobile menu and mini-game demo route separately.
