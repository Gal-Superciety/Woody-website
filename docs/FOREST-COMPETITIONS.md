# Forest Adventure competition rollout

## Current foundation
- Forest Adventure remains playable, unchanged in scoring or game physics.
- Read-only weekly and all-time leaderboard API and UI.
- PostgreSQL schema for unique usernames bound to MultiversX wallet addresses, seasons, and individually verified runs.
- Leaderboard deliberately counts ONLY `verification_status='verified'` scores.
- No paid entry, ads, automated prizes, or on-chain transactions.

## Deployment prerequisites (NOT YET ENABLED)
1. Provision dedicated PostgreSQL and run `db/forest-competition.sql`.
2. Set server-only `FOREST_DATABASE_URL` in deployment environment; never use NEXT_PUBLIC prefix.
3. Implement challenge/response wallet signature verification, with single-use expiring nonces and server-side address verification, before enabling profile creation.
4. Implement authoritative score validation (deterministic replay or server-controlled game state), unique run IDs, time bounds and replay protection before enabling score submission. Browser `g.score` and localStorage are untrusted.
5. Test mobile xPortal deep-link login and desktop extension login. Current Command Center wallet connection alone is NOT competition authentication.
6. Create UTC Monday 00:00–next Monday 00:00 seasons; freeze Sunday results, manually review anomalies, then finalize and publish results. Weekly resets via new season; all-time never resets.
7. Write contest terms, jurisdiction eligibility and manual prize distribution policy before announcing a prize competition.

**Do not represent the leaderboard as live competition-ready until steps 1–6 are done.**
