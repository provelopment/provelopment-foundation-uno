import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import {
  UNO_SOURCE_LIMITS,
  UNO_SOURCE_READER_CODES,
  diagnoseUnoConfinedSource,
  observeUnoConfinedSource,
  type UnoSourceReaderCode,
} from "../../src/adapters/efs/uno-confined-source-reader";

/**
 * U03 confined-source-reader tests (`UNO-WO-020 / R01`).
 *
 * These cases exercise the **real** production adapter against the **real** filesystem: the committed
 * Home Markdown is read from this checkout, and every confinement fixture is an actual file, directory
 * or link created under the ignored `.temp/` scratch root. Nothing here mocks a read.
 *
 * Each refusal asserts the exact closed diagnostic code and that the code belongs to
 * `UNO_SOURCE_READER_CODES`, so an adapter that always accepted, always refused, or refused for the
 * wrong reason could not pass.
 */

const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HOME_SOURCE = "deployment/efs/content/home.en-001.md";
const SCRATCH_ROOT = join(REPO_ROOT, ".temp");

/** One isolated repository-shaped scratch root. */
const createdRoots: string[] = [];

function scratchRoot(): string {
  mkdirSync(SCRATCH_ROOT, { recursive: true });
  const root = mkdtempSync(join(SCRATCH_ROOT, "wo020-reader-"));
  createdRoots.push(root);
  return root;
}

