/**
 * Foundation Uno — the governed external-video embed policy (`UNO-WO-041 / R01`, U04).
 *
 * One positive and one negative suite per provider, plus URL assembly, strict ID/host isolation and the consent
 * projection. No network is used: the policy is pure, and these tests assert the exact constructed destination.
 */
import { describe, expect, it } from "vitest";

import {
  UNO_VIDEO_EMBED_ORIGINS,
  UNO_VIDEO_EMBED_PREFIXES,
  UNO_VIDEO_PROVIDERS,
  isUnoVideoProvider,
  readUnoVideoEmbed,
  unoVideoProviderLabel,
} from "../../src/core/video/uno-video-embeds";

/** The constructed URL of an accepted descriptor, failing loudly when the fixture is refused. */
function urlOf(embed: Record<string, unknown>): string {
  const result = readUnoVideoEmbed(embed);
  if (!result.ok) throw new Error(`fixture refused: ${result.reason}`);
  return result.projection.embedUrl;
}

/** The refusal literal of a refused descriptor, failing loudly when the fixture is accepted. */
function refusalOf(embed: unknown) {
  const result = readUnoVideoEmbed(embed);
  if (result.ok) throw new Error("fixture was accepted but must be refused");
  return result.reason;
}

describe("the provider vocabulary", () => {
  it("names exactly the four governed providers with their exact literals", () => {
    expect([...UNO_VIDEO_PROVIDERS]).toEqual(["youtube", "vimeo", "rumble", "bitchute"]);
    for (const provider of UNO_VIDEO_PROVIDERS) {
      expect(isUnoVideoProvider(provider)).toBe(true);
      expect(unoVideoProviderLabel(provider)).not.toBe("");
    }
    for (const near of ["YouTube", "youtube ", " youtube", "youtube2", "Vimeo", "rumble.", "bitchut", "__proto__"]) {
      expect(isUnoVideoProvider(near)).toBe(false);
    }
  });

  it("exposes exactly four fixed origins and one prefix per provider", () => {
    expect(UNO_VIDEO_EMBED_ORIGINS).toHaveLength(4);
    expect(Object.keys(UNO_VIDEO_EMBED_PREFIXES).sort()).toEqual([...UNO_VIDEO_PROVIDERS].sort());
    for (const origin of UNO_VIDEO_EMBED_ORIGINS) {
      expect(origin.startsWith("https://")).toBe(true);
      expect(origin.includes("*")).toBe(false);
    }
  });
});

describe("YouTube", () => {
  it("constructs the privacy-enhanced embed endpoint from an eleven-character ID", () => {
    expect(urlOf({ provider: "youtube", videoId: "dQw4w9WgXcQ" })).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(urlOf({ provider: "youtube", videoId: "abc_DEF-123" })).toBe(
      "https://www.youtube-nocookie.com/embed/abc_DEF-123",
    );
  });

  it("refuses wrong lengths, watch URLs, extra query and a Vimeo hash", () => {
    expect(refusalOf({ provider: "youtube", videoId: "short" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "youtube", videoId: "dQw4w9WgXcQx" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "youtube", videoId: "https://youtu.be/dQw4w9WgXcQ" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "youtube", videoId: "dQw4w9WgXcQ?autoplay=1" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "youtube", videoId: "dQw4w9WgXcQ", vimeoHash: "abcdef12" })).toBe(
      "video:hash-forbidden",
    );
  });
});

describe("Vimeo", () => {
  it("constructs the DNT endpoint and appends the optional privacy hash", () => {
    expect(urlOf({ provider: "vimeo", videoId: "76979871" })).toBe("https://player.vimeo.com/video/76979871?dnt=1");
    expect(urlOf({ provider: "vimeo", videoId: "76979871", vimeoHash: "abcdef12" })).toBe(
      "https://player.vimeo.com/video/76979871?dnt=1&h=abcdef12",
    );
  });

  it("refuses a leading zero, a non-numeric ID, an overlong ID and a malformed hash", () => {
    expect(refusalOf({ provider: "vimeo", videoId: "076979871" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "vimeo", videoId: "abc12345" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "vimeo", videoId: "-12345" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "vimeo", videoId: "1".repeat(21) })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "vimeo", videoId: "76979871", vimeoHash: "ABCDEF12" })).toBe("video:hash-invalid");
    expect(refusalOf({ provider: "vimeo", videoId: "76979871", vimeoHash: "abc" })).toBe("video:hash-invalid");
    expect(refusalOf({ provider: "vimeo", videoId: "76979871", vimeoHash: "a".repeat(65) })).toBe(
      "video:hash-invalid",
    );
  });
});

