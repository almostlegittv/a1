- [x] Remove all instructions to send Xbox codes through DMs or stream chat.
- [x] State consistently that Xbox handles payment, gifting, code delivery, and redemption on its platform.
- [x] Re-test the corrected gifting copy and save a new checkpoint.
- [x] Replace the TikTok, YouTube, Kick, Twitch, and lnk.bio URLs with the user-provided profiles.
- [x] Remove the YouTube tracking query from the stored profile URL.
- [x] Verify social links, build, and responsive presentation, then save a checkpoint.
- [x] Refine the PayPal QR popup into a clean, prominent, easy-to-scan modal.
- [x] Verify modal open, close, QR display, accessibility, and mobile behavior before checkpoint.
- [x] Remove any location, Edmonton, local-business, or geographic references from public site copy and project documentation.
- [x] Run a location-term scan and re-test the build before saving a privacy-clean checkpoint.
- [x] Add one concise Xbox same-country/region gifting disclaimer near the game-support queue without revealing the creator’s location.
- [x] Verify the disclaimer and build, then save a checkpoint.
- [x] Create a clean downloadable ZIP from the current AlmostLegitTV project, excluding dependencies and generated build artifacts.
- [x] Validate the ZIP contents and provide Vercel upload steps.
- [x] Start the self-contained Vercel package locally with Node.js.
- [x] Verify homepage rendering, local asset loading, social links, Xbox links, and PayPal modal behavior locally.
- [x] Report any issues and deployment readiness.
- [ ] Correct Vercel so Install Command is not `pnpm build` and Build Command remains `pnpm build`.
- [ ] Verify the package build path and provide the exact redeploy steps.
- [ ] Diagnose the Vercel `pnpm install` exit code 254 against the repository’s package manager and lockfile.
- [ ] Apply and validate the safest install compatibility fix before redeploying.
- [ ] Verify that commit `687cade` contains the patch at exactly `patches/wouter@3.7.1.patch`.
- [ ] Ensure the patch file is committed on `main`, then redeploy that commit in Vercel.
- [x] Remove the stale Wouter patchedDependencies configuration and patch directory from the Vercel package.
- [x] Regenerate the lockfile and validate dependency installation and production build without the patch.
- [x] Deliver the corrected package and explain that the GitHub repository contents must be replaced.
- [ ] Replace the flattened GitHub upload with the complete folder-preserving Vercel package.
- [ ] Confirm `client/index.html`, `client/src/pages/Home.tsx`, `client/src/main.tsx`, assets, and server files exist at their expected paths before redeploying.
- [x] Add PlayStation as a supported platform without claiming native game gifting.
- [ ] Keep all money movement and platform transactions off-site; define a wallet-funds support flow that links users to the platform’s own purchase process.
- [ ] Add clear honor-system, creator-accountability, reporting, and no-guarantee language.
- [ ] Design a manually approved multi-creator profile model with creator logins that cannot self-publish or edit public content.
- [ ] Preserve the current visual system and existing Xbox, PayPal, and social flows while making platform/profile content configurable.
- [ ] Reframe public copy from gifting/support transactions to stream-booking intent and creator scheduling.
- [x] Ensure the site handles no funds, wallet balances, gift codes, payment details, or platform transactions.
- [ ] Define booking-request status, creator approval, platform guidance, and no-guarantee language.
- [x] Show each creator’s full game catalog with owned games visibly grayed out and non-requestable.
- [x] Require viewer accounts and a streaming-platform username for booking requests while keeping requester identity private.
- [x] Make request status public without exposing private requester details, and prevent duplicate active requests per creator/game.
- [ ] Give each approved creator a matching profile page with their own name, gamer tags, platform links, catalog, and optional external PayPal link.
- [x] Do not add a service fee, payment processor, wallet, balance, code handling, or any funds flow to the site.
- [ ] Identify no-funds revenue models that monetize creator tools, booking operations, analytics, or sponsorships without handling viewer payments.
- [ ] Separate realistic independent revenue from aspirational TikTok partnership opportunities.
- [ ] Recommend a staged launch, pricing model, and measurable partnership proof points.
- [ ] Draft PlayStation wallet-support requirements with no funds, codes, balances, or transactions handled by the site.
- [ ] Draft viewer, creator, and administrator workflows with region checks, privacy, duplicate prevention, and public status.
- [ ] Include clear disclosures, moderation boundaries, and implementation acceptance criteria.
- [x] Draft the multi-streamer database entities, keys, statuses, and relationships.
- [ ] Define admin, streamer, viewer, and moderator roles with least-privilege permissions.
- [ ] Document approval, privacy, duplicate-prevention, reporting, and audit workflows.
- [x] Design the public booking dashboard layout, filters, catalog states, and request cards.
- [x] Design duplicate-prevention messaging, follow-existing-request behavior, and private/public identity boundaries.
- [x] Specify reusable responsive components and frontend acceptance criteria.
- [ ] Replace pre-request ownership lockout with streamer-confirmed ownership after submission.
- [ ] Add owned-request history and public status without exposing private conversation details.
- [ ] Add private mutual-platform coordination guidance and off-platform support-pending status without handling payment or codes.
- [x] Design streamer request-review controls and Already Owned category management.
- [ ] Design stream-time coordination and external-platform handoff states without on-site chat or payments.
- [x] Specify reusable streamer dashboard components, responsive behavior, and acceptance criteria.
- [ ] Design the viewer request journey, account requirements, and private/public identity boundaries.
- [ ] Design request submission, duplicate handling, owned-game responses, and public status tracking.
- [ ] Specify reusable viewer components, responsive behavior, accessibility, and acceptance criteria.
- [x] Design a persistent Xbox/PlayStation platform selector for viewer and streamer workflows.
- [x] Define accessible platform color tokens, state cues, and contrast-safe visual treatment.
- [x] Specify how platform mode affects catalogs, request forms, dashboards, and external-support guidance.
- [x] Define platform-mode state ownership and precedence across URL, session, profile, and defaults.
- [x] Design session persistence, deep-link handling, auth redirects, and invalid-mode fallback.
- [x] Specify theme tokens, React context boundaries, server contracts, and test cases.
- [ ] Combine platform-mode resolution with the viewer request and streamer-confirmed ownership journey.
- [ ] Define public/private status transitions, external coordination, platform switching, and edge cases.
- [ ] Document end-to-end acceptance criteria for Xbox and PlayStation flows.
- [ ] Define the no-funds threat model and off-platform trust boundaries.
- [ ] Specify authentication, authorization, privacy, abuse prevention, rate limits, and secure external-link controls.
- [ ] Define moderation, audit, report handling, self-reported support tracking, and incident-response workflows.
- [x] Confirm whether to implement the first database-backed vertical slice in the existing project now.
- [x] Preserve the current public prototype and no-funds boundary while adding the new foundation.

