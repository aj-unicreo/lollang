import type { Program } from "acorn";
import { parse, tokenizer } from "acorn";
import * as walk from "acorn-walk";
import { REVERSE_KEYWORDS } from "./keywords.js";

const PARSER_OPTS = {
  ecmaVersion: "latest",
  sourceType: "module",
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true,
  allowImportExportEverywhere: true,
  allowHashBang: true,
} as const;

interface Edit {
  start: number;
  end: number;
  text: string;
}

interface TokenInfo {
  start: number;
  end: number;
  keyword: string | null;
  value: string | null;
}

export interface OblulzcateOptions {
  /**
   * Translate `console.log(...)` calls to `xd(...)`. Default: true.
   * Disable to keep `console.log` literal — useful for round-tripping
   * code that uses other `console` methods.
   */
  translateConsoleLog?: boolean;
  /**
   * Replace value-position references to `undefined` with `imded`.
   * Default: true. Declarations and property names are never rewritten,
   * regardless of this flag.
   */
  translateUndefined?: boolean;
}

/**
 * Thrown when the input cannot be parsed as JavaScript.
 * The original parse error is attached as the `cause`.
 */
export class OblulzcateError extends SyntaxError {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "OblulzcateError";
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

/**
 * Translate JavaScript source to LOLLang. Inverse of `unlulzcate`, modulo
 * formatting and the special-cases below.
 *
 * The transform is AST-aware to handle three things a regex can't:
 *
 *   1. `else if` is two JS tokens — must collapse to the single `hehe`.
 *   2. `console.log(x)` is a member-call — must rewrite the *callee*, not
 *      every textual occurrence of `console.log`.
 *   3. `undefined` is a global identifier in JS, not a keyword — only
 *      value-position references should become `imded` (never property
 *      keys, member props, or binding names).
 *
 * For everything else the Acorn tokenizer pinpoints exact keyword spans,
 * which we substitute by token replacement.
 */
export function oblulzcate(source: string, opts: OblulzcateOptions = {}): string {
  const translateConsoleLog = opts.translateConsoleLog ?? true;
  const translateUndefined = opts.translateUndefined ?? true;

  const tokens = collectTokens(source);
  const ast = parseSource(source);

  const editByStart = new Map<number, Edit>();

  // Pass 1: simple keyword substitutions, driven by the tokenizer.
  for (const tok of tokens) {
    if (tok.keyword && tok.keyword in REVERSE_KEYWORDS) {
      const text = REVERSE_KEYWORDS[tok.keyword];
      if (text !== undefined) {
        editByStart.set(tok.start, { start: tok.start, end: tok.end, text });
      }
    }
  }

  // Pass 2: AST-driven adjustments. May overwrite Pass 1 edits.
  walk.ancestor(ast, {
    IfStatement(node: AnyNode) {
      const alt = (node as IfNode).alternate;
      const cons = (node as IfNode).consequent;
      if (alt?.type === "IfStatement") {
        const elseTok = findToken(tokens, (t) => t.keyword === "else", cons.end, alt.start);
        const ifTok = findToken(
          tokens,
          (t) => t.keyword === "if" && t.start === alt.start,
          alt.start,
          alt.start + 2,
        );
        if (elseTok && ifTok) {
          editByStart.delete(ifTok.start);
          editByStart.set(elseTok.start, {
            start: elseTok.start,
            end: ifTok.end,
            text: "hehe",
          });
        }
      }
    },

    CallExpression(node: AnyNode) {
      if (!translateConsoleLog) return;
      const callee = (node as CallNode).callee;
      if (callee.type !== "MemberExpression") return;
      const m = callee as MemberNode;
      if (m.computed || m.optional) return;
      const obj = m.object as IdentifierNode;
      const prop = m.property as IdentifierNode;
      if (obj.type !== "Identifier" || obj.name !== "console") return;
      if (prop.type !== "Identifier" || prop.name !== "log") return;
      editByStart.set(m.start, { start: m.start, end: m.end, text: "xd" });
    },

    FunctionDeclaration(node: AnyNode) {
      markAsync(node as FunctionNode, tokens, editByStart);
    },
    FunctionExpression(node: AnyNode) {
      markAsync(node as FunctionNode, tokens, editByStart);
    },
    ArrowFunctionExpression(node: AnyNode) {
      markAsync(node as FunctionNode, tokens, editByStart);
    },
    MethodDefinition(node: AnyNode) {
      const m = node as MethodNode;
      if (m.value?.async) {
        const tok = findToken(tokens, (t) => t.value === "async", m.start, m.value.start);
        if (tok) {
          editByStart.set(tok.start, { start: tok.start, end: tok.end, text: "giggle" });
        }
      }
    },

    // `let` is a contextual keyword in Acorn — emitted as an identifier
    // token, not a keyword token. Pick it off via the AST.
    VariableDeclaration(node: AnyNode) {
      const decl = node as VarDeclarationNode;
      if (decl.kind !== "let") return;
      // The `let` keyword sits at node.start, length 3, regardless of any
      // leading `export` (which is its own node) — but for `for (let ...)`,
      // `node.start` is at `let`. Source.slice for a sanity check.
      if (source.slice(decl.start, decl.start + 3) === "let") {
        editByStart.set(decl.start, { start: decl.start, end: decl.start + 3, text: "lol" });
      }
    },

    // `await` is also contextual — only reserved inside async functions
    // and modules, so the tokenizer leaves it as an identifier.
    AwaitExpression(node: AnyNode) {
      const aw = node as AwaitNode;
      // The `await` keyword starts at aw.start.
      if (source.slice(aw.start, aw.start + 5) === "await") {
        editByStart.set(aw.start, {
          start: aw.start,
          end: aw.start + 5,
          text: "waitforit",
        });
      }
    },

    Identifier(node: AnyNode, _state: unknown, ancestors: AnyNode[]) {
      if (!translateUndefined) return;
      const id = node as IdentifierNode;
      if (id.name !== "undefined") return;
      if (isBindingOrKeyPosition(ancestors)) return;
      editByStart.set(id.start, { start: id.start, end: id.end, text: "imded" });
    },
  } as walk.AncestorVisitors<unknown>);

  return applyEdits(source, [...editByStart.values()]);
}

/** Alias. */
export const obfuscate = oblulzcate;

// ---------- helpers ----------

function collectTokens(source: string): TokenInfo[] {
  const tokens: TokenInfo[] = [];
  try {
    for (const t of tokenizer(source, PARSER_OPTS)) {
      const type = t.type as { keyword?: string };
      const rawValue = (t as { value?: unknown }).value;
      tokens.push({
        start: t.start,
        end: t.end,
        keyword: type.keyword ?? null,
        value: typeof rawValue === "string" ? rawValue : null,
      });
    }
  } catch (e) {
    throw new OblulzcateError(`failed to tokenize JavaScript source: ${(e as Error).message}`, e);
  }
  return tokens;
}

function parseSource(source: string): Program {
  try {
    return parse(source, PARSER_OPTS);
  } catch (e) {
    throw new OblulzcateError(`failed to parse JavaScript source: ${(e as Error).message}`, e);
  }
}

function findToken(
  tokens: readonly TokenInfo[],
  pred: (t: TokenInfo) => boolean,
  rangeStart: number,
  rangeEnd: number,
): TokenInfo | null {
  for (const t of tokens) {
    if (t.start > rangeEnd) break;
    if (t.start >= rangeStart && t.end <= rangeEnd && pred(t)) return t;
  }
  return null;
}

function markAsync(
  node: FunctionNode,
  tokens: readonly TokenInfo[],
  edits: Map<number, Edit>,
): void {
  if (!node.async) return;
  // Conventionally `node.start` lands on `async`; fall back to scanning forward
  // up to the function body if positioning differs (e.g. decorators in future).
  const upper = node.body?.start ?? node.start + 6;
  const tok = findToken(tokens, (t) => t.value === "async", node.start, upper);
  if (tok) {
    edits.set(tok.start, { start: tok.start, end: tok.end, text: "giggle" });
  }
}

function isBindingOrKeyPosition(ancestors: readonly AnyNode[]): boolean {
  // ancestors[length - 1] is the node itself; [length - 2] is its parent.
  const node = ancestors[ancestors.length - 1] as IdentifierNode | undefined;
  const parent = ancestors[ancestors.length - 2];
  if (!parent || !node) return false;

  switch (parent.type) {
    case "Property":
    case "PropertyDefinition":
    case "MethodDefinition":
      return (parent as KeyedNode).key === node && !(parent as KeyedNode).computed;

    case "MemberExpression":
      return (parent as MemberNode).property === node && !(parent as MemberNode).computed;

    case "VariableDeclarator":
      return (parent as VarDeclNode).id === node;

    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression": {
      const fn = parent as FunctionNode;
      if (fn.id === node) return true;
      if (fn.params?.some((p) => p === node)) return true;
      return false;
    }

    case "AssignmentPattern":
      return (parent as AssignNode).left === node;

    case "RestElement":
    case "ArrayPattern":
    case "ObjectPattern":
      return true;

    case "CatchClause":
      return (parent as CatchNode).param === node;

    case "LabeledStatement":
    case "BreakStatement":
    case "ContinueStatement":
      return (parent as LabelNode).label === node;

    case "ImportSpecifier":
    case "ImportDefaultSpecifier":
    case "ImportNamespaceSpecifier":
    case "ExportSpecifier":
      return true;

    default:
      return false;
  }
}

