# Forest Adventure competition rollout

## Current foundation
- Forest Adventure remains playable, unchanged in scoring or game physics.
- Weekly and all-time leaderboard UI and read API, backed by the same PostgreSQL database as player profiles.
- Player profile form in the Command Center: a unique 3–20 character game name is bound to a MultiversX wallet after a server-issued, five-minute, single-use challenge is signed in the wallet.
- PostgreSQL schema for players, expiring wallet challenges, seasons, and individually verified runs.
- Leaderboard deliberately counts ONLY `verification_status='verified'` scores.
- Profile registration does not submit or verify game scores. The game score remains client-controlled until authoritative run verification is implemented.
- No paid entry, ads, automated prizes, or on-chain transactions.

## Activation prerequisites
1. Provision dedicated PostgreSQL and run `db/forest-competition.sql`.
2. Set server-only `FOREST_DATABASE_URL` in the deployment environment; never use a `NEXT_PUBLIC_` prefix. Until this is configured, profile registration and leaderboard reads return unavailable.
3. Configure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` and test xPortal mobile signing plus desktop wallet signing on the deployed site.
4. Implement authoritative score validation (deterministic replay or server-controlled game state), unique run IDs, time bounds and replay protection before enabling score submission. Browser `g.score` and localStorage are untrusted.
5. Create UTC Monday 00:00–next Monday 00:00 seasons; freeze Sunday results, review anomalies, then finalize and publish results. Weekly resets via new season; all-time never resets.
6. Write contest terms, jurisdiction eligibility and manual prize distribution policy before announcing a prize competition.

**Do not represent the leaderboard as a live competition until steps 1–6 are done.**
