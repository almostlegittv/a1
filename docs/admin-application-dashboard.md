# Admin creator-application dashboard

The admin review experience is available at `/admin/applications` and is protected by the existing admin-only tRPC procedures. Anonymous visitors and ordinary users see an authorization gate rather than private applicant data.

## Dashboard layout

The header explains the purpose of the verification desk and links back to admin onboarding. Four summary cards show total applications, applications needing attention, applications with requested changes, and approved portfolios. These metrics are derived from the current private queue.

The queue toolbar supports text search across creator name, requested slug, applicant name, and applicant email. A status filter narrows the queue to pending, in-review, needs-changes, approved, or rejected records. A sort control switches between newest-first and creator-name order. The filtering and sorting logic lives in a pure helper with unit coverage.

## Application cards

Each card displays the requested public identity, applicant account, bio, gamer tags, external stream profiles, starter catalog, current status, submission date, and verification progress. External links open in a separate tab for cross-reference.

The verification checklist is the primary review control. Each item can be marked unreviewed, verified, failed, or not applicable. The card also exposes the application’s audit history and a reviewer-notes field. The dashboard does not ask for passwords, private credentials, payment details, wallet balances, gift codes, or platform transaction information.

## Approval safeguard

The **Approve portfolio** action remains disabled until every seeded verification check is marked verified or not applicable and no check is failed. Other review transitions remain available so the administrator can mark an application in review, request changes, or reject it. The server-side approval procedure remains the final authority and performs the public-profile creation transaction.

## Responsive behavior

The metrics collapse from four columns to two on smaller screens. The queue search receives its own row, filters stack vertically on narrow screens, application progress wraps cleanly, and review controls remain reachable without horizontal scrolling.
