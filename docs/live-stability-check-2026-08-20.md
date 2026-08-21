# Live Stability Check — 2026-08-20

The deployed homepage at `https://a1-sigma-gray.vercel.app/` loads the Signal Raid request-first interface, creator card, platform controls, search/filter/sort controls, and public request status panel without a Vercel function-crash page.

The production tRPC endpoint is responding with structured JSON. `auth.me` returns `{json:null}` for the unauthenticated browser session, which is expected. An intentionally malformed `booking.profile` input returns a structured tRPC `BAD_REQUEST` response rather than a server crash, which confirms the API runtime is reachable.

The correct public profile query for slug `almostlegittv` returns `null`. The homepage therefore shows `0 of 0 titles` and “This creator profile is unavailable or not approved yet.” This is an application/data-state issue, not a Vercel runtime failure: the production database does not currently contain the approved AlmostLegitTV profile/catalog expected by the UI, or the deployment is connected to a database without the seed.

## Interaction checks

The public creator application route loads and correctly presents a sign-in-required state with a visible creator sign-in action. The PlayStation platform selector updates the URL to `?platform=playstation`, changes the accent treatment to blue, and labels PlayStation mode as active. The catalog search field accepts text and exposes a clear-filters control. The sort selector changes to Alphabetical without a client-side crash. These controls remain stable, but they operate over an empty catalog because the production profile query returns null.

The main actionable issue is production data seeding/profile visibility: the live frontend displays the approved creator shell but cannot load the approved profile or four seeded titles from the production database.

## Response timing snapshot

A direct live check returned HTTP 200 for the homepage, `auth.me`, and the creator application route. In this single sample, the homepage transferred approximately 368 KB and completed in 0.252 seconds with a 0.210-second time to first byte. The `auth.me` tRPC request returned 35 bytes in 0.186 seconds with a 0.186-second time to first byte. The creator application route completed in 0.170 seconds with a 0.127-second time to first byte. These are point-in-time measurements from one network location, not a load test or SLA guarantee.
