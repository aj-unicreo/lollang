import { describe, expect, it } from "vitest";
import { OblulzcateError, obfuscate, oblulzcate } from "../src/oblulzcate.js";

describe("oblulzcate", () => {
  describe("trivial substitutions", () => {
    it("translates hello world", () => {
      expect(oblulzcate('console.log("Hello, world");')).toBe('xd("Hello, world");');
    });

    it("translates each JS keyword in isolation", () => {
      expect(oblulzcate("let x = 1;")).toBe("lol x = 1;");
      expect(oblulzcate("const x = 1;")).toBe("lmao x = 1;");
      expect(oblulzcate("function f() {}")).toBe("haha f() {}");
      expect(oblulzcate("function f() { return 1; }")).toBe("haha f() { rofl 1; }");
      expect(oblulzcate("if (x) {}")).toBe("lmfao (x) {}");
      expect(oblulzcate("while (x) {}")).toBe("hihi (x) {}");
      expect(oblulzcate("for (;;) {}")).toBe("heh (;;) {}");
      expect(oblulzcate("class X {}")).toBe("ahaha X {}");
      expect(oblulzcate("class X { m() { return this; } }")).toBe("ahaha X { m() { rofl me; } }");
      expect(oblulzcate("const x = new Set();")).toBe("lmao x = omegalul Set();");
      expect(oblulzcate("const x = true;")).toBe("lmao x = bahaha;");
      expect(oblulzcate("const x = false;")).toBe("lmao x = mwahaha;");
      expect(oblulzcate("const x = null;")).toBe("lmao x = teehee;");
    });
  });

  describe("else if collapse", () => {
    it("merges else+if into hehe", () => {
      const js = "if (a) { 1; } else if (b) { 2; }";
      expect(oblulzcate(js)).toBe("lmfao (a) { 1; } hehe (b) { 2; }");
    });

    it("chains multiple else-ifs", () => {
      const js = "if (a) { 1; } else if (b) { 2; } else if (c) { 3; } else { 4; }";
      const lol = oblulzcate(js);
      expect(lol).toContain("hehe (b)");
      expect(lol).toContain("hehe (c)");
      expect(lol).toContain("kek {");
    });

    it("preserves else without if", () => {
      const js = "if (a) { 1; } else { 2; }";
      expect(oblulzcate(js)).toBe("lmfao (a) { 1; } kek { 2; }");
    });
  });

  describe("console.log handling", () => {
    it("rewrites the call form to xd", () => {
      expect(oblulzcate('console.log("hi");')).toBe('xd("hi");');
    });

    it("does not rewrite other console methods", () => {
      expect(oblulzcate('console.error("nope");')).toBe('console.error("nope");');
      expect(oblulzcate('console.warn("ok");')).toBe('console.warn("ok");');
    });

    it("does not rewrite console.log used as a value", () => {
      // Out of scope for v1: only the call form is rewritten.
      const out = oblulzcate("const fn = console.log;");
      expect(out).toBe("lmao fn = console.log;");
    });

    it("does not rewrite computed access", () => {
      expect(oblulzcate('console["log"]("hi");')).toBe('console["log"]("hi");');
    });

    it("can be disabled", () => {
      expect(oblulzcate('console.log("hi");', { translateConsoleLog: false })).toBe(
        'console.log("hi");',
      );
    });
  });

  describe("undefined handling", () => {
    it("rewrites value-position undefined", () => {
      expect(oblulzcate("let x = undefined;")).toBe("lol x = imded;");
      expect(oblulzcate("if (x === undefined) {}")).toBe("lmfao (x === imded) {}");
    });

    it("does not rewrite property keys", () => {
      expect(oblulzcate("const o = { undefined: 1 };")).toBe("lmao o = { undefined: 1 };");
    });

    it("does not rewrite member access", () => {
      expect(oblulzcate("x.undefined")).toBe("x.undefined");
    });

    it("does not rewrite function names", () => {
      expect(oblulzcate("function undefined() {}")).toBe("haha undefined() {}");
    });

    it("does not rewrite parameter names", () => {
      // The parameter declaration is preserved; the body reference is
      // rewritten because `imded` compiles back to `undefined` and so the
      // round-trip is exact even when a param shadows the global.
      expect(oblulzcate("function f(undefined) { return undefined; }")).toBe(
        "haha f(undefined) { rofl imded; }",
      );
    });

    it("can be disabled", () => {
      expect(oblulzcate("let x = undefined;", { translateUndefined: false })).toBe(
        "lol x = undefined;",
      );
    });
  });

  describe("string and comment preservation", () => {
    it("leaves keywords inside strings", () => {
      expect(oblulzcate('let x = "function";')).toBe('lol x = "function";');
      expect(oblulzcate("let x = 'const';")).toBe("lol x = 'const';");
    });

    it("leaves keywords inside template literals", () => {
      expect(oblulzcate("let x = `if while const`;")).toBe("lol x = `if while const`;");
    });

    it("leaves keywords inside line comments", () => {
      expect(oblulzcate("// const is a keyword\nlet x = 1;")).toBe(
        "// const is a keyword\nlol x = 1;",
      );
    });

    it("leaves keywords inside block comments", () => {
      expect(oblulzcate("/* const */ let x = 1;")).toBe("/* const */ lol x = 1;");
    });
  });

  describe("async/await", () => {
    it("translates async function declarations", () => {
      expect(oblulzcate("async function f() {}")).toBe("giggle haha f() {}");
    });

    it("translates async function expressions", () => {
      expect(oblulzcate("const f = async function () {};")).toBe("lmao f = giggle haha () {};");
    });

    it("translates async arrow functions", () => {
      expect(oblulzcate("const f = async () => 1;")).toBe("lmao f = giggle () => 1;");
    });

    it("translates async methods", () => {
      const js = "class X { async m() { return await fetch(); } }";
      const lol = oblulzcate(js);
      expect(lol).toBe("ahaha X { giggle m() { rofl waitforit fetch(); } }");
    });
  });

  describe("modules", () => {
    it("translates import statements", () => {
      expect(oblulzcate('import x from "y";')).toBe('yoink x from "y";');
    });

    it("translates export statements", () => {
      expect(oblulzcate("export const x = 1;")).toBe("yeet lmao x = 1;");
    });
  });

  describe("error handling", () => {
    it("throws OblulzcateError on syntactically invalid JS", () => {
      expect(() => oblulzcate("let const = ;")).toThrow(OblulzcateError);
    });
  });

  describe("obfuscate alias", () => {
    it("is the same function", () => {
      expect(obfuscate).toBe(oblulzcate);
    });
  });
});
