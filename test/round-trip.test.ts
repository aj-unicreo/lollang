import { describe, expect, it } from "vitest";
import { oblulzcate } from "../src/oblulzcate.js";
import { unlulzcate } from "../src/unlulzcate.js";

/**
 * JS → LOL → JS should yield the original source for inputs that don't
 * touch the known asymmetric edges (computed `console.log` access, etc.).
 *
 * These act as integration tests: every Acorn-tokenized keyword position
 * is exercised, and the regex-based unlulzcate must reverse the AST-based
 * oblulzcate output exactly.
 */
describe("round-trip JS → LOL → JS", () => {
  function rt(js: string): string {
    return unlulzcate(oblulzcate(js));
  }

  it("preserves a simple function", () => {
    const js = "function add(a, b) { return a + b; }";
    expect(rt(js)).toBe(js);
  });

  it("preserves fizzbuzz", () => {
    const js = `for (let i = 1; i <= 15; i = i + 1) {
  if (i % 15 == 0) {
    console.log("FizzBuzz");
  } else if (i % 3 == 0) {
    console.log("Fizz");
  } else if (i % 5 == 0) {
    console.log("Buzz");
  } else {
    console.log(i);
  }
}`;
    expect(rt(js)).toBe(js);
  });

  it("preserves a class with try/catch", () => {
    const js = `class Cat {
  constructor(name) {
    this.name = name;
  }
  meow() {
    return this.name + " says lol";
  }
}

try {
  const c = new Cat("Whiskers");
  console.log(c.meow());
} catch (e) {
  throw e;
}`;
    expect(rt(js)).toBe(js);
  });

  it("preserves async function", () => {
    const js = `async function fetchUser(id) {
  const res = await fetch("/api/users/" + id);
  return await res.json();
}`;
    expect(rt(js)).toBe(js);
  });

  it("preserves switch", () => {
    const js = `switch (x) {
  case 1:
    break;
  case 2:
    break;
  default:
    throw new Error("nope");
}`;
    expect(rt(js)).toBe(js);
  });

  it("preserves continue inside loops", () => {
    const js = `for (let i = 0; i < 10; i = i + 1) {
  if (i === 5) {
    continue;
  }
  break;
}`;
    expect(rt(js)).toBe(js);
  });

  it("preserves undefined and null literals", () => {
    const js = "let x = undefined; let y = null; if (x === undefined) { y = true; }";
    expect(rt(js)).toBe(js);
  });

  it("preserves strings containing keyword-looking text", () => {
    const js = 'const x = "haha lmao kek";';
    expect(rt(js)).toBe(js);
  });

  it("preserves template literals", () => {
    const js = "const x = `if else while const`;";
    expect(rt(js)).toBe(js);
  });

  it("preserves imports and exports", () => {
    const js = `import { x } from "y";\nexport const z = x;`;
    expect(rt(js)).toBe(js);
  });
});
