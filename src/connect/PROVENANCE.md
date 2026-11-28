# Connect in Foundation Uno — provenance, licence and scope

## Owner direction

On 2026-11-28 the Owner confirmed ownership of Connect and expressly authorised the incorporation of
Owner-owned Connect source into Foundation Uno **under Uno's main Apache-2.0 licence**. Connect is an integral
Uno module. It is not a separately licensed product and Uno does not depend on an externally maintained Connect
runtime.

That direction supersedes every earlier Uno record that excluded Connect or treated it as separately licensed.
The conflicting records are retired in this pass; the rights record in `NOTICE.md` and the execution report carry
the reconciled statement.

## What was incorporated

Source: the Owner-owned Connect module reached through the Foundation reference
`provelopment/00.foundation-template` at pinned commit `fa599973a88ff77f6a8e012f3266c3c139b52c17`,
`modules/connect/src` (`identifier` factories and the `projectPublicContact` contract).

Incorporated into `src/connect/` as an adapted, narrowed subset:

| Upstream contract | Uno file | Adaptation |
| --- | --- | --- |
| `identifier` brands and `MAX_IDENTIFIER_LENGTH` | `src/connect/identifier.ts` | Kept the brand-by-factory discipline and the bound; the five brands Uno can prove (deployment, owner, site, authorization, publisher). |
| `projectPublicContact` | `src/connect/public-contact.ts` | Kept the three-outcome decision shape (`available` / `absent` / `unavailable`) exactly. Narrowed the inputs to a single-Entity installation: no Hub/Spoke publisher registry, no runtime container. Added explicit exposure, suppression, revocation and provenance per method, and strict mailbox/telephone shapes that cannot carry a `mailto:` header or a second recipient. |

Nothing else from upstream is imported, copied or required. There is no `modules/` directory, no submodule, no
package dependency and no network call to any Connect service.

## Licence and attribution

- Uno's `LICENSE` (Apache-2.0) applies to every file in `src/connect/`.
- Copyright attribution to the Owner is retained in `NOTICE.md`.
- The Owner grant covers Owner-owned source only. It does not relicense unrelated third-party IP; no third-party
  source was copied into `src/connect/`, and the third-party notices that already applied to Uno are unchanged.

## What is deliberately absent

- No Hub/Spoke multi-Entity runtime, registry or publisher hierarchy.
- No separately licensed Connect distribution, package or service.
- No durable delivery, queue, retry engine or advanced transport. Connect here projects a public contact fact;
  delivery belongs to the mail transport port (`src/core/ports/uno-mail-transport.ts`) and its adapters.
