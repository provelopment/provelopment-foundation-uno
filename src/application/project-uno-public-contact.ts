/**
 * Foundation Uno — project a Site's public contact facts (`U05`).
 *
 * WHAT THIS IS. The seam between authored EFS properties and the Connect module. It reads the resolved property
 * ancestry of one Site, translates exactly the facts that are public **and** explicitly exposed into Connect's
 * configuration document, supplies the runtime-proved authority, and returns Connect's decision unchanged.
 *
 * WHY THE TRANSLATION LIVES HERE. Properties know authorship; Connect knows publication. Neither should learn the
 * other's rules, so this use case composes them: a `public: true` fact that names no surface becomes no method at
 * all, and a suppressed or revoked fact can never reach the projection even if an ancestor exposed it.
 *
 * WHAT IT IS NOT. It does not read a request, a file, an environment value, a clock or a database, and it does not
 * render. It is a pure function of the validated manifest plus the authority the caller already proved.
 */
import { resolveUnoProperties, type UnoPropertyAncestryEntry, type UnoPropertyExposure } from "../core/efs/properties";
import { validateUnoManifestGraph, type UnoManifestGraph } from "../core/efs/manifest-graph";
import {
  PUBLIC_CONTACT_EXPOSURE,
  projectPublicContact,
  type PublicContactConfiguration,
  type PublicContactMethodDeclaration,
  type PublicContactProjection,
} from "../connect/public-contact";

/** Everything the projection needs, all of it already proved by the caller. */
export interface UnoPublicContactInput {
  /** The validated-or-untrusted authored manifest; it is validated here, never trusted. */
  readonly manifest: unknown;
  readonly facetId: string;
  readonly siteId: string;
  /** The verified request host. */
  readonly host: string;
  /** The canonical URL the planner proved for this publication; it is the authorisation reference. */
  readonly canonicalUrl: string;
  readonly publicationPublic: boolean;
}

/** True when one resolved fact carries the exposure grant for public contact. */
function exposed(fact: { readonly expose?: readonly UnoPropertyExposure[] }): boolean {
  return fact.expose !== undefined && fact.expose.includes(PUBLIC_CONTACT_EXPOSURE);
}

/** The single authored Entity, Facet and Site of one graph, or `null` when the graph does not contain them. */
function locate(
  graph: UnoManifestGraph,
  facetId: string,
  siteId: string,
): {
  readonly entity: UnoManifestGraph["entities"][number];
  readonly facet: UnoManifestGraph["entities"][number]["facets"][number];
  readonly site: UnoManifestGraph["entities"][number]["facets"][number]["sites"][number];
} | null {
  // Uno is a single-Entity product. A manifest that declares more than one Entity is not this product's shape,
  // and guessing which one "the" Entity is would be exactly the silent fallback the contract forbids.
  if (graph.entities.length !== 1) return null;
  const entity = graph.entities[0];
  if (entity === undefined) return null;
  const facet = entity.facets.find((candidate) => candidate.id === facetId);
  if (facet === undefined) return null;
  const site = facet.sites.find((candidate) => candidate.id === siteId);
  if (site === undefined) return null;
  return { entity, facet, site };
}

/**
 * Project the public contact facts of one Site.
 *
 * Every failure to find the Site is `absent`, not `unavailable`: an unconfigured installation is not broken, it
 * simply offers nothing. A malformed declaration is `unavailable`, which is Connect's job to distinguish.
 */
export function projectUnoPublicContact(input: UnoPublicContactInput): PublicContactProjection {
  const validated = validateUnoManifestGraph(input.manifest);
  if (!validated.accepted) return { kind: "absent", reason: "not-declared" };
  const found = locate(validated.graph, input.facetId, input.siteId);
  if (found === null) return { kind: "absent", reason: "not-declared" };

  const ancestry: UnoPropertyAncestryEntry[] = [
    {
      level: "entity",
      id: found.entity.id,
      ...(found.entity.properties === undefined ? {} : { properties: found.entity.properties }),
    },
    {
      level: "facet",
      id: found.facet.id,
      ...(found.facet.properties === undefined ? {} : { properties: found.facet.properties }),
    },
    {
      level: "site",
      id: found.site.id,
      ...(found.site.properties === undefined ? {} : { properties: found.site.properties }),
    },
  ];

  const resolved = resolveUnoProperties(ancestry);
  if (!resolved.accepted) return { kind: "unavailable", reason: "malformed" };

  const methods: PublicContactMethodDeclaration[] = [];
  for (const [key, channel] of [
    ["contact.email", "email"],
    ["contact.phone", "telephone"],
  ] as const) {
    const fact = resolved.resolved.properties[key];
    if (fact === undefined) continue;
    // A suppression or a revocation wins over any ancestor's grant, and an unexposed public fact publishes nothing.
    if (fact.status === "suppressed" || fact.value === null) continue;
    if (!fact.public || !exposed(fact)) continue;
    methods.push({
      channel,
      value: fact.value,
      expose: [PUBLIC_CONTACT_EXPOSURE],
      origin: { level: fact.origin.level, id: fact.origin.id },
    });
  }

  if (methods.length === 0) return { kind: "absent", reason: "not-declared" };

  const configuration: PublicContactConfiguration = {
    sites: { [found.site.id]: { siteId: found.site.id, authorizationRef: input.canonicalUrl, methods } },
  };

  return projectPublicContact({
    authority: {
      deploymentId: input.host,
      ownerId: found.entity.id,
      siteId: found.site.id,
      authorizationRef: input.canonicalUrl,
      publicationPublic: input.publicationPublic,
    },
    configuration,
  });
}