- [x] Install and align Drizzle Kit and Drizzle ORM for the booking schema.
- [x] Add the booking migration configuration and apply streamer, catalog, and request tables without funds-related fields.
- [x] Add database helpers for approved catalogs, public/private requests, duplicate prevention, request status, and ownership updates.
- [x] Add typed tRPC booking procedures with protected creator/admin boundaries.
- [x] Restore or wire the missing full-stack runtime and authentication context so the new procedures are reachable from the browser.
- [x] Replace BookingDashboard in-memory catalog and request state with persisted API data.
- [x] Add streamer-facing ownership and request classification management UI.

- [x] Restore the managed full-stack authentication/runtime scaffold without weakening protected procedures.
- [x] Wire secure OAuth callback and session context into the existing Express/tRPC server.
- [ ] Verify protected creator request and ownership mutations end to end after auth restoration.

- [x] Implement a custom secure auth-runtime parity layer because the managed scaffold files were not present in repository history.
- [x] Add automated tests for signed session creation and database-backed session hydration using mocked user lookup.
- [ ] Complete one real Manus OAuth login and verify callback cookie issuance, auth.me, approved creator access, request classification, and ownership updates in the browser.

- [x] Add an accessible booking-catalog search field for title and genre.
- [x] Add catalog filters that work with the existing All/Xbox/PlayStation platform mode and ownership states.
- [x] Verify search/filter behavior at desktop and mobile widths, then checkpoint the update.

- [x] Add a quick Request Game button directly to cards for available-to-request games.
- [x] Preserve already-owned, duplicate-request, authentication, and no-funds behavior for the quick action.
- [x] Verify the quick-request card action and checkpoint the update.

- [x] Restrict the quick Request Game action to catalog games whose ownership status is available/open.
- [x] Add focused verification for owned-card, duplicate-request, signed-out, and signed-in quick-request states.
- [x] Save a new checkpoint after the corrected quick-request behavior is verified.

- [x] Add catalog metadata needed for release-date and popularity sorting.
- [x] Add a sort control for release date, popularity, and alphabetical order that composes with current filters.
- [x] Test sorting with search/platform/ownership filters and verify responsive behavior before checkpointing.

