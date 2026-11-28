# Connect and mail delivery — operator guide

Contact delivery is **OFF** in every default installation. This guide is what an operator reads before turning it
on. Nothing here is required to run Foundation Uno.

## What is on by default

| Capability | Default | What turns it on |
| --- | --- | --- |
| Public contact facts (`mailto:` / `tel:` projection) | publishes only what a Site authors and explicitly exposes | `contact.email` / `contact.phone` with `public: true` **and** `expose: ["publicContact"]` |
| SIMPLE contact form | inert notice | an authored `interaction.contact` section, a Site-authored contact fact, and a selected transport |
| Mail transport | none | `UNO_CONTACT_TRANSPORT` (`offline` or `resend`), or a previously configured webhook |
| Contact form | absent | explicit `UNO_CONTACT_FORM_ENABLED`, `UNO_CONTACT_FORM_SITE`, `UNO_CONTACT_FORM_PAGE` **and** a private delivery policy |
| Private delivery policy | unset | `UNO_CONTACT_RECIPIENT`, `UNO_CONTACT_SENDER`, `UNO_CONTACT_SENDER_DOMAINS`, `UNO_CONTACT_REPLY_TO` |
| Analytics | off | an authored analytics declaration **and** an operator destination |

Publication, identity, ownership and privacy authority are decided outside these capabilities. Turning a transport on
never publishes a contact address, and publishing an address never enables a form.

## The transports

| Selection | Transmits | Outcome for an accepted submission |
| --- | --- | --- |
| unset, nothing else configured | no | `unavailable` — nothing is sent or stored |
| `offline` | **no** | `accepted-not-sent` — the whole path is exercised and the visitor is told nothing was sent |
| `resend` | yes, once | `accepted` — the provider accepted the message for delivery |
| a pre-existing `UNO_CONTACT_WEBHOOK_URL` | yes, once | `accepted` — the allowlisted receiver answered 2xx |

There is no queue, no retry, no scheduler and no persistence. One authorised submission makes exactly one attempt.

## Resend setup, in order

1. **Account security.** Create the account, then enable MFA on it and on the identity provider that guards it. Keep
   the account role-separated: the person who rotates keys need not be the person who reads mail.
2. **Dedicated sending subdomain.** Verify a subdomain used only for this application (for example
   `mail.example.com`), never the apex of a domain that also carries human mail.
3. **DNS.** Enter the **exact** SPF and DKIM records the dashboard supplies, at the provider that hosts the zone, and
   nothing else. Publish DMARC as monitoring first (`p=none` with a reporting address), read the reports, and only
   then move to `quarantine`/`reject`. Resend's documentation is authoritative: <https://resend.com/docs>.
4. **Least-privilege API key.** Generate a dedicated **sending-only** key restricted to the verified domain, and use a
   separate key per environment. See <https://resend.com/changelog/new-api-key-permissions>.
5. **Secret storage.** Put the key only in the hosting provider's secret store or an ignored local environment file.
   Never in Git, a client bundle, authored content, a screenshot or a ticket.
6. **Sender and recipients.** Configure the verified `From` and the operator's own recipients on the server. A
   visitor can never choose either: their address is only ever a `Reply-To`.
7. **Environment separation.** Production keys and domains in production only. A preview deployment should run
   `offline`; it should never be able to send real mail.
8. **Idempotency.** Every attempt carries an opaque, non-PII `Idempotency-Key` derived from the attempt, so a
   duplicated request cannot become a duplicated message. This is not a claim of cross-instance exactly-once
   delivery. See <https://resend.com/changelog/idempotency-keys>.

## Configuration names

Copy `deployment/uno.env.example` and fill it in a secret store. The names are exact and the adapter reads no others.

| Name | Purpose |
| --- | --- |
| `UNO_CONTACT_TRANSPORT` | `offline` or `resend`. Absent means no transport. |
| `RESEND_API_KEY` | the sending-only key (`re_…`). Server only. |
| `UNO_CONTACT_FROM` | the verified sender: `Name <noreply@mail.example.com>` |
| `UNO_CONTACT_TO` | comma-separated server-allowlisted recipients (maximum 5) |
| `UNO_CONTACT_FROM_DOMAINS` | comma-separated domains the sender must belong to |
| `UNO_CONTACT_RECIPIENT` | the private recipient list (maximum 5). Never rendered, never returned |
| `UNO_CONTACT_SENDER` | the private sender. Must belong to a listed domain |
| `UNO_CONTACT_SENDER_DOMAINS` | the domains a sender may belong to |
| `UNO_CONTACT_REPLY_TO` | `visitor` (default) or `none` |
| `UNO_CONTACT_FORM_ENABLED` | `1`/`true` to allow a form at all |
| `UNO_CONTACT_FORM_SITE` | the exact `facetId/siteId` the form may serve |
| `UNO_CONTACT_FORM_PAGE` | the exact Page id whose declared form may submit |

The adapter refuses a delivery when any of these is missing, malformed, or names a sender outside the listed
domains. It refuses rather than falling back.

## Behaviour an operator can rely on

- **One fixed destination.** The adapter dials `https://api.resend.com/emails` and nothing else; the host is
  resolved, every answer is classified, and the validated address is pinned. A redirect is refused, not followed.
- **Bounded.** Request and response are capped, the whole exchange has a deadline, and the response body is never
  parsed, echoed or stored.
- **Redacted diagnostics.** A failure is reported as one closed code (`mail:timeout`, `mail:provider-rejected`,
  `mail:unauthorized-recipient`, and so on). No key, address, subject or body is ever logged or returned.
- **Truthful outcomes.** `accepted` means the provider accepted the message. It never means delivered, opened or
  read. An ambiguous exchange is reported as `ambiguous`, never as success.

## Abuse, privacy and cost

- The form carries a honeypot, an origin check, server-side re-validation of the Page, form and Site, one shared
  authorisation policy for render and submit, and a bounded streamed body read.
- The in-process limiter is **per instance**. On a multi-instance deployment it is not distributed protection: add
  platform rate limiting and WAF rules for that, and do not describe the in-process limiter as distributed.
- Messages are transient: Uno stores nothing. The provider keeps its own logs, so retention and privacy notices must
  describe that; consent, retention and deletion belong to the operator policy.
- Monitor quota and spend in the provider dashboard. A contact form that starts sending to a large list is a billing
  incident before it is a mail incident.

## Testing, rotation and recovery

- **Controlled smoke test.** Set `UNO_CONTACT_TRANSPORT=offline`, submit the form, and confirm the visitor is told
  nothing was sent. Then switch to `resend` with a recipient you control and send one message.
- **Rotation.** Create the new key, deploy it to the secret store, confirm one successful send, then revoke the old
  key. Rotating on a schedule is cheaper than rotating after an incident.
- **Revocation.** Revoke in the dashboard; the adapter then answers `mail:unauthorized-sender` and nothing is sent.
  No Uno change is required.
- **Disable.** Remove `UNO_CONTACT_TRANSPORT` (or set it to `offline`) and redeploy. The form returns to its honest
  inert notice; nothing else about the Site changes.
- **Incident response.** Revoke and rotate the key, read the provider send log for the affected window, notify per
  your own policy, and record the window in the execution report. Uno stores no copy of any message, so the provider
  log is the only record of what was sent.
