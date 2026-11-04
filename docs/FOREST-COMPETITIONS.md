# Forest Adventure competition rollout

## Current foundation
- Forest Adventure remains playable, unchanged in scoring or game physics.
- Weekly and all-time leaderboard UI and read API, backed by the same PostgreSQL database as player profiles.
- Forest Adventure profile form: a unique 3–20 character game name is stored alongside the wallet address supplied by the connected wallet session. Saving a name does not request a signature or transaction. The server cannot cryptographically verify wallet ownership without a signed proof, so this association is not suitable for prize eligibility.
- PostgreSQL schema for players, seasons, and individually verified runs. The old challenge table is retained for migration compatibility; its endpoint is removed.
- Leaderboard deliberately counts ONLY `verification_status='verified'` scores.
- Profile registration does not submit or verify game scores. The game score remains client-controlled until authoritative run verification is implemented.
- No paid entry, ads, automated prizes, or on-chain transactions.

## Activation prerequisites
1. Provision dedicated PostgreSQL and run `db/forest-competition.sql`.
2. Set server-only `FOREST_DATABASE_URL` in the deployment environment; never use a `NEXT_PUBLIC_` prefix. Until this is configured, profile registration and leaderboard reads return unavailable.
3. Configure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` and test the standard xPortal connection approval on a real mobile device.
4. Implement authoritative score validation (deterministic replay or server-controlled game state), unique run IDs, time bounds and replay protection before enabling score submission. Browser `g.score` and localStorage are untrusted.
5. Create UTC Monday 00:00–next Monday 00:00 seasons; freeze Sunday results, review anomalies, then finalize and publish results. Weekly resets via new season; all-time never resets.
6. Write contest terms, jurisdiction eligibility and manual prize distribution policy before announcing a prize competition.

**Do not represent the leaderboard as a live competition until steps 1–6 are done.**

## Profile login integration
- WalletConnect session approval supplies the address to the browser. No Native Auth login message or blockchain transaction is requested for profile creation.
- Because the server receives the address from the browser, users can claim another address when creating a profile. Do not use this profile association to authorize access to assets or distribute prizes.
- Existing names are fetched by the connected wallet address when the player returns.
- Verify xPortal connection, immediate name creation, reload, disconnect/reconnect and duplicate name rejection on a real phone.
- Score submission is not implemented by this profile change. Do not activate prize competitions based on browser-provided score totals.
