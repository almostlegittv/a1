# AlmostLegitTV launch and monetization recommendations

## Executive recommendation

AlmostLegitTV should not monetize by taking a percentage of a game purchase, receiving wallet funds, storing gift codes, charging a service fee on a stream request, or processing viewer payments. That would undermine the product’s clearest differentiator: the site is a neutral request, discovery, verification, and scheduling layer while Xbox and PlayStation remain responsible for their own commerce.

The strongest near-term model is a **free creator application and public portfolio**, followed by a paid **Creator Pro toolkit** once the platform demonstrates repeat usage. In parallel, the site can sell carefully labeled sponsorship placements to gaming brands or creator networks. The first objective should be proof of demand, not immediate extraction of revenue from a small audience.

## Highest-priority product work

| Priority | Implementation | Why it matters |
|---|---|---|
| P0 | Store verified gamer tags and approved stream-profile links on the public streamer profile when an application is approved. | The current application stores these details for review, but approval should also publish the verified fields that belong on a creator portfolio. |
| P0 | Add an application audit trail with reviewer, timestamp, status transition, notes, and reason for rejection or requested changes. | This makes moderation explainable and gives the administrator a defensible record of why a profile became public. |
| P0 | Add report and suspend controls for public creator profiles, stream links, catalog entries, and request statuses. | A public multi-creator directory needs a clear response when information becomes inaccurate or a creator violates platform rules. |
| P0 | Add email or in-app notifications for application received, changes requested, approved, rejected, and new stream requests. | Manual review is workable at small scale, but silent queues will become a bottleneck quickly. |
| P1 | Add a creator profile completeness checklist. | The checklist should cover display name, bio, gamer tags, verified stream links, platform selection, catalog, and disclosure acceptance. |
| P1 | Add creator analytics. | Measure profile views, catalog searches, request starts, completed request submissions, duplicate attempts, and clicks to external stream profiles. |
| P1 | Add public policy pages for privacy, community reporting, creator verification, and the no-funds boundary. | These pages make the product easier to explain to creators, viewers, sponsors, and possible platform partners. |
| P1 | Add rate limits and moderation tools for applications and requests. | This reduces spam and protects the review queue without adding payment infrastructure. |

The most important technical gap is the first one. Gamer tags and verified stream links should not remain only in the private application record if the approved portfolio is supposed to look like the original creator page. Add approved fields to `streamer_profiles`, and copy them into that profile only during an admin approval transaction. Keep the original application as the private audit record.

## Recommended revenue sequence

### Stage 1: Free beta and demand proof

Keep creator applications, public portfolios, and basic stream requests free. Invite a small group of creators and measure whether viewers actually browse catalogs and submit requests. The goal is to prove that the platform creates useful stream ideas and repeat engagement.

The beta should measure profile views, unique catalog visitors, request conversion, repeat viewers, creator response time, percentage of requests receiving a status update, creator retention, and the number of requests that lead viewers to an external stream profile. These metrics are more valuable than raw page views because they show whether the workflow creates creator utility.

### Stage 2: Creator Pro subscription

Once creators receive consistent value, offer optional paid tools. Do not put the public portfolio behind a paywall at first. The free tier should preserve the basic portfolio and request workflow; the paid tier should save time or improve visibility.

| Plan | Suggested positioning | Candidate features |
|---|---|---|
| Free | Verified public creator profile | Profile, approved catalog, request status board, basic links, manual review. |
| Creator Pro | More control and insight | Analytics, catalog import assistance, custom profile sections, request filters, saved response templates, priority support, and profile customization. |
| Network or agency | Multi-creator operations | Multiple creator profiles, team reviewer seats, shared moderation, cross-creator analytics, and campaign reporting. |

A reasonable testing range would be a low monthly creator price rather than a large upfront fee. The exact price should be tested with the first participating creators instead of assumed in advance. The important design principle is that creators pay for software utility, not for permission to process viewer funds.

### Stage 3: Sponsored programming

Sell clearly labeled sponsorship placements around a stream season, creator challenge, or story-driven game campaign. A sponsor could support a themed discovery page, a creator showcase, or a limited-time catalog feature. The sponsor should pay AlmostLegitTV directly under a written agreement; viewers should not be asked to route money through the site.

Sponsored content must be labeled, creators should know what is being promoted, and the site should never imply that a sponsor guarantees a game purchase or a stream date. Sponsorship reporting can focus on impressions, profile visits, catalog engagement, request starts, and external click-throughs.

### Stage 4: Partnership and licensing opportunities

After the platform has real usage data, present a concise partnership package to creator networks, streaming communities, game publishers, or platform-adjacent organizations. The pitch should be about structured viewer demand and creator programming data—not about handling Xbox or PlayStation commerce.

A partnership package should show the number of verified creators, active profiles, catalog searches, request submissions, repeat viewers, average creator response time, and examples of how a request became a stream segment. Do not lead with a broad claim that a platform will partner; first create a measurable case study.

## Monetization approaches to avoid

Avoid taking a percentage of any off-site purchase, asking viewers to report wallet transfers, collecting gift codes, charging a mandatory booking fee, holding balances, or making a stream appear guaranteed after a purchase. Avoid a pay-to-rank system that makes viewers believe a creator has endorsed a title merely because it is promoted. These approaches would conflict with the product’s no-funds promise and could create difficult consumer-expectation and platform-policy issues.

Affiliate links should not be the first monetization strategy. Even when checkout occurs elsewhere, affiliate tracking can make the site appear to be directing or profiting from a purchase flow. If affiliate relationships are ever considered, they should be reviewed separately, disclosed clearly, and kept outside the request workflow.

## Practical 90-day roadmap

| Period | Main outcome | Success gate |
|---|---|---|
| Days 1–30 | Finish verified profile fields, audit log, reporting, notifications, and policy pages. | A creator can apply, receive a review decision, publish only after approval, and understand every privacy and no-funds boundary. |
| Days 31–60 | Run a controlled beta with a small group of invited creators. | Creators complete onboarding, viewers submit real requests, and administrators can resolve inaccurate or abusive content. |
| Days 61–90 | Add analytics and interview beta creators about paid value. | At least a few creators can identify a recurring time-saving or growth benefit worth paying for. |
| After day 90 | Test Creator Pro and one labeled sponsorship package. | Revenue comes from software utility or sponsorship value, not viewer transactions. |

## Recommended immediate next implementation

The next build should be **verified public creator profiles plus moderation and notifications**. Specifically, add approved gamer tags and stream links to `streamer_profiles`, add a reviewer audit table, add report/suspend actions, and add application/request status notifications. Once those are in place, run the free beta and collect evidence before deciding the final Creator Pro price.

This sequence keeps the platform’s promise simple: **viewers request streams, creators decide what fits, administrators verify who is public, and revenue comes from creator software and sponsorship value—not from handling money.**
