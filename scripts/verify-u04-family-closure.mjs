/**
 * Foundation Uno — the cumulative seventeen-family U04 closure oracle (`UNO-WO-084 / R01`).
 *
 * WHAT THIS IS. One pure, deterministic, side-effect-free evaluator that turns **executed** evidence into the closed set of
 * `PARITY_<FAMILY>` labels, the interim `U04_PARITY=n/17` count and the `U04_PROXY=n/59` progress count. It reads no file,
 * opens no socket, launches no browser and holds no fixture: the hosted runner
 * (`scripts/verify-u04-22-module-consent.mjs`) gathers real source/reader/renderer/HTTP/Chromium/refusal/rights
 * observations and hands them here.
 *
 * WHAT IT REFUSES. A family is credited only when **every** one of its seven evidence keys is the literal `true`; a missing
 * key, a `false`, a non-boolean, an unknown family, an unknown key, a broken immutable baseline or a score that disagrees
 * with the checkpoint's declared target refuses the whole evaluation. The score cannot be raised without evidence and
 * cannot be lowered by omission, so a partial checkpoint can never print a fuller claim.
 */

/** The seventeen donor families, in the audited Foundation order. Frozen so no caller can widen the denominator. */
export const U04_CLOSURE_FAMILIES = Object.freeze([
  "prose",
  "callout",
  "table",
  "list",
  "hero",
  "stats",
  "steps",
  "quote",
  "faq",
  "columns",
  "media",
  "gallery",
  "cards",
  "features",
  "actions",
  "contactForm",
  "divider",
]);

/** The seven independent evidence dimensions every credited family must prove at the exact product head. */
export const U04_EVIDENCE_DIMENSIONS = Object.freeze([
  "source",
  "reader",
  "renderer",
  "http",
  "browser",
  "refusal",
  "rights",
]);

/** The immutable pre-campaign baseline: 22 modules + 4 owned asset zones + 16 browser cases = 42 proxy entries. */
export const U04_IMMUTABLE_BASELINE = Object.freeze({ modules: 22, zones: 4, browserMatrix: 16 });

/** The campaign's declared interim targets. A checkpoint may only ever report its own row. */
export const U04_CHECKPOINT_TARGETS = Object.freeze({
  A1: Object.freeze({ parity: 3, proxy: 45 }),
  A2: Object.freeze({ parity: 5, proxy: 47, families: Object.freeze(["table", "list"]) }),
  B1: Object.freeze({ parity: 8, proxy: 50, families: Object.freeze(["hero", "stats", "steps"]) }),
  B2: Object.freeze({ parity: 11, proxy: 53, families: Object.freeze(["quote", "faq", "columns"]) }),
  C1: Object.freeze({ parity: 13, proxy: 55, families: Object.freeze(["media", "gallery"]) }),
  C2: Object.freeze({ parity: 15, proxy: 57, families: Object.freeze(["cards", "features"]) }),
  D: Object.freeze({ parity: 17, proxy: 59, families: Object.freeze(["actions", "contactForm"]) }),
});

/** The family every later checkpoint keeps proving, never re-crediting by omission. */
const IMMUTABLE_CREDITED = Object.freeze(["divider"]);

/** One closed refusal, as a literal reason string rather than an exception a runner could swallow. */
function refuse(reason) {
  return Object.freeze({ ok: false, reason });
}

/** Read one plain-own-property record, refusing arrays, class instances and prototype tricks. */
function plainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") return null;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) return null;
  }
  return value;
}

/**
 * Evaluate the cumulative closure claim.
 *
 * `families` must name every family that has **any** evidence at all; a family absent from it is honestly `PENDING`.
 * `checkpoint` selects the declared interim target the observed score must equal exactly.
 */
