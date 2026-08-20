# Vercel + MySQL setup guide for AlmostLegitTV

This guide connects the AlmostLegitTV full-stack application to a production MySQL-compatible database so the approved AlmostLegitTV profile and four story-driven catalog titles can appear on the live Vercel site.

> **Important:** Never paste a database password, connection string, OAuth secret, JWT secret, or API key into chat, GitHub, screenshots, or source files. Enter secret values only into your database provider, Vercel, or a secure local terminal.

## Recommended provider path

For a beginner-friendly MySQL-compatible setup, TiDB Cloud Starter or Essential is a practical option because its console provides a ready-to-copy connection string and requires TLS for standard public connections.[1] PlanetScale is another MySQL-compatible option, but its current console and connection workflow may differ by plan. The instructions below use TiDB Cloud because its official documentation clearly describes the connection flow.

## 1. Create the database

Open [TiDB Cloud](https://tidbcloud.com/) and create an account or sign in. Create a new **Starter** or **Essential** instance. Choose a region close to the Vercel deployment when the provider offers that choice. Give the instance a recognizable name such as `almostlegit-production`.

Wait until the instance is ready. Do not create application tables manually. The AlmostLegitTV migration files will create the required tables in the next step.

## 2. Create and save the database password

In the TiDB Cloud instance console, choose **Connect** and then **Generate Password** if a password has not been created. Save the password in a password manager immediately. TiDB states that a generated password may not be shown again after closing the connection dialog; if it is lost, reset it and save the replacement securely.[1]

## 3. Copy the production connection string

Still in the **Connect** dialog, keep the standard public connection type and choose the MySQL connection method. Copy the generated connection string. It will resemble this format, but your real value will contain different credentials and host information:

```text
mysql://USERNAME:PASSWORD@HOST/DATABASE_NAME?sslaccept=strict
```

Do not modify the generated username or host. TiDB may require an instance-specific username prefix, and its connection dialog provides the correctly formatted value.[1] Keep the connection string private.

## 4. Apply the AlmostLegitTV schema

The repository already contains the Drizzle schema and migration files. From a local terminal, clone or open the private working copy and install dependencies:

```bash
gh repo clone almostlegittv/a1
cd a1
pnpm install
```

Set the connection string only in your current terminal session. Replace the placeholder locally; do not commit this command or its output:

```bash
export DATABASE_URL='PASTE_THE_PRIVATE_CONNECTION_STRING_HERE'
```

Run the migrations:

```bash
pnpm drizzle-kit migrate
```

If this project’s Drizzle configuration expects generated migrations first, use:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

The migration process should create the users, streamer profiles, catalog games, streamer catalog, creator applications, verification checks, audit events, and booking request tables. Do not use destructive commands such as dropping the database or dropping all tables.

## 5. Verify the tables without exposing secrets

Use the database provider’s SQL console or a local database client to run a non-sensitive table check:

```sql
SHOW TABLES;
```

You should see tables corresponding to the application schema, including `users`, `streamer_profiles`, `catalog_games`, `streamer_catalog`, `creator_applications`, `creator_application_checks`, `creator_application_events`, and `booking_requests`.

Do not post the result if it contains connection details or private user information. A table-name list is sufficient for troubleshooting.

## 6. Add Vercel environment variables

Open **Vercel → the `a1` project → Settings → Environment Variables**. Add each variable with the correct **Key**, **Value**, and environment. Vercel applies environment-variable changes only to new deployments, so saving a variable does not change an already-running deployment until you redeploy.[2]

At minimum, add the following to **Production**:

| Key | What to enter | Where it comes from |
|---|---|---|
| `DATABASE_URL` | The private MySQL/TiDB connection string copied from the provider | TiDB Cloud **Connect** dialog |
| `OWNER_OPEN_ID` | The exact owner identity used by the OAuth system | Existing managed project authentication configuration; do not invent it |
| `JWT_SECRET` | The existing session-signing secret or a newly generated long random secret | Existing managed project configuration or secure local generation |
| `VITE_APP_ID` | OAuth application/client ID | OAuth application settings |
| `OAUTH_SERVER_URL` | OAuth server/base URL | OAuth provider configuration |
| `VITE_OAUTH_PORTAL_URL` | Browser sign-in portal URL | OAuth provider configuration |
| `BUILT_IN_FORGE_API_URL` | Server-side Forge/API URL if the application uses it | Existing managed project configuration |
| `BUILT_IN_FORGE_API_KEY` | Server-side Forge/API key if the application uses it | Existing managed project configuration |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend Forge/API URL if the application uses it | Existing managed project configuration |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend Forge/API key if the application uses it | Existing managed project configuration |

Select **Production** for each required variable. If you also want non-main preview deployments to use the database, add the same variables to **Preview**; otherwise, leave Preview disconnected from production data. Vercel supports separate values per environment, which is useful for keeping preview data separate from production data.[2]

## 7. Redeploy the application

Go to **Vercel → Deployments** and redeploy the latest `main` deployment containing commit `28f3be5`, or push a new commit to the production branch. Wait for the build to complete.

The API check should now reach the backend instead of the frontend fallback. Open this URL in the browser:

```text
https://a1-sigma-gray.vercel.app/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D
```

An unauthenticated response may show a JSON `null` user result, which is expected. It should **not** show the site’s React 404 page. If it still shows the React 404 page, the deployment is still using an older commit or the Vercel function/rewrite configuration was not applied.

## 8. Sign in once as the owner

Open the live site and choose the creator/admin sign-in control. Sign in using the owner account associated with `OWNER_OPEN_ID`. The OAuth callback will create the owner user record. When the authenticated identity matches `OWNER_OPEN_ID`, the owner bootstrap creates or updates the approved `almostlegittv` profile, attaches the known public social links, and inserts the story catalog without duplicating existing rows.

The seed titles are:

| Title | Platform | Initial state |
|---|---|---|
| Red Dead Redemption 2 | Xbox | Already owned example |
| Kingdom Come: Deliverance II | Xbox | Available to request |
| Grand Theft Auto V | Xbox | Available to request |
| S.T.A.L.K.E.R. 2 | Xbox | Available to request |

The bootstrap does not create payment records, wallet balances, gift-code records, service fees, or platform transactions. It is duplicate-safe: existing matching profile, game, and creator-catalog rows are reused rather than inserted again.

## 9. Verify the live board

Reload the home page. The expected live state is an approved **AlmostLegitTV** profile, `4 of 4 titles`, the four story-driven cards, three **Request a stream** actions, one **Already owned** state, the creator-application prompt, and the no-funds disclosure.

If the board still says `0 of 0 titles`, check the following in order:

| Symptom | Likely cause | Corrective action |
|---|---|---|
| `/api/trpc/auth.me` shows the React 404 page | Backend function is not deployed or an old deployment is live | Confirm the deployment contains commit `28f3be5` and redeploy |
| API returns a database connection error | `DATABASE_URL` is missing, malformed, or assigned only to Preview | Add the correct value to Production and redeploy |
| Sign-in fails before profile creation | OAuth variables or callback configuration are missing | Confirm the OAuth keys and callback URL in the provider settings |
| Sign-in works but no profile appears | `OWNER_OPEN_ID` does not exactly match the OAuth identity | Correct the value in Vercel and redeploy, then sign in again |
| Profile exists but catalog is empty | The owner bootstrap did not run or the migration is incomplete | Inspect server logs, confirm migrations, and sign in again |
| Local and live boards differ | They use different databases or environment files | Check which `DATABASE_URL` each environment uses |

## Security checklist

Use a separate production database and do not use the managed preview database as a public production credential. Enable TLS; TiDB Cloud Starter and Essential require TLS for standard public connections.[1] Keep database credentials in Vercel environment variables rather than `.env` files committed to GitHub. Use the smallest practical database permissions, rotate credentials if they are exposed, and never request creator passwords or platform login credentials through the application.

### References

[1]: https://docs.pingcap.com/tidbcloud/secure-connections-to-serverless-clusters/ "TiDB Cloud: TLS Connections to Starter or Essential"
[2]: https://vercel.com/docs/environment-variables "Vercel: Environment Variables"
