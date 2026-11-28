import { describe, expect, it } from "vitest";

import {
  resolveUnoDeployOrigin,
  UNO_NEUTRAL_BASE_CANONICAL,
} from "../../src/config/uno-deploy-origin";

/** The neutral declaration every case starts from, and a statement that says nothing. */
const NEUTRAL = { committedCanonical: UNO_NEUTRAL_BASE_CANONICAL };
const SILENT = { operator: null, hosted: false, vercelEnv: null, vercelProductionUrl: null };

describe("a deployment states the origin it is served on, and the engine judges that statement", () => {
  it("keeps the neutral declaration when nothing states an origin", () => {
    expect(resolveUnoDeployOrigin({ statement: SILENT, ...NEUTRAL })).toEqual({ mode: "neutral" });
  });

  it("accepts an operator's https origin and normalises it through the canonical validator", () => {
    const result = resolveUnoDeployOrigin({ statement: { ...SILENT, operator: "  https://www.example.org  " }, ...NEUTRAL });
    expect(result).toEqual({ mode: "declared", origin: "https://www.example.org", source: "operator" });
  });

  it("refuses an operator statement that is present and not an acceptable https origin", () => {
    for (const candidate of ["http://www.example.org", "https://www.example.org/path", "https://user:pass@www.example.org", "example.org", "https://*.example.org"]) {
      expect(resolveUnoDeployOrigin({ statement: { ...SILENT, operator: candidate }, ...NEUTRAL })).toEqual({
        mode: "refused",
        reason: "deploy-origin:invalid",
      });
    }
  });

  it("accepts a committed profile and refuses a malformed one instead of falling back", () => {
    expect(resolveUnoDeployOrigin({ statement: { ...SILENT, hosted: true }, ...NEUTRAL, profile: { version: 1, canonical: "https://profile.example" } })).toEqual({
      mode: "declared",
      origin: "https://profile.example",
      source: "profile",
    });
    for (const profile of [{ version: 2, canonical: "https://profile.example" }, { version: 1 }, { version: 1, canonical: "http://profile.example" }, { version: 1, canonical: "https://profile.example", extra: true }, "profile"]) {
      expect(resolveUnoDeployOrigin({ statement: { ...SILENT, hosted: true }, ...NEUTRAL, profile })).toEqual({
        mode: "refused",
        reason: "deploy-origin:invalid",
      });
    }
  });

  it("lets the operator outrank the committed profile", () => {
    const result = resolveUnoDeployOrigin({
      statement: { ...SILENT, operator: "https://operator.example", hosted: true },
      ...NEUTRAL,
      profile: { version: 1, canonical: "https://profile.example" },
    });
    expect(result).toMatchObject({ source: "operator", origin: "https://operator.example" });
  });

  it("honours a committed base that states a real origin, and never replaces it with a hosting profile", () => {
    expect(
      resolveUnoDeployOrigin({ statement: { ...SILENT, hosted: true },
        committedCanonical: "https://adopter.example",
        profile: { version: 1, canonical: "https://host.example" },
      }),
    ).toEqual({ mode: "neutral" });
  });

  it("takes the platform's production host only on a production deployment", () => {
    const production = { ...SILENT, hosted: true, vercelEnv: "production", vercelProductionUrl: "platform.example" };
    expect(resolveUnoDeployOrigin({ statement: production, ...NEUTRAL })).toEqual({
      mode: "declared",
      origin: "https://platform.example",
      source: "platform",
    });
    // A preview must never claim the production canonical address.
    expect(resolveUnoDeployOrigin({ statement: { ...production, vercelEnv: "preview" }, ...NEUTRAL })).toEqual({ mode: "neutral" });
  });

  it("refuses a platform host that is not a bare acceptable host", () => {
    expect(
      resolveUnoDeployOrigin({
        statement: { ...SILENT, hosted: true, vercelEnv: "production", vercelProductionUrl: "https://platform.example/path" },
        ...NEUTRAL,
      }),
    ).toEqual({ mode: "refused", reason: "deploy-origin:invalid" });
  });

  it("never reads a request or a Host header: the answer is a function of its input only", () => {
    const first = resolveUnoDeployOrigin({ statement: { ...SILENT, hosted: true }, ...NEUTRAL, profile: { version: 1, canonical: "https://profile.example" } });
    const second = resolveUnoDeployOrigin({ statement: { ...SILENT, hosted: true }, ...NEUTRAL, profile: { version: 1, canonical: "https://profile.example" } });
    expect(first).toEqual(second);
    expect(JSON.stringify(first)).not.toMatch(/host:/iu);
  });
});
