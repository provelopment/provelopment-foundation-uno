# Foundation Uno — Next

No item in this slot is authorised. It is a planning note, never executable authority.

## One unissued candidate

**Owner release decision (candidate only, not issued).** The U03 publication engine is proved end to end locally and its
proof is now transactional: a synthetic declaration makes the real production build serve published Home and About Pages
in two authored locales with truthful `<html lang>`, canonical, same-Page `hreflang`, one `x-default` on the default
Home, a temporary `/en` redirect, and a `robots.txt` and `sitemap.xml` that agree with the HTML; draft, unlisted, unknown
and malformed addresses stay real 404s. The fixture cannot survive a failure — recovery is armed before the first write
and a restoration that cannot be verified fails closed with its backups kept. The committed declaration still states no
base and publishes no Page, so the deployed site is unchanged and refuses everything.

Four Owner decisions are outstanding and cannot be inferred by an Agent: the real HTTPS canonical origin; which real
authored Pages may be `published`; whether and when the protected `/` demonstration is replaced or retired; and whether a
rebuild-to-publish operation is approved, since a published address exists only after a build enumerates it.

Proofs a localhost fixture cannot supply remain open: a live HTTPS origin, real browser and accessibility behaviour, and
crawler behaviour. Two engineering dependencies remain: the U04 JSON document contract and renderer before any JSON body
may be served, and the 17-family / 22-module parity obligations.

Three boundaries carry forward: a test-only origin is not a chosen production domain, a fixture publication is not a
delivered website, and a local production build is not a deployment.

That work needs its own Owner-installed work order, its own exact-path ledger and its own independent tests on
both hosts; nothing in this note authorises it.