/** Create the authored content directory inside a scratch root. */
function contentDir(root: string): string {
  const dir = join(root, "deployment", "efs", "content");
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Write one scratch source file and return its repository-relative declaration path. */
function writeSource(root: string, name: string, text: string | Buffer): string {
  const dir = contentDir(root);
  const absolute = join(dir, name);
  writeFileSync(absolute, text);
  return `deployment/efs/content/${name}`;
}

function expectCode(state: string, code: UnoSourceReaderCode): void {
  expect(state).not.toBe("valid");
  expect(UNO_SOURCE_READER_CODES).toContain(code);
}

/** Diagnose one declaration against one root and assert the exact closed code. */
function expectDiagnosis(
  root: unknown,
  declaration: unknown,
  expectedState: "absent" | "invalid",
  code: UnoSourceReaderCode,
): void {
  const diagnosis = diagnoseUnoConfinedSource({ repoRoot: root, declaration });
  expect(diagnosis.state).toBe(expectedState);
  expectCode(diagnosis.state, code);
  expect(diagnosis.code).toBe(code);
  expect(UNO_SOURCE_READER_CODES).toContain(diagnosis.code);
}

afterAll(() => {
  for (const root of createdRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("the real committed Home source", () => {
  it("observes the committed Markdown as a valid, bounded payload", () => {
    const observation = observeUnoConfinedSource({
      repoRoot: REPO_ROOT,
      declaration: { kind: "markdown", path: HOME_SOURCE },
    });
    expect(observation.state).toBe("valid");
  });

  it("returns the authored heading and body actually on disk", () => {
    const observation = observeUnoConfinedSource({
      repoRoot: REPO_ROOT,
      declaration: { kind: "markdown", path: HOME_SOURCE },
    });
    expect(observation.state).toBe("valid");
    if (observation.state !== "valid") return;

    const onDisk = readFileSync(join(REPO_ROOT, HOME_SOURCE), "utf8");
    expect(observation.source.kind).toBe("markdown");
    expect(observation.source.text).toBe(onDisk);
    expect(observation.source.text.startsWith("# Foundation Uno")).toBe(true);
    expect(observation.source.text.length).toBeGreaterThan(400);
  });

  it("carries no absolute path, no publication flag and no metadata", () => {
    const observation = observeUnoConfinedSource({
      repoRoot: REPO_ROOT,
      declaration: { kind: "markdown", path: HOME_SOURCE },
    });
    expect(observation.state).toBe("valid");
    if (observation.state !== "valid") return;
    expect(Object.keys(observation).sort()).toEqual(["source", "state"]);
    expect(Object.keys(observation.source).sort()).toEqual(["kind", "text"]);
    const serialised = JSON.stringify(observation);
    expect(serialised.includes("deployment/efs/content")).toBe(false);
    expect(serialised.includes(REPO_ROOT)).toBe(false);
  });

  it("reports the committed Home candidate as valid Markdown, never as JSON", () => {
    const diagnosis = diagnoseUnoConfinedSource({
      repoRoot: REPO_ROOT,
      declaration: { kind: "markdown", path: HOME_SOURCE },
    });
    expect(diagnosis).toEqual({ state: "valid", code: "source:valid" });
  });

  it("does not modify the committed source on disk", () => {
    const before = readFileSync(join(REPO_ROOT, HOME_SOURCE));
    observeUnoConfinedSource({
      repoRoot: REPO_ROOT,
      declaration: { kind: "markdown", path: HOME_SOURCE },
    });
    const after = readFileSync(join(REPO_ROOT, HOME_SOURCE));
    expect(after.equals(before)).toBe(true);
  });

  it("refuses to read the committed Markdown as JSON", () => {
    expectDiagnosis(
      REPO_ROOT,
      { kind: "json", path: HOME_SOURCE.replace(/\.md$/, ".json") },
      "absent",
      "path:absent",
    );
  });
});

describe("Markdown content validation", () => {
  it("accepts an authored heading with a real body", () => {
    const root = scratchRoot();
    const path = writeSource(root, "good.md", "# A title\n\nA real body paragraph.\n");
    const observation = observeUnoConfinedSource({ repoRoot: root, declaration: { kind: "markdown", path } });
    expect(observation.state).toBe("valid");
    if (observation.state !== "valid") return;
    expect(observation.source.text).toContain("A real body paragraph.");
  });

  it("accepts CRLF line endings", () => {
    const root = scratchRoot();
    const path = writeSource(root, "crlf.md", "# A title\r\n\r\nBody on CRLF.\r\n");
    const observation = observeUnoConfinedSource({ repoRoot: root, declaration: { kind: "markdown", path } });
    expect(observation.state).toBe("valid");
  });

  it("refuses an empty source", () => {
    const root = scratchRoot();
    const path = writeSource(root, "empty.md", "");
    expectDiagnosis(root, { kind: "markdown", path }, "invalid", "content:empty");
  });

  it("refuses a source whose first meaningful line is not a heading", () => {
    const root = scratchRoot();
    const path = writeSource(root, "no-heading.md", "Just a paragraph.\n");
    expectDiagnosis(root, { kind: "markdown", path }, "invalid", "content:markdown-heading");
  });

  it("refuses an empty heading", () => {
    const root = scratchRoot();
    const path = writeSource(root, "empty-heading.md", "#    \n\nBody.\n");
    expectDiagnosis(root, { kind: "markdown", path }, "invalid", "content:markdown-heading");
  });

  it("refuses a heading with no body", () => {
    const root = scratchRoot();
    const path = writeSource(root, "heading-only.md", "# A title\n");
    expectDiagnosis(root, { kind: "markdown", path }, "invalid", "content:markdown-body");
  });

  it("refuses raw HTML and script in Markdown", () => {
    const root = scratchRoot();
    const html = writeSource(root, "html.md", "# T\n\n<div>block</div>\n");
    expectDiagnosis(root, { kind: "markdown", path: html }, "invalid", "content:raw-html");
    const script = writeSource(root, "script.md", "# T\n\n<script>alert(1)</script>\n");
    expectDiagnosis(root, { kind: "markdown", path: script }, "invalid", "content:raw-html");
  });

  it("refuses invalid UTF-8 bytes", () => {
    const root = scratchRoot();
    const path = writeSource(root, "bad-utf8.md", Buffer.from([0x23, 0x20, 0x54, 0x0a, 0xff, 0xfe]));
    expectDiagnosis(root, { kind: "markdown", path }, "invalid", "decode:invalid-utf8");
  });

  it("refuses a NUL byte", () => {
    const root = scratchRoot();
    const path = writeSource(root, "nul.md", "# T\n\nBo\u0000dy\n");
    expectDiagnosis(root, { kind: "markdown", path }, "invalid", "content:nul");
  });

  it("refuses a control character", () => {
    const root = scratchRoot();
    const path = writeSource(root, "control.md", "# T\n\nBo\u0007dy\n");
    expectDiagnosis(root, { kind: "markdown", path }, "invalid", "content:control");
  });
});

describe("declared byte bounds", () => {
  it("accepts a source of exactly the declared cap", () => {
    const root = scratchRoot();
    const heading = "# T\n";
    const body = "a".repeat(UNO_SOURCE_LIMITS.contentBytes - heading.length);
    const path = writeSource(root, "at-cap.md", heading + body);
    const observation = observeUnoConfinedSource({ repoRoot: root, declaration: { kind: "markdown", path } });
    expect(observation.state).toBe("valid");
  });

  it("refuses one byte more than the declared cap", () => {
    const root = scratchRoot();
    const heading = "# T\n";
    const body = "a".repeat(UNO_SOURCE_LIMITS.contentBytes - heading.length + 1);
    const path = writeSource(root, "over-cap.md", heading + body);
    expectDiagnosis(root, { kind: "markdown", path }, "invalid", "path:too-large");
  });
});


describe("JSON content validation", () => {
  it("accepts an ordinary top-level object and keeps the original text", () => {
    const root = scratchRoot();
    const path = writeSource(root, "page.json", '{"title":"A page","body":"Text"}');
    const observation = observeUnoConfinedSource({ repoRoot: root, declaration: { kind: "json", path } });
    expect(observation.state).toBe("valid");
    if (observation.state !== "valid") return;
    expect(observation.source.kind).toBe("json");
    expect(observation.source.text).toBe('{"title":"A page","body":"Text"}');
  });

  it("refuses malformed JSON", () => {
    const root = scratchRoot();
    const path = writeSource(root, "broken.json", '{"title":');
    expectDiagnosis(root, { kind: "json", path }, "invalid", "content:json-parse");
  });

  it("refuses an array, a scalar and a null root", () => {
    const root = scratchRoot();
    for (const [name, text] of [
      ["array.json", "[]"],
      ["scalar.json", "5"],
      ["null.json", "null"],
    ] as const) {
      const path = writeSource(root, name, text);
      expectDiagnosis(root, { kind: "json", path }, "invalid", "content:json-shape");
    }
  });

  it("refuses prototype-polluting keys anywhere in the tree", () => {
    const root = scratchRoot();
    const top = writeSource(root, "proto-top.json", '{"__proto__":{"x":1}}');
    expectDiagnosis(root, { kind: "json", path: top }, "invalid", "content:json-pollution");
    const nested = writeSource(root, "proto-nested.json", '{"a":{"constructor":{"x":1}}}');
    expectDiagnosis(root, { kind: "json", path: nested }, "invalid", "content:json-pollution");
  });

  it("refuses excessive nesting depth", () => {
    const root = scratchRoot();
    let nested = '{"leaf":1}';
    for (let level = 0; level < 12; level += 1) nested = `{"a":${nested}}`;
    const path = writeSource(root, "deep.json", nested);
    expectDiagnosis(root, { kind: "json", path }, "invalid", "content:json-depth");
  });

  it("refuses an excessively wide object", () => {
    const root = scratchRoot();
    const keys: string[] = [];
    for (let index = 0; index < UNO_SOURCE_LIMITS.jsonKeysPerObject + 8; index += 1) {
      keys.push(`"k${index}":1`);
    }
    const path = writeSource(root, "wide.json", `{${keys.join(",")}}`);
    expectDiagnosis(root, { kind: "json", path }, "invalid", "content:json-width");
  });
});

describe("declaration grammar", () => {
  it("refuses a traversal declaration", () => {
    const root = scratchRoot();
    contentDir(root);
    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/efs/content/../escape.md" },
      "invalid",
      "declaration:invalid-path",
    );
  });

  it("refuses an absolute drive path, a backslash and a percent escape", () => {
    const root = scratchRoot();
    contentDir(root);
    for (const path of [
      "C:/Windows/x.md",
      "/etc/passwd.md",
      "deployment\\efs\\content\\x.md",
      "deployment/efs/content/x%2e.md",
    ]) {
      expectDiagnosis(root, { kind: "markdown", path }, "invalid", "declaration:invalid-path");
    }
  });

  it("refuses a hidden filename and a wrong suffix", () => {
    const root = scratchRoot();
    contentDir(root);
    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/efs/content/.hidden.md" },
      "invalid",
      "declaration:invalid-path",
    );
    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/efs/content/x.txt" },
      "invalid",
      "declaration:invalid-path",
    );
    expectDiagnosis(
      root,
      { kind: "json", path: "deployment/efs/content/x.md" },
      "invalid",
      "declaration:invalid-path",
    );
  });

  it("refuses a declaration outside the authored content root", () => {
    const root = scratchRoot();
    contentDir(root);
    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/other/x.md" },
      "invalid",
      "path:outside-content-root",
    );
  });

  it("does not accept a common-prefix sibling directory", () => {
    const root = scratchRoot();
    const sibling = join(root, "deployment", "efs", "content-evil");
    mkdirSync(sibling, { recursive: true });
    writeFileSync(join(sibling, "x.md"), "# T\n\nbody\n");
    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/efs/content-evil/x.md" },
      "invalid",
      "path:outside-content-root",
    );
  });

  it("refuses an unknown declared kind", () => {
    const root = scratchRoot();
    expectDiagnosis(root, { kind: "yaml", path: HOME_SOURCE }, "invalid", "declaration:invalid-kind");
  });

  it("refuses a directory where a source file was declared", () => {
    const root = scratchRoot();
    mkdirSync(join(contentDir(root), "dir.md"), { recursive: true });
    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/efs/content/dir.md" },
      "invalid",
      "path:not-a-regular-file",
    );
  });

  it("reports a genuinely missing declared file as absent, never invalid", () => {
    const root = scratchRoot();
    contentDir(root);
    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/efs/content/missing.md" },
      "absent",
      "path:absent",
    );
  });
});


