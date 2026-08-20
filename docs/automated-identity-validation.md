# Automated identity validation

## Scope

Automated checks provide structural signals only. They do not log in to Xbox, PlayStation, TikTok, Twitch, YouTube, Kick, or any other service. They do not prove account ownership, profile activity, identity, or endorsement. Administrators must still open the submitted public profile and make the final review decision.

## Stream-link checks

The validator parses the submitted URL, accepts only `http://` or `https://`, rejects URLs containing embedded usernames or passwords, and checks known hosts for TikTok, Twitch, YouTube, and Kick. A known host with a non-empty path receives a **passed** format result. A valid but unexpected host or an unsupported platform receives a **warning** for manual review. Missing, malformed, credential-bearing, or unsupported-protocol URLs receive a **failed** result.

## Gamer-tag checks

Xbox checks allow a base name up to 12 characters with an optional `#` suffix within the conservative length rules used by the application. PlayStation checks allow 3–16 letters, numbers, hyphens, or underscores. Characters outside the conservative Xbox ASCII check receive a **warning** rather than an automatic rejection because the platform supports a broader Unicode range than this lightweight validator attempts to model.

## Review-panel behavior

Automated results are stored on each `creator_application_checks` row as `automatedStatus` and `automatedNote`. The admin card shows these results beside the manual status selector. A failed automated result is a reason to inspect the submission; it does not by itself claim fraud or ownership failure. The manual reviewer can still mark the check verified, failed, or not applicable after reviewing public evidence.

Approval remains protected by the manual checklist. Every check must be marked verified or not applicable, and no check may be manually failed. Automated results inform the reviewer but do not replace the administrator’s public cross-reference step.

## Privacy boundary

Applicants are told to submit public profile URLs only. The application never requests passwords, private credentials, payment details, wallet balances, gift codes, or platform transaction data.
