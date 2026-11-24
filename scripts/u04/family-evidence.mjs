/**
 * Foundation Uno — the seven-dimension family evidence record (`UNO-WO-112 / R01`).
 *
 * WHY THIS IS A MODULE. The closure oracle credits a family only when every one of its seven dimensions is the literal
 * `true`. That contract was previously open-coded in a 4,000-line runner, where a typo in a key name would silently leave
 * a family pending. Here the keys, the constructor and the conjunction are one cohesive, testable unit, and the runner
 * only ever fills and reads records built by it.
 *
 * WHAT IT IS NOT. This module never decides parity: it records what executed. The unchanged closure oracle remains the one
 * authority that turns complete records into a `PARITY_<FAMILY>` label and an interim count.
 */

/** The seven independent dimensions every credited family must prove at the exact product head. */
export const FAMILY_EVIDENCE_KEYS = Object.freeze([
  "source",
  "reader",
  "renderer",
  "http",
  "browser",
  "refusal",
  "rights",
]);

/** One fresh, all-`false` evidence record. A record can only become creditable by executing every dimension. */
export function createFamilyEvidence() {
  return Object.fromEntries(FAMILY_EVIDENCE_KEYS.map((key) => [key, false]));
}

/** The dimensions still missing from one record, in contract order. Empty means the family is complete. */
export function missingDimensions(record) {
  if (record === null || typeof record !== "object") return [...FAMILY_EVIDENCE_KEYS];
  return FAMILY_EVIDENCE_KEYS.filter((key) => record[key] !== true);
}

/** True only when every one of the seven dimensions is the literal `true` — never a truthy stand-in. */
export function isCreditable(record) {
  return missingDimensions(record).length === 0 && Object.keys(record).length === FAMILY_EVIDENCE_KEYS.length;
}

/**
 * The four-case browser conjunction the credited families use: every required key must have been recorded by an assertion
 * that actually ran and passed at that viewport and colour scheme. A deleted, skipped or superficial case can never leave
 * the conjunction true.
 */
export function conjunction(recordedCases, required = ["light:390", "light:1280", "dark:390", "dark:1280"]) {
  const cases = recordedCases instanceof Set ? recordedCases : new Set(recordedCases ?? []);
  return required.every((key) => cases.has(key));
}

/** The recorded/missing pairs for one conjunction, so a failure names exactly which case was absent. */
export function conjunctionDetail(recordedCases, required = ["light:390", "light:1280", "dark:390", "dark:1280"]) {
  const cases = recordedCases instanceof Set ? recordedCases : new Set(recordedCases ?? []);
  return JSON.stringify(required.map((key) => [key, cases.has(key)]));
}
