import { describe, expect, it } from "vitest";
import { transpile, unlulzcate } from "../src/unlulzcate.js";

describe("unlulzcate", () => {
  describe("trivial substitutions", () => {
    it("translates hello world", () => {
      expect(unlulzcate('xd("Hello, world");')).toBe('console.log("Hello, world");');
    });

    it("translates each spec keyword in isolation", () => {
      expect(unlulzcate("lol x = 1;")).toBe("let x = 1;");
      expect(unlulzcate("lmao x = 1;")).toBe("const x = 1;");
      expect(unlulzcate("haha f() {}")).toBe("function f() {}");
      expect(unlulzcate("rofl x;")).toBe("return x;");
      expect(unlulzcate("bahaha")).toBe("true");
      expect(unlulzcate("mwahaha")).toBe("false");
      expect(unlulzcate("teehee")).toBe("null");
      expect(unlulzcate("imded")).toBe("undefined");
      expect(unlulzcate("me.x")).toBe("this.x");
      expect(unlulzcate("ded e;")).toBe("throw e;");
      expect(unlulzcate("giggle haha f() {}")).toBe("async function f() {}");
      expect(unlulzcate("waitforit x")).toBe("await x");
    });

    it("expands `hehe` to `else if`", () => {
      expect(unlulzcate("} hehe (x) {")).toBe("} else if (x) {");
    });

    it("expands `xd` to `console.log`", () => {
      expect(unlulzcate("xd(42)")).toBe("console.log(42)");
    });
  });

  describe("case-insensitivity", () => {
    it("handles uppercase keywords", () => {
      expect(unlulzcate("LMAO X = 1;")).toBe("const X = 1;");
    });

    it("handles mixed case", () => {
      expect(unlulzcate("LoL x = HaHa")).toBe("let x = function");
    });
  });

  describe("string and comment preservation", () => {
    it("does not touch keywords inside double-quoted strings", () => {
      expect(unlulzcate('lol x = "haha";')).toBe('let x = "haha";');
    });

    it("does not touch keywords inside single-quoted strings", () => {
      expect(unlulzcate("lol x = 'rofl';")).toBe("let x = 'rofl';");
    });

    it("does not touch keywords inside template literals", () => {
      expect(unlulzcate("lol x = `lmao haha kek`;")).toBe("let x = `lmao haha kek`;");
    });

    it("does not touch keywords inside line comments", () => {
      expect(unlulzcate("// haha is not function\nlol x = 1;")).toBe(
        "// haha is not function\nlet x = 1;",
      );
    });

    it("does not touch keywords inside block comments", () => {
      expect(unlulzcate("/* xd kek lmao */ lol x = 1;")).toBe("/* xd kek lmao */ let x = 1;");
    });

    it("handles escapes in strings", () => {
      expect(unlulzcate('lol x = "\\"haha\\"";')).toBe('let x = "\\"haha\\"";');
    });
  });

  describe("$ escape", () => {
    it("strips $ to allow keyword-shaped identifiers", () => {
      expect(unlulzcate("lol $haha = 1;")).toBe("let haha = 1;");
    });

    it("does not affect non-keyword $-identifiers", () => {
      expect(unlulzcate("lol $foo = 1;")).toBe("let foo = 1;");
    });
  });

  describe("non-substitutions", () => {
    it("leaves unrelated identifiers alone", () => {
      expect(unlulzcate("lol fizzbuzz = 1;")).toBe("let fizzbuzz = 1;");
    });

    it("does not match keywords inside larger identifiers", () => {
      expect(unlulzcate("lol mehaha = 1;")).toBe("let mehaha = 1;");
      expect(unlulzcate("lol roflcopter = 1;")).toBe("let roflcopter = 1;");
    });

    it("preserves operators and punctuation", () => {
      expect(unlulzcate("lol x = 1 + 2 * 3 / 4 - 5 % 6;")).toBe("let x = 1 + 2 * 3 / 4 - 5 % 6;");
    });
  });

  describe("spec examples", () => {
    it("transpiles fizzbuzz", () => {
      const lol = `heh (lol i = 1; i <= 15; i = i + 1) {
    lmfao (i % 15 == 0) {
        xd("FizzBuzz");
    } hehe (i % 3 == 0) {
        xd("Fizz");
    } hehe (i % 5 == 0) {
        xd("Buzz");
    } kek {
        xd(i);
    }
}`;
      const js = unlulzcate(lol);
      expect(js).toContain("for (let i = 1; i <= 15; i = i + 1)");
      expect(js).toContain("if (i % 15 == 0)");
      expect(js).toContain("else if (i % 3 == 0)");
      expect(js).toContain("else if (i % 5 == 0)");
      expect(js).toContain("else {");
      expect(js).toContain('console.log("FizzBuzz");');
    });

    it("transpiles factorial", () => {
      const lol = `haha factorial(n) {
    lmfao (n <= 1) {
        rofl 1;
    }
    rofl n * factorial(n - 1);
}`;
      const js = unlulzcate(lol);
      expect(js).toContain("function factorial(n)");
      expect(js).toContain("if (n <= 1)");
      expect(js).toContain("return 1;");
      expect(js).toContain("return n * factorial(n - 1);");
    });

    it("transpiles class with try/catch", () => {
      const lol = `ahaha Cat {
    haha constructor(name) {
        me.name = name;
    }
    haha meow() {
        rofl me.name + " says lol";
    }
}

lolwut {
    lmao c = omegalul Cat("Whiskers");
    xd(c.meow());
} lolnope (e) {
    ded e;
}`;
      const js = unlulzcate(lol);
      expect(js).toContain("class Cat {");
      // The `haha` in `haha constructor(name)` is elided inside a class body
      // because JS forbids `function` at method position.
      expect(js).toContain("constructor(name)");
      expect(js).not.toContain("function constructor");
      expect(js).toContain("this.name = name;");
      expect(js).toContain("try {");
      expect(js).toContain("const c = new Cat(");
      expect(js).toContain("} catch (e) {");
      expect(js).toContain("throw e;");
    });

    it("desugars class methods (haha → empty inside class body)", () => {
      const lol = `ahaha X {
    haha m() { rofl 1; }
    haha n() { rofl 2; }
}`;
      const js = unlulzcate(lol);
      expect(js).toContain("class X {");
      expect(js).toContain("m()");
      expect(js).toContain("n()");
      expect(js).not.toMatch(/\bfunction\s+m\b/);
      expect(js).not.toMatch(/\bfunction\s+n\b/);
    });

    it("preserves nested function declarations inside method bodies", () => {
      const lol = `ahaha X {
    haha m() {
        haha helper() { rofl 1; }
        rofl helper();
    }
}`;
      const js = unlulzcate(lol);
      expect(js).toContain("function helper()");
    });

    it("transpiles async fetch", () => {
      const lol = `giggle haha fetchUser(id) {
    lmao res = waitforit fetch("/api/users/" + id);
    rofl waitforit res.json();
}`;
      const js = unlulzcate(lol);
      expect(js).toContain("async function fetchUser(id)");
      expect(js).toContain("const res = await fetch(");
      expect(js).toContain("return await res.json();");
    });
  });

  describe("transpile alias", () => {
    it("is the same function", () => {
      expect(transpile).toBe(unlulzcate);
    });
  });
});