- [x] Parameterize the public booking board by approved creator slug instead of hard-coding AlmostLegitTV.
- [x] Add a public creator route or selection escape route so approved creators can expose separate catalogs.
- [x] Verify multi-creator routing preserves sorting, ownership, privacy, duplicate prevention, and no-funds behavior.

- [x] Diagnose missing image assets in the Vercel deployment.
- [x] Repair image packaging or URL references and verify production loading.

- [ ] Redeploy the bundled `/assets` image fix to Vercel and verify the live homepage, favicon, hero, game art, and PayPal QR.
- [ ] Capture desktop and mobile browser verification for the deployed image fix.

- [ ] Authorize the GitHub connector for this session so the optimized image fix can be pushed to the existing repository.
- [ ] Push the optimized `/assets` image fix to the repository and confirm Vercel detects the new commit.

- [x] Add an admin-only creator onboarding workspace with validated profile and catalog fields.
- [x] Add protected onboarding procedures with manual approval, slug uniqueness, and no-funds boundary tests.
- [x] Add public creator-link handoff and responsive admin UI verification.

- [ ] Make the booking board the immediate landing route so visitors understand the site purpose quickly.
- [ ] Define a safe source and refresh strategy for popular Xbox and PlayStation catalog entries without handling platform transactions.
- [ ] Surface platform-specific popular games with loading, fallback, and creator-approval boundaries.
- [ ] Verify platform filtering, responsive booking-first layout, and no-funds wording after the catalog update.

- [x] Seed the initial viewer-facing story-driven titles: Red Dead Redemption 2, Kingdom Come: Deliverance II, Grand Theft Auto V, and S.T.A.L.K.E.R. 2.
- [x] Make the request board the first landing experience and use “Request a stream” consistently while preserving streamer flexibility.
- [x] Sweep viewer-facing copy for simple, precise guidance and reinforce that the site does not handle funds, codes, or platform transactions.
- [x] Replace numbered category labels with bold, large section headings and verify responsive presentation.

- [ ] Ensure approved AlmostLegitTV creator/catalog data visibly includes the four story-driven titles on the root request board.
- [ ] Finish the exact “Request a stream” terminology sweep across navigation, CTAs, modal copy, and status text.
- [ ] Verify the populated request board at desktop and mobile widths, including title order, bold headings, no-funds guidance, and request-flow copy.

- [x] Clone and inspect the public almostlegittv/a1 repository before editing.
- [x] Compare a1 with the current AlmostLegitTV booking-first implementation.
- [x] Port the agreed story-driven titles, request-first landing, terminology sweep, and heading hierarchy into a1.
- [x] Validate the a1 build and commit the implementation for Vercel redeployment.

- [x] Add an easy public entry point for creators to apply for a portfolio.
- [x] Add a creator application form for profile details, gamer tags, platforms, stream links, and catalog information.
- [x] Add private admin review procedures and a verification queue with approve, reject, and needs-changes states.
- [x] Ensure applicants cannot self-publish and unapproved applications never appear as public creator portfolios.
- [x] Add tests for application validation, admin authorization, review transitions, and no-funds boundaries.

- [ ] Review launch-critical product gaps beyond creator applications and booking.
- [ ] Define monetization options that do not process viewer payments, wallet funds, gift codes, or platform transactions.
- [ ] Prioritize a staged launch roadmap with measurable validation milestones.

- [x] Document the creator-application schema, verification states, audit history, and public-profile boundary.
- [x] Refine the admin review panel around verification evidence, reviewer notes, status transitions, and approval safeguards.
- [x] Add or update tests for review authorization, auditability, public visibility, and no-funds boundaries.

- [x] Refine the creator profile application form information architecture and field guidance.
- [x] Improve client-side validation, dynamic rows, submission states, and status feedback.
- [x] Verify authentication gating, responsive layout, privacy wording, and no-funds disclosure for the form workflow.

- [x] Add admin review queue filters and summary metrics for creator applications.
- [x] Improve application cards with verification progress, safer approval affordances, notes, and audit history.
- [x] Verify admin-only rendering, review actions, responsive layout, and public-visibility boundaries.

- [x] Define safe structural validation for public stream URLs and Xbox/PlayStation gamer tags.
- [x] Show automated validation results in creator submission and admin review interfaces without claiming account ownership.
- [x] Add tests for valid, invalid, unsupported, and no-credential validation cases.

- [x] Restore richer imagery and story-driven visual anchors on the request-first landing experience.
- [x] Increase useful first-viewport content density without weakening the primary request action.
- [x] Verify artwork loading, desktop/mobile balance, accessibility, and visual consistency with the Signal Raid system.