describe("physical confinement", () => {
  it("refuses a linked intermediate directory", () => {
    const root = scratchRoot();
    const content = contentDir(root);
    const elsewhere = join(root, "elsewhere");
    mkdirSync(elsewhere, { recursive: true });
    writeFileSync(join(elsewhere, "x.md"), "# T\n\nbody\n");
    symlinkSync(elsewhere, join(content, "linked"), "junction");

    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/efs/content/linked/x.md" },
      "invalid",
      "path:symlink",
    );
  });

  it("refuses a linked final component, even when it is named like a source", () => {
    const root = scratchRoot();
    const content = contentDir(root);
    const elsewhere = join(root, "elsewhere-file");
    mkdirSync(elsewhere, { recursive: true });
    writeFileSync(join(elsewhere, "payload.md"), "# T\n\nbody\n");
    symlinkSync(elsewhere, join(content, "linked.md"), "junction");

    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/efs/content/linked.md" },
      "invalid",
      "path:symlink",
    );
  });

  it("refuses a linked content root", () => {
    const root = scratchRoot();
    const other = join(root, "real-content");
    mkdirSync(other, { recursive: true });
    writeFileSync(join(other, "x.md"), "# T\n\nbody\n");
    mkdirSync(join(root, "deployment", "efs"), { recursive: true });
    symlinkSync(other, join(root, "deployment", "efs", "content"), "junction");

    expectDiagnosis(
      root,
      { kind: "markdown", path: "deployment/efs/content/x.md" },
      "invalid",
      "path:symlink",
    );
  });

  it("keeps the linked target unreachable through any accepted observation", () => {
    const root = scratchRoot();
    const content = contentDir(root);
    const elsewhere = join(root, "elsewhere");
    mkdirSync(elsewhere, { recursive: true });
    writeFileSync(join(elsewhere, "x.md"), "# Leaked\n\nsecret body\n");
    symlinkSync(elsewhere, join(content, "linked"), "junction");

    const observation = observeUnoConfinedSource({
      repoRoot: root,
      declaration: { kind: "markdown", path: "deployment/efs/content/linked/x.md" },
    });
    expect(observation.state).toBe("invalid");
    expect(JSON.stringify(observation).includes("Leaked")).toBe(false);
  });
});

