import { KEYWORDS, type LolKeyword } from "./keywords.js";

/**
 * Tokenizer that isolates the things we must not touch (strings, template
 * literals, line and block comments) before falling through to bare word
 * tokens and single characters. Order in the alternation matters: literals
 * and comments come first so that a `haha` *inside* `"haha"` is preserved.
 *
 * - `"…"` and `'…'`  — string literals with backslash escapes
 * - `` `…` ``         — template literals (no interpolation parsing; the
 *   contents are passed through verbatim, which is what we want)
 * - `// …`            — line comments (until newline)
 * - `/* … *\/`        — block comments (non-greedy)
 * - `$IDENT`          — escape: `$haha` becomes `haha` literal in JS output
 * - bare word tokens  — candidates for keyword substitution
 * - any single char   — fallback so the scan never stalls
 */
const TOKEN_RE =
  /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\$[A-Za-z_]\w*|\b[A-Za-z_]\w*\b|[\s\S])/g;

const QUOTE_CODES = new Set([34 /* " */, 39 /* ' */, 96 /* ` */]);

/**
 * Translate LOLLang source to JavaScript.
 *
 * Implementation is a single tokenizing pass that preserves string and
 * comment content, lowercases each identifier-shaped token, and replaces
 * it if it matches a known LOL keyword. The substitution is case-insensitive
 * because the spec requires it.
 *
 * Class-method desugaring: the spec writes `haha methodName()` for class
 * methods, but JS class bodies forbid the `function` keyword. We track
 * brace depth and elide `haha` when it appears at a class-body's immediate
 * depth — turning `ahaha Cat { haha meow() {} }` into the valid
 * `class Cat { meow() {} }`.
 *
 * The `$ident` form is a deliberate escape hatch: `$haha` becomes the JS
 * identifier `haha`, allowing users to pass through tokens that would
 * otherwise be eaten by the keyword map.
 */
export function unlulzcate(source: string): string {
  // Brace tracking so `haha` inside a class body becomes empty (not
  // `function`, which would be invalid JS at method position).
  let depth = 0;
  let pendingClassBrace = false;
  const classBodyDepths: number[] = [];

  return source.replace(TOKEN_RE, (tok) => {
    const first = tok.charCodeAt(0);

    // Pass-throughs: strings, templates, comments.
    if (QUOTE_CODES.has(first)) return tok;
    if (
      tok.length >= 2 &&
      first === 47 /* / */ &&
      (tok.charCodeAt(1) === 47 || tok.charCodeAt(1) === 42)
    ) {
      return tok;
    }

    // Escape: $haha -> haha (identifier passthrough).
    if (first === 36 /* $ */) return tok.slice(1);

    // Brace tracking happens for *every* `{` and `}` regardless of how the
    // surrounding tokens substitute, so it stays correct even for tokens
    // that emit empty strings.
    if (tok === "{") {
      depth++;
      if (pendingClassBrace) {
        classBodyDepths.push(depth);
        pendingClassBrace = false;
      }
      return tok;
    }
    if (tok === "}") {
      const top = classBodyDepths[classBodyDepths.length - 1];
      if (top !== undefined && top === depth) classBodyDepths.pop();
      depth--;
      return tok;
    }

    // Non-identifier characters: pass through unchanged.
    if (!/^[A-Za-z_]\w*$/.test(tok)) return tok;

    const key = tok.toLowerCase();
    if (!Object.hasOwn(KEYWORDS, key)) return tok;

    // `ahaha IDENT [extends IDENT]* {` — mark the following `{` as a class body.
    if (key === "ahaha") {
      pendingClassBrace = true;
      return KEYWORDS[key as LolKeyword];
    }

    // `haha` directly inside a class body produces no output, so the source
    // becomes a method definition rather than a syntax error.
    if (key === "haha") {
      const top = classBodyDepths[classBodyDepths.length - 1];
      if (top !== undefined && top === depth) return "";
    }

    return KEYWORDS[key as LolKeyword];
  });
}

/** Alias for users who don't speak laughter. */
export const transpile = unlulzcate;