describe("Rumble", () => {
  it("constructs the fixed embed endpoint for a plain and a dotted ID", () => {
    expect(urlOf({ provider: "rumble", videoId: "v17j3tt" })).toBe("https://rumble.com/embed/v17j3tt/");
    expect(urlOf({ provider: "rumble", videoId: "u4nvf6q.v70bqqu" })).toBe(
      "https://rumble.com/embed/u4nvf6q.v70bqqu/",
    );
  });

  it("refuses a single character, two dots, a leading or trailing dot and an overlong ID", () => {
    expect(refusalOf({ provider: "rumble", videoId: "a" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "rumble", videoId: "a.b.c" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "rumble", videoId: ".ab" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "rumble", videoId: "ab." })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "rumble", videoId: "a".repeat(65) })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "rumble", videoId: "ab-cd" })).toBe("video:id-invalid");
  });
});

describe("BitChute", () => {
  it("constructs the fixed embed endpoint from a 5–64 character ID", () => {
    expect(urlOf({ provider: "bitchute", videoId: "abcde" })).toBe("https://www.bitchute.com/embed/abcde/");
    expect(urlOf({ provider: "bitchute", videoId: "aB_9-h" })).toBe("https://www.bitchute.com/embed/aB_9-h/");
  });

  it("refuses a short ID, a slash, a dot and an overlong ID", () => {
    expect(refusalOf({ provider: "bitchute", videoId: "abcd" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "bitchute", videoId: "abc/de" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "bitchute", videoId: "abc.de" })).toBe("video:id-invalid");
    expect(refusalOf({ provider: "bitchute", videoId: "a".repeat(65) })).toBe("video:id-invalid");
  });
});

describe("hostile and mixed shapes", () => {
  it("refuses unknown keys, missing fields and non-string IDs", () => {
    expect(refusalOf({ provider: "youtube", videoId: "dQw4w9WgXcQ", src: "https://youtu.be/x" })).toBe(
      "video:shape-invalid",
    );
    expect(refusalOf({ provider: "youtube", videoId: "dQw4w9WgXcQ", allow: "autoplay" })).toBe(
      "video:shape-invalid",
    );
    expect(refusalOf({ videoId: "dQw4w9WgXcQ" })).toBe("video:shape-invalid");
    expect(refusalOf({ provider: "youtube" })).toBe("video:shape-invalid");
    expect(refusalOf({ provider: "youtube", videoId: 12345678901 })).toBe("video:id-invalid");
    expect(refusalOf(null)).toBe("video:shape-invalid");
    expect(refusalOf([])).toBe("video:shape-invalid");
  });

  it("refuses every hostile identifier form for every provider", () => {
    const hostile = [
      "javascript:alert(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
      "//evil.example/x",
      "https://evil.example/x",
      "<script>alert(1)</script>",
      "a%2Fb",
      "a b",
      "a\tb",
      "a\u0000b",
      "\u0442\u0435\u0441\u0442",
      "abc?x=1",
      "abc#f",
      "user:pass@host",
      "../up",
    ];
    for (const provider of UNO_VIDEO_PROVIDERS) {
      for (const videoId of hostile) {
        expect(readUnoVideoEmbed({ provider, videoId }).ok).toBe(false);
      }
    }
  });

  it("refuses a near-spelling or mixed-case provider without repairing it", () => {
    for (const provider of ["YouTube", "youtube ", "vimeo ", "Rumble", "BitChute", "youtube-nocookie", "vimeo2"]) {
      expect(refusalOf({ provider, videoId: "dQw4w9WgXcQ" })).toBe("video:provider-unknown");
    }
  });

  it("projects only public constructed values", () => {
    const result = readUnoVideoEmbed({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.projection).sort()).toEqual([
      "embedUrl",
      "externalFallbackUrl",
      "provider",
      "providerLabel",
    ]);
    expect(result.projection.providerLabel).toBe("YouTube");
    expect(result.projection.externalFallbackUrl).toBe(result.projection.embedUrl);
    expect(JSON.stringify(result.projection).includes("token")).toBe(false);
  });
});

