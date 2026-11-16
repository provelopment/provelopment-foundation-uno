# Foundation Uno

Foundation Uno is an independent, Apache-2.0 Next.js and TypeScript website foundation built
around a single Entity.

## One Entity, four levels above it

The design starts with one owner and organises everything that owner publishes beneath it:

1. **Entity** — exactly one owner of the installation, and the only publisher in it.
2. **Facets** — named areas of that owner's presence, each with a single purpose.
3. **Sites** — one public Site is selected at a time; there is no fan-out and no hidden
   publisher.
4. **Pages** — authored content with one declared source answering for each representation.
5. **Localized representations** — explicitly authored, region-qualified locales such as
   `en-001`, never guessed from a browser header, a cookie or a visitor's address.

## What exists today

An authored EFS topology for one Entity is now declared in this repository: one Entity, one
Facet, one Site, one Home Page and one English representation (`en-001`) whose content is the
Markdown file you are reading. A pure validator accepts exactly that closed shape and refuses
zero Entities, two Entities, unknown fields, duplicate identifiers, unsafe source paths and any
claim of publication authority.

The runtime baseline builds and serves, its pure authoring contracts are unit tested, and
architecture tests keep framework and Node I/O imports out of the pure and application layers.

## What is still planned

- Reading this authored topology from disk, confining source paths and serving a Page through a
  real route — including visibility, search metadata and locale routing — is not implemented.
- The full presentation set of capability families and their modules is not implemented.
- No public Site is selected. Selecting one is a separate, deliberate configuration decision.

## What this file is not

This Markdown is an authoring source. It is not served by any route, it is not a published Page,
and it carries no publication, visibility or release authority. It grants no permission to
deploy, to index or to publish anything.