function applyEdits(source: string, edits: readonly Edit[]): string {
  // Apply right-to-left so earlier offsets stay valid.
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let out = source;
  for (const e of sorted) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return out;
}

// ---------- minimal AST node shapes (avoid an ESTree types dependency) ----------

interface AnyNode {
  type: string;
  start: number;
  end: number;
}
interface IdentifierNode extends AnyNode {
  type: "Identifier";
  name: string;
}
interface IfNode extends AnyNode {
  consequent: AnyNode;
  alternate: AnyNode | null;
}
interface CallNode extends AnyNode {
  callee: MemberNode | AnyNode;
}
interface MemberNode extends AnyNode {
  type: "MemberExpression";
  object: AnyNode | IdentifierNode;
  property: AnyNode | IdentifierNode;
  computed: boolean;
  optional: boolean;
}
interface FunctionNode extends AnyNode {
  async: boolean;
  body?: AnyNode;
  id?: IdentifierNode | null;
  params?: AnyNode[];
}
interface MethodNode extends AnyNode {
  value: FunctionNode;
}
interface KeyedNode extends AnyNode {
  key: AnyNode;
  computed: boolean;
}
interface VarDeclNode extends AnyNode {
  id: AnyNode;
}
interface AssignNode extends AnyNode {
  left: AnyNode;
}
interface CatchNode extends AnyNode {
  param: AnyNode;
}
interface LabelNode extends AnyNode {
  label: AnyNode;
}
interface VarDeclarationNode extends AnyNode {
  type: "VariableDeclaration";
  kind: "let" | "const" | "var";
}
interface AwaitNode extends AnyNode {
  type: "AwaitExpression";
}