- [x] Review the request board, restored imagery, and image-loading behavior on desktop and mobile.
- [x] Review creator application and admin review usability, privacy, and authorization boundaries.
- [x] Run final checks and document confirmed issues versus prioritized recommendations.

- [x] Seed the preview database with the approved AlmostLegitTV creator profile and four story-driven catalog titles.
- [x] Verify the seed is duplicate-safe, correctly ordered, platform-labeled, and free of no-funds fields.
- [x] Verify the populated public request board displays the seeded catalog and request actions.

- [x] Make the authenticated AlmostLegitTV owner profile the default public example without inventing missing identity details.
- [x] Preserve the creator-application prompt alongside the owner profile and populated story catalog.
- [x] Verify duplicate-safe owner bootstrap, public request actions, privacy boundaries, and required sign-in prerequisite.

- [x] Check the live Vercel request board for the approved AlmostLegitTV profile and seeded story titles.
- [x] Verify live imagery, request actions, creator-application prompt, and public no-funds wording.
- [x] Distinguish any live mismatch between deployed code and the connected database.

- [ ] Identify the Vercel production database connection without exposing credentials.
- [ ] Run the canonical owner/profile seed against production using duplicate-safe logic.
- [ ] Verify the live Vercel board shows AlmostLegitTV and the four story titles.

- [x] Add a Vercel-compatible serverless entry point for the existing Express/tRPC API.
- [x] Route /api requests to the backend while preserving the SPA fallback for frontend routes.
- [x] Validate the production build and API route shape before pushing the deployment fix.

- [ ] Choose a beginner-friendly MySQL-compatible provider and create a database with SSL.
- [ ] Apply the AlmostLegitTV migrations and connect the database to Vercel securely.
- [ ] Redeploy, sign in as owner, and verify the live seeded profile and story catalog.

- [ ] Test the production MySQL connection locally without exposing DATABASE_URL.
- [ ] Run the Drizzle migration and verify the resulting schema safely.
- [ ] Record the migration result and next Vercel configuration step.

- [x] Remove the invalid `nodejs22.x` Vercel function runtime declaration.
- [x] Validate the corrected Vercel configuration and serverless API build.
- [x] Push the fix and confirm the mobile redeploy path.

- [x] Diagnose Vercel `ERR_MODULE_NOT_FOUND` in the deployed `/api/trpc` function.
- [x] Fix the Vercel serverless entrypoint or missing module reference.
- [x] Re-run checks, tests, and production build after the runtime fix.
- [ ] Push the Vercel runtime fix to `main` and verify the API response.

- [x] Fix Vercel’s incorrect `npm install --legacy-peer-deps` Install Command.
- [x] Validate dependency installation and the production build with the repository’s pnpm configuration.
- [ ] Push the install-command deployment fix and provide the correct Vercel redeploy action.

- [x] Run live performance checks against the current Vercel deployment.
- [x] Test the public catalog, search/filter/sort, platform switching, request-flow guardrails, creator application route, and production API.
- [x] Record live stability findings and classify expected states versus actionable errors.

- [x] Inspect the production seeding helpers, schema, and deployment environment requirements.
- [x] Design a duplicate-safe production seed procedure for the owner profile and four story titles.
- [x] Document the exact Vercel/MySQL steps and verification queries without exposing credentials.

- [x] Add a persisted viewer game-suggestion model with creator scoping, validation, and no-funds boundaries.
- [x] Add protected/public procedures for submitting and reviewing game suggestions.
- [x] Add a prominent Request a Game button and accessible suggestion form to the catalog page.
- [x] Add creator/admin visibility for submitted suggestions and test the complete flow.

## Priority completion pass

- [x] Priority 1: Finish creator profiles, profile editing, approval visibility, and creator-specific catalog identity.
- [x] Priority 2: Finish creator application submission, admin review, verification, approval, rejection, and onboarding handoff.
- [x] Priority 3: Finish authenticated booking requests, duplicate prevention, public status, and creator review transitions.
- [x] Priority 4: Finish ownership and availability logic across catalog, requests, and creator controls.
- [x] Priority 5: Finish the creator dashboard with profile, catalog, suggestion, and booking management.
- [x] Priority 6: Finish the admin dashboard with creator/application oversight and role-safe actions.
- [x] Priority 7: Add safe fake/test-user fixtures and verify the complete journey from application through booking and review.
- [x] Run the full test, build, migration, and visual verification pass for the seven-priority release.
