# Forest Adventure competition rollout

## Current foundation
- Forest Adventure remains playable, unchanged in scoring or game physics.
- Weekly and all-time leaderboard UI and read API, backed by the same PostgreSQL database as player profiles.
- Player profile form in the Command Center: a unique 3–20 character game name is bound to a MultiversX wallet after the Native Auth proof from wallet connection is verified by the server. Saving a name does not request a second signature.
- PostgreSQL schema for players, seasons, and individually verified runs. The old challenge table is retained for migration compatibility; its endpoint is removed.
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

## Profile login integration
- Exact public origins are allowed; Vercel preview/branch origins come from server-owned VERCEL_URL and VERCEL_BRANCH_URL. Arbitrary *.vercel.app origins are not trusted.
- The login proof remains in sessionStorage for this browser tab and is restored only after the wallet provider confirms the same address. The server revalidates the proof before profile writes.
- Existing names are fetched by wallet address on reconnect. Expired proof requires a fresh wallet login, not another profile signature.
- Verify xPortal login, immediate name creation, reload, disconnect/reconnect, duplicate name rejection and wallet switching on a real phone before merging.
- Score submission is not implemented by this profile change. Do not activate prize competitions based on browser-provided score totals.
