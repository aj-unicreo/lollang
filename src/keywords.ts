/**
 * The complete LOLLang keyword map. The single source of truth for both
 * directions of translation. Order is by category for readability.
 */
export const KEYWORDS = {
  // Bindings
  lol: "let",
  lmao: "const",
  // Functions
  haha: "function",
  rofl: "return",
  // Branching
  lmfao: "if",
  hehe: "else if",
  kek: "else",
  // Loops
  hihi: "while",
  heh: "for",
  lulz: "break",
  jaja: "continue",
  // Literals
  bahaha: "true",
  mwahaha: "false",
  teehee: "null",
  imded: "undefined",
  // OOP
  ahaha: "class",
  omegalul: "new",
  me: "this",
  // Errors
  lolwut: "try",
  lolnope: "catch",
  ded: "throw",
  // Switch
  kekw: "switch",
  pepega: "case",
  lulw: "default",
  // I/O
  xd: "console.log",
  // Modules
  yoink: "import",
  yeet: "export",
  // Async
  giggle: "async",
  waitforit: "await",
} as const satisfies Record<string, string>;

export type LolKeyword = keyof typeof KEYWORDS;
export type JsKeyword = (typeof KEYWORDS)[LolKeyword];

/**
 * Reverse map: JS keyword string -> LOL keyword string.
 *
 * Note: `xd` maps to the multi-token `console.log`, and `hehe` to `else if`.
 * The reverse direction handles both as special cases at the AST level,
 * so they are *not* present in this single-token reverse map.
 */
export const REVERSE_KEYWORDS: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [lol, js] of Object.entries(KEYWORDS)) {
    if (!js.includes(" ") && !js.includes(".")) {
      out[js] = lol;
    }
  }
  return out;
})();

/** All LOL keyword tokens, lowercased. */
export const LOL_KEYWORD_SET: ReadonlySet<string> = new Set(Object.keys(KEYWORDS));
