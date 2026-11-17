# Foundation Uno — Next

No item in this slot is authorised. It is a planning note, never executable authority.

## One unissued candidate

**Owner release decision (candidate only, not issued).** The publication engine is now proved end to end locally: with
a synthetic declaration the real production build serves published Home and About Pages in two authored locales, each
with a truthful `<html lang>`, canonical, same-Page `hreflang` alternates, a single `x-default` on the default Home, a
temporary `/en` redirect, and a `robots.txt` and `sitemap.xml` that agree with the HTML — while draft, unlisted, unknown
and malformed addresses remain real 404s. The committed declaration still states no base and publishes no Page, so the
deployed site is unchanged and refuses everything.

What remains is Owner work this Agent cannot infer: choosing the real HTTPS canonical origin, installing it as the
declared base, and publishing named real Pages. Then the proofs that a localhost fixture cannot supply: a live HTTPS
origin, real browser and accessibility behaviour, crawler behaviour, and an operational decision about when a rebuild is
acceptable. Two engineering dependencies remain open: the U04 JSON document contract and renderer before any JSON body
may be served, and the 17-family / 22-module parity obligations.

Three boundaries carry forward: a test-only origin is not a chosen production domain, a fixture publication is not a
delivered website, and a local production build is not a deployment.

That work needs its own Owner-installed work order, its own exact-path ledger and its own independent tests on
both hosts; nothing in this note authorises it.
