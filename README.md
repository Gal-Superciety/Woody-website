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


## Forest Adventure — five-chapter preview

`/forest-adventure` runs the unified campaign. `/living-forest` redirects there.
The first three chapters retain the original ground-platform routes and add
12–16 canopy tiers. Chapters four and five use new approaches and 18 tiers.
The Moonwood bird renderer is shared by all chapters.

- Gear, remaining lives and coins carry across chapter transitions.
- Firing is unlimited; block rewards unlock double/triple shots.
- Reaching the second canopy tier arms the floor hazard. Landing on a lower
  platform is safe; touching the floor or falling out costs one life, bypassing
  shields. Respawning retains current gear and disarms the floor until climbing.
- Guardians telegraph attacks, open their armour after firing and attack faster
  below half health. Wolf guardians also rush the player.
- Saves use `woody-forest-campaign-v2`; old Season 1 records are not deleted.
  Resuming restores the latest checkpoint, collected rewards and equipment;
  partial guardian damage resets. Storage is device-local, with no leaderboard.
- `node --test tests/living-forest.test.mjs` checks transitions, jumps, combat,
  floor hazards and validated saves. `npm run build` checks production compilation.

This branch is a gameplay preview. The public production deployment is unchanged
until the PR is merged. Difficulty still needs human playtesting on phones.