export function evaluateU04FamilyClosure({ families, modules, zones, browserMatrix, checkpoint } = {}) {
  const evidence = plainRecord(families);
  if (evidence === null) return refuse("closure:invalid-evidence");

  // The immutable baseline must be observed, not assumed.
  if (modules !== U04_IMMUTABLE_BASELINE.modules) return refuse("closure:module-count-changed");
  if (zones !== U04_IMMUTABLE_BASELINE.zones) return refuse("closure:asset-zone-count-changed");
  if (browserMatrix !== U04_IMMUTABLE_BASELINE.browserMatrix) return refuse("closure:browser-matrix-changed");

  const target = checkpoint === undefined ? undefined : U04_CHECKPOINT_TARGETS[checkpoint];
  if (checkpoint !== undefined && target === undefined) return refuse("closure:unknown-checkpoint");

  const credited = [];
  const pending = [];
  for (const family of U04_CLOSURE_FAMILIES) {
    if (!Object.prototype.hasOwnProperty.call(evidence, family)) {
      pending.push(family);
      continue;
    }
    const entry = plainRecord(evidence[family]);
    if (entry === null) return refuse("closure:invalid-family-evidence");
    for (const key of Object.keys(entry)) {
      if (!U04_EVIDENCE_DIMENSIONS.includes(key)) return refuse("closure:unknown-evidence-dimension");
    }
    let complete = true;
    for (const dimension of U04_EVIDENCE_DIMENSIONS) {
      if (!Object.prototype.hasOwnProperty.call(entry, dimension) || !isProven(entry[dimension])) {
        complete = false;
        break;
      }
    }
    if (complete) credited.push(family);
    else pending.push(family);
  }

  // Any family the evidence names but this oracle does not know is an invented family, never a silent extra credit.
  for (const family of Object.keys(evidence)) {
    if (!U04_CLOSURE_FAMILIES.includes(family)) return refuse("closure:unknown-family");
  }

  // The immutable `divider` baseline may never be dropped: it is re-proven at every head.
  for (const family of IMMUTABLE_CREDITED) {
    if (!credited.includes(family)) return refuse("closure:immutable-baseline-missing");
  }

  const parityCount = credited.length;
  const proxyCount =
    U04_IMMUTABLE_BASELINE.modules + U04_IMMUTABLE_BASELINE.zones + U04_IMMUTABLE_BASELINE.browserMatrix + parityCount;

  if (target !== undefined) {
    // A checkpoint reports exactly its own declared row: a lower score is an incomplete checkpoint, a higher one an
    // invented claim, and either refuses instead of being printed.
    if (parityCount !== target.parity) return refuse("closure:checkpoint-parity-mismatch");
    if (proxyCount !== target.proxy) return refuse("closure:proxy-mismatch");
    for (const family of target.families ?? []) {
      if (!credited.includes(family)) return refuse("closure:checkpoint-family-missing");
    }
  }

  const labels = [];
  for (const family of U04_CLOSURE_FAMILIES) {
    labels.push(
      credited.includes(family) ? `PARITY_${family.toUpperCase()}=PASS` : `PARITY_${family.toUpperCase()}=PENDING`,
    );
  }
  labels.push(`U04_PARITY=${parityCount}/17`);
  labels.push(`U04_PROXY=${proxyCount}/59`);
  labels.push(`U04_MODULE_IDS=${U04_IMMUTABLE_BASELINE.modules}/${U04_IMMUTABLE_BASELINE.modules}`);
  labels.push(`U04_ASSET_ZONES=${U04_IMMUTABLE_BASELINE.zones}/${U04_IMMUTABLE_BASELINE.zones}`);
  labels.push(`U04_BROWSER_MATRIX=${U04_IMMUTABLE_BASELINE.browserMatrix}/${U04_IMMUTABLE_BASELINE.browserMatrix}`);

  return Object.freeze({
    ok: true,
    credited: Object.freeze(credited),
    pending: Object.freeze(pending),
    parity: parityCount,
    proxy: proxyCount,
    labels: Object.freeze(labels),
  });
}

/** Build one complete evidence entry. Used by the runner and the mutant tests, never to assert a claim by itself. */
export function provenFamilyEvidence() {
  return Object.freeze(Object.fromEntries(U04_EVIDENCE_DIMENSIONS.map((dimension) => [dimension, true])));
}

/**
 * The oracle's own self-check: it proves the evaluator can print the A1 row from complete evidence and refuses obvious
 * mutants. It deliberately carries **no** product claim, so running it alone never credits a family.
 */
export function selfCheckU04FamilyClosure() {
  const complete = (names) => Object.fromEntries(names.map((family) => [family, provenFamilyEvidence()]));
  const a1 = evaluateU04FamilyClosure({
    families: complete(["divider", "prose", "callout"]),
    ...U04_IMMUTABLE_BASELINE,
    checkpoint: "A1",
  });
  if (!a1.ok || a1.parity !== 3 || a1.proxy !== 45) return refuse("closure:self-check-a1");
  if (!a1.labels.includes("PARITY_PROSE=PASS") || !a1.labels.includes("U04_PARITY=3/17")) {
    return refuse("closure:self-check-labels");
  }
  const dropped = { ...complete(["divider", "prose"]), callout: { ...provenFamilyEvidence(), refusal: false } };
  if (evaluateU04FamilyClosure({ families: dropped, ...U04_IMMUTABLE_BASELINE, checkpoint: "A1" }).ok) {
    return refuse("closure:self-check-partial");
  }
  const baselineOnly = evaluateU04FamilyClosure({ families: complete(["divider"]), ...U04_IMMUTABLE_BASELINE });
  if (!baselineOnly.ok || baselineOnly.parity !== 1) return refuse("closure:self-check-baseline");
  return Object.freeze({ ok: true, reason: null });
}

/** True only for the literal boolean `true`: `"true"`, `1` and `{}` never count as evidence. */
function isProven(value) {
  return value === true;
}
