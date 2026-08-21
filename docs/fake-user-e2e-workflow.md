# Fake-user end-to-end workflow

This project includes a guarded non-production fixture command for exercising the platform from application through creator review. The command refuses to run when `NODE_ENV=production` and requires `ALLOW_TEST_FIXTURES=true`.

Run the fixture setup only against a disposable local or preview database:

```bash
ALLOW_TEST_FIXTURES=true NODE_ENV=development pnpm test:fixtures
```

The fixture creates or refreshes three deterministic accounts: `test-admin-almostlegit`, `test-creator-almostlegit`, and `test-viewer-almostlegit`. It creates an approved `test-creator` profile with Xbox and PlayStation tags, two visible catalog titles, one viewer booking request, and one viewer game suggestion. Re-running the command reuses existing matching rows rather than creating duplicate fixture records.

| Role | Fixture identity | Expected capabilities |
|---|---|---|
| Administrator | `test-admin-almostlegit` | Review applications, onboard creators, inspect the creator directory, and access admin dashboards. |
| Creator | `test-creator-almostlegit` | Edit the approved public profile, confirm ownership, review booking requests, and triage game suggestions for the matching profile only. |
| Viewer | `test-viewer-almostlegit` | Browse the public board, submit a stream request or game suggestion after authentication, and never access private creator or admin controls. |

The automated `server/fake-users.e2e.test.ts` suite verifies the route contract and authorization boundaries for these roles. It does not log into a real OAuth account and does not create production data. The browser-level flow should be checked in a disposable environment in this order: submit or inspect a creator application, review its verification checks as the administrator, approve the profile, open the creator board, submit a booking request as the viewer, confirm ownership and transition request status as the creator, submit a game suggestion as the viewer, and review that suggestion as the creator.

No fixture or test flow handles payments, wallet balances, gift codes, platform credentials, fees, or transaction records.
