import { describe, expect, it } from "vitest";
import { KEYWORDS, LOL_KEYWORD_SET, REVERSE_KEYWORDS } from "../src/keywords.js";

describe("KEYWORDS", () => {
  it("matches the spec count (29 keywords)", () => {
    expect(Object.keys(KEYWORDS).length).toBe(29);
  });

  it("maps every spec keyword to the right JS form", () => {
    expect(KEYWORDS).toMatchObject({
      lol: "let",
      lmao: "const",
      haha: "function",
      rofl: "return",
      lmfao: "if",
      hehe: "else if",
      kek: "else",
      hihi: "while",
      heh: "for",
      lulz: "break",
      jaja: "continue",
      bahaha: "true",
      mwahaha: "false",
      teehee: "null",
      imded: "undefined",
      ahaha: "class",
      omegalul: "new",
      me: "this",
      lolwut: "try",
      lolnope: "catch",
      ded: "throw",
      kekw: "switch",
      pepega: "case",
      lulw: "default",
      xd: "console.log",
      yoink: "import",
      yeet: "export",
      giggle: "async",
      waitforit: "await",
    });
  });

  it("LOL keywords are unique", () => {
    expect(new Set(Object.keys(KEYWORDS)).size).toBe(Object.keys(KEYWORDS).length);
  });

  it("JS values for single-token keywords are unique", () => {
    const singles = Object.values(KEYWORDS).filter((v) => !v.includes(" ") && !v.includes("."));
    expect(new Set(singles).size).toBe(singles.length);
  });

  it("LOL_KEYWORD_SET contains every key", () => {
    for (const k of Object.keys(KEYWORDS)) {
      expect(LOL_KEYWORD_SET.has(k)).toBe(true);
    }
  });

  it("REVERSE_KEYWORDS excludes multi-token forms", () => {
    expect(REVERSE_KEYWORDS["else if"]).toBeUndefined();
    expect(REVERSE_KEYWORDS["console.log"]).toBeUndefined();
  });

  it("REVERSE_KEYWORDS round-trips single-token entries", () => {
    expect(REVERSE_KEYWORDS.let).toBe("lol");
    expect(REVERSE_KEYWORDS.const).toBe("lmao");
    expect(REVERSE_KEYWORDS.function).toBe("haha");
    expect(REVERSE_KEYWORDS.return).toBe("rofl");
    expect(REVERSE_KEYWORDS.if).toBe("lmfao");
    expect(REVERSE_KEYWORDS.else).toBe("kek");
    expect(REVERSE_KEYWORDS.true).toBe("bahaha");
    expect(REVERSE_KEYWORDS.this).toBe("me");
  });
});