describe("trusted root validation", () => {
  it("refuses a missing or non-string root", () => {
    for (const root of [undefined, null, 42, {}]) {
      expectDiagnosis(root, { kind: "markdown", path: HOME_SOURCE }, "invalid", "root:not-a-string");
    }
  });

  it("refuses a relative root", () => {
    expectDiagnosis(".", { kind: "markdown", path: HOME_SOURCE }, "invalid", "root:not-absolute");
    expectDiagnosis("deployment", { kind: "markdown", path: HOME_SOURCE }, "invalid", "root:not-absolute");
  });

  it("refuses a root that does not exist", () => {
    expectDiagnosis(
      join(SCRATCH_ROOT, "definitely-absent-root-wo020"),
      { kind: "markdown", path: HOME_SOURCE },
      "invalid",
      "root:unresolvable",
    );
  });

  it("refuses a regular file as the root", () => {
    const root = scratchRoot();
    const file = join(root, "root-file.md");
    writeFileSync(file, "# T\n\nbody\n");
    expectDiagnosis(file, { kind: "markdown", path: HOME_SOURCE }, "invalid", "root:not-a-directory");
  });

  it("refuses a linked root", () => {
    const base = scratchRoot();
    const real = join(base, "real-root");
    mkdirSync(real, { recursive: true });
    const link = join(base, "linked-root");
    symlinkSync(real, link, "junction");
    expectDiagnosis(link, { kind: "markdown", path: HOME_SOURCE }, "invalid", "root:symlink");
  });
});


