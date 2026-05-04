# WOODY Meme Website

Landing page simplu și modern pentru proiectul **WOODY Meme**, construit cu **Next.js + Tailwind CSS**.

## Cerințe

- Node.js 18+
- npm 9+

## Rulare locală

```bash
npm install
npm run dev
```

Deschide în browser: `http://localhost:3000`

## Build producție

```bash
npm run build
npm start
```

## Deploy pe Vercel

1. Urcă repository-ul pe GitHub/GitLab/Bitbucket.
2. Intră pe [vercel.com](https://vercel.com) și apasă **Add New Project**.
3. Importă repository-ul.
4. Framework detectat automat: **Next.js**.
5. Apasă **Deploy**.

Alternativ, cu CLI:

```bash
npm i -g vercel
vercel
```

## Structură principală

- `app/page.js` — landing page (hero, about, bot, token info, liquidity, roadmap, community)
- `app/globals.css` — stiluri globale și temă dark
- `tailwind.config.js` — configurare Tailwind
