# Creator profile form workflow

## Entry and access

The request board links to `/apply/creator` with a visible creator prompt. The page checks the signed-in session before rendering private application controls. Anonymous visitors see a sign-in gate; they do not receive the form or any application data.

## Form structure

The form is organized into four guided sections. **Public identity** collects the display name, requested slug, and short bio. **Gamer tags** collects Xbox and PlayStation handles. **Stream profiles** collects public URLs that administrators can cross-reference; the form explicitly tells applicants never to enter passwords or private credentials. **Starter catalog** collects the first games, platform, genre, and optional creator note.

A four-part progress indicator shows whether each section is ready. Dynamic rows allow applicants to add or remove gamer tags, stream profiles, and games without leaving the page. The form is keyboard reachable, labels dynamic rows, and exposes invalid fields through `aria-invalid` and visible error text.

## Validation and submission

Client-side validation catches short display names, invalid slugs, missing bios, incomplete gamer-tag rows, stream URLs without an `http` or `https` protocol, and empty starter catalogs. The same requirements remain enforced by the server-side tRPC input schema. The validation helper is isolated in `client/src/lib/creatorApplication.ts` and covered by frontend tests.

On a valid submission, the UI disables the submit action, shows a submission state, and refreshes the applicant’s private status. A successful submission displays a review message. A server error is presented as an alert without exposing implementation details.

Applicants with `pending` or `in_review` status see a status-only view rather than a second application form. Applicants marked `needs_changes` see the reviewer note, their previous draft is prefilled, and the action changes to **Resubmit for review**. Approved applicants receive a link to their public portfolio. Rejected applicants may start a new submission while the previous record remains in the private audit history.

## Privacy and no-funds boundary

The page states that submitted information remains private until approval. It does not collect payment details, wallet funds, gift codes, platform credentials, or transaction details. Public visibility is created only by the protected administrator approval mutation.
