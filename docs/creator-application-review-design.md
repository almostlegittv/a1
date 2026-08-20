# Creator application review design

## Purpose

The application workflow separates **private intake**, **admin verification**, and **public creator publishing**. A creator can submit information, but cannot make a portfolio public. Only an administrator can complete the review transition that creates or approves a public streamer profile.

## Data model

| Table | Responsibility | Publicly exposed? |
|---|---|---|
| `creator_applications` | Stores the applicant’s requested display name, slug, bio, gamer tags, stream links, starter catalog, current review status, reviewer notes, and reviewer identity. | No. This is private review data. |
| `creator_application_checks` | Stores individual verification units such as identity, gamer tag, stream profile, catalog, and policy acknowledgement. Each check has an evidence URL where appropriate and a status of unreviewed, verified, failed, or not applicable. | No. Admin-only. |
| `creator_application_events` | Append-only status history containing the actor, previous status, new status, note, and timestamp. | No. Admin-only. |
| `streamer_profiles` | Stores the public profile after approval, including approved gamer tags, approved stream links, verification timestamp, and verifying administrator. | Yes, but only when `approvalStatus = approved`. |
| `streamer_catalog` and `catalog_games` | Store the approved public game catalog created during approval. | Yes, filtered by approved profile and visible catalog state. |

The schema intentionally contains no payment, wallet, gift-code, service-fee, balance, or transaction fields.

## Review state machine

```text
pending → in_review → approved
                    ↘ needs_changes → pending
                    ↘ rejected
approved → suspended → approved or archived
```

An application begins as `pending`. An administrator can mark it `in_review` while checking the submitted information. `needs_changes` returns the application to the creator with reviewer notes; the creator can revise and resubmit the same record. `rejected` ends the current application without publishing anything. `approved` runs the profile-and-catalog creation transaction and copies only approved profile metadata to `streamer_profiles`.

## Admin panel workflow

The review queue is available at `/admin/applications` and is protected by the existing `adminProcedure`. Anonymous users and ordinary creator accounts see only the authorization gate.

Each application card presents the requested public identity, applicant account, bio, gamer tags, stream-profile links, and starter catalog. The administrator can open each submitted external profile in a new tab, compare the public identity, and record findings without requesting passwords or private account credentials.

The verification checklist is the central control surface. Each check can be marked **Verified**, **Failed**, **Unreviewed**, or **N/A**. The checklist is seeded when the application is submitted and includes an identity check, one check per gamer tag, one check per stream profile, a catalog check, and a no-funds policy check.

The review history is expandable and displays each status transition with the administrator or applicant actor, timestamp, and note. Reviewer notes are required as the practical explanation for requested changes, rejection, or unusual approval decisions.

Approval should be treated as a controlled action. Before selecting **Approve portfolio**, the administrator should confirm that identity, stream-profile, gamer-tag, catalog, and policy checks are either verified or intentionally marked not applicable. The approval transaction writes the public profile fields, creates the catalog entries, marks the application approved, marks checks verified, and records an approval event. Unapproved applications never appear in public creator routes.

## Recommended safeguards

The next refinement should enforce the checklist at the procedure layer: prevent approval when any required check remains unreviewed or failed, unless an administrator explicitly records an override note. Add a suspension action that hides the public profile without deleting its private application or audit history. Add report intake for public profiles and catalog entries, with every moderation action written to the same event history.

## Acceptance criteria

A creator can submit an application only while signed in. A creator cannot query the admin queue or verification checks. An anonymous visitor cannot see application records or an unapproved portfolio. An administrator can review every submitted external link and gamer tag, record per-check status, leave notes, and see the full history. Approval creates a public profile only after the protected admin mutation succeeds. The entire workflow remains outside payments, wallet funds, gift codes, and platform commerce.