describe("hostile request input", () => {
  it("refuses an accessor without invoking it", () => {
    let reads = 0;
    const request = {
      get repoRoot(): string {
        reads += 1;
        return REPO_ROOT;
      },
      declaration: { kind: "markdown", path: HOME_SOURCE },
    };
    const diagnosis = diagnoseUnoConfinedSource(request);
    expect(diagnosis.state).toBe("invalid");
    expect(diagnosis.code).toBe("input:not-plain");
    expect(reads).toBe(0);
  });

  it("refuses a symbol-keyed request", () => {
    const withSymbol: Record<PropertyKey, unknown> = {
      repoRoot: REPO_ROOT,
      declaration: { kind: "markdown", path: HOME_SOURCE },
    };
    withSymbol[Symbol("extra")] = true;
    expect(diagnoseUnoConfinedSource(withSymbol).code).toBe("input:not-plain");
  });

  it("refuses an exotic prototype", () => {
    class Request {
      repoRoot = REPO_ROOT;
      declaration = { kind: "markdown", path: HOME_SOURCE };
    }
    expect(diagnoseUnoConfinedSource(new Request()).code).toBe("input:not-plain");
  });

  it("refuses a request whose Proxy trap throws", () => {
    const hostile = new Proxy(
      { repoRoot: REPO_ROOT, declaration: { kind: "markdown", path: HOME_SOURCE } },
      {
        ownKeys(): string[] {
          throw new Error("hostile");
        },
      },
    );
    expect(diagnoseUnoConfinedSource(hostile).code).toBe("input:not-plain");
  });

  it("refuses an unexpected request shape", () => {
    for (const request of [
      { repoRoot: REPO_ROOT },
      { repoRoot: REPO_ROOT, declaration: { kind: "markdown", path: HOME_SOURCE }, extra: 1 },
      { repoRoot: REPO_ROOT, declaration: { kind: "markdown" } },
      { repoRoot: REPO_ROOT, declaration: { kind: "markdown", path: HOME_SOURCE, extra: 1 } },
      { repoRoot: REPO_ROOT, declaration: "not-an-object" },
    ]) {
      expect(diagnoseUnoConfinedSource(request).code).toBe("input:unexpected-shape");
    }
  });

  it("does not mutate the request, the declaration or the file", () => {
    const declaration = { kind: "markdown", path: HOME_SOURCE };
    const request = { repoRoot: REPO_ROOT, declaration };
    const before = JSON.stringify(request);
    observeUnoConfinedSource(request);
    expect(JSON.stringify(request)).toBe(before);
    expect(Object.keys(declaration).sort()).toEqual(["kind", "path"]);
    expect(lstatSync(join(REPO_ROOT, HOME_SOURCE)).isFile()).toBe(true);
  });

  it("never throws for any hostile value", () => {
    const values: unknown[] = [
      undefined,
      null,
      0,
      "",
      [],
      [REPO_ROOT],
      new Map(),
      Symbol("x"),
      () => undefined,
    ];
    for (const value of values) {
      expect(() => observeUnoConfinedSource(value)).not.toThrow();
      expect(diagnoseUnoConfinedSource(value).state).not.toBe("valid");
    }
  });
});
