# Site review findings — 2026-08-20

The local request board at `/` renders the restored studio/computers image correctly. The main headline and request-first explanation remain readable against the left-side dark area, while the broadcast desk and monitors add atmosphere on the right. The first viewport contains the platform switcher, catalog panel, public-request panel, creator-application prompt, and no-funds disclosure.

The most important confirmed limitation is data-state related: the preview currently reports `0 of 0 titles` and says the creator profile is unavailable or not approved. This makes the page feel empty even though the composition is visually stronger. The production experience will need an approved creator profile and published catalog data to show the four story-driven cards and request actions.

The creator application route at `/apply/creator` also renders the restored studio image and has a clear anonymous sign-in gate. It explains manual review and no self-publishing. The visible sign-in state is concise and privacy-safe; the actual multi-step form is only available after authentication.

The primary visual recommendation is to retain the studio image and add a populated-data fallback or approved owner seed so first-time visitors see useful story picks rather than an empty-state panel. The primary product recommendation is to ensure the deployment database contains the approved AlmostLegitTV profile and initial catalog before evaluating the final public experience.

The admin review route at `/admin/applications` is correctly protected in the anonymous state. It shows an explicit administrator sign-in gate and the verification-boundary message, while private applicant details, review cards, and approval controls remain hidden. The restored studio image is consistent across the public, creator-application, and admin entry screens.

The recent local network log shows successful 200 responses for the booking-profile and authentication requests used during review. No recent 4xx/5xx or failed asset requests were found in the reviewed log tail. The empty board is therefore not a frontend crash; it is the expected result of the preview database returning no approved creator profile/catalog for the requested slug.
