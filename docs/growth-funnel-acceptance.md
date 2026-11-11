# Benefactor growth funnel: production acceptance

This change is a **marketing-site source proposal**. It does not claim the live site,
quote API, attribution transport, CRM, or email-sending system is operational.

## Intended buyer path

1. B2B SaaS visitor lands on /b2b-saas/ and books a discovery call or reviews pricing.
2. /quote/ displays five tiers from one website source, src/data/quoteTiers.ts.
3. A prospect may submit a scoped quote to the configured API. A failure must
   never be presented as success; the page exposes a human booking/email fallback.
4. Qualified requests are later joined to CRM stage and closed-won outcomes by
   a private server-side ID, never by publishing contact details to browser analytics.

## Promotion gates

- [ ] Source CI: Node 22 and 24 tests, Astro build, sitemap parity and npm audit
      ran on the exact PR SHA with nonzero steps.
- [ ] Confirm GET /b2b-saas/ and GET /quote/ on the public origin after Pages sync.
- [ ] Before treating quote forms as production-ready, verify the API exposes
      POST /v1/quote-requests with an explicit, reviewed CORS origin policy,
      bounded input, abuse controls, idempotency, durable persistence and
      authenticated internal retrieval. Run synthetic submit/retry/failure tests
      against the deployed API. The current site is **not** evidence of these.
- [ ] Verify call scheduling, confirmation, customer notification, and CRM
      handoff using synthetic test prospects, without live customer PII.
- [ ] Website telemetry currently buffers without an authenticated transport;
      it must not be counted as conversion attribution until a privacy-reviewed,
      anonymous, durable production receiver is implemented and consent choices
      and retention rules have been reviewed.
- [ ] Reconcile the still-open benefactor-web-server.rs PR #17 weekly pricing
      against the current website's one-time/monthly quoteTiers.
- [ ] Publish testimonials, logos, or performance figures only with written
      customer permission and source metrics.

## Scorecard definitions

Track *qualified* prospects, not raw sends or scraped leads:

| Metric | Definition |
| --- | --- |
| Eligible accounts | Unique account domains meeting reviewed ICP and contact policy |
| Positive response rate | Meaningful positive responses / policy-compliant delivered first touches |
| Discovery booked | Confirmed booked calls, deduplicated by booking ID |
| Discovery held | Calls completed / confirmed bookings |
| Qualified opportunity | CRM opportunity with explicit buyer need, timing and owner |
| Proposal acceptance | Won proposals / signed-off proposals with known decision |
| Client acquisition cost | Attributable acquisition costs / new paying customers |
| Retained gross margin | Retained revenue minus directly attributable delivery costs |

Do not record revenue or customer acquisition from a click or form submission.
