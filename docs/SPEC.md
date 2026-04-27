# LOLLang — a laughter-keyword language

# LOLLang

A minimal language that transpiles to JavaScript. Every keyword is a laughter variant.

## Design Principles

- **One keyword, one concept.** No overloading.
- **Lexical, not phonetic.** Tokens match exact ASCII strings, case-insensitive.
- **JS-shaped semantics.** Each construct maps 1:1 to a JavaScript form, so transpilation is a token-substitution pass plus minor reshaping.
- **Keep operators.** `+ - * / % = == === != < > && || !` stay as in JS. Only keywords laugh.

## Keyword Map

| **Category** | **LOLLang** | **JavaScript** | Variable (mutable) | `lol` | `let` |
| --- | --- | --- | --- | --- | --- |
| Variable (constant) | `lmao` | `const` | Function declaration | `haha` | `function` |
| Return | `rofl` | `return` | If | `lmfao` | `if` |
| Else if | `hehe` | `else if` | Else | `kek` | `else` |
| While loop | `hihi` | `while` | For loop | `heh` | `for` |
| Break | `lulz` | `break` | Continue | `jaja` | `continue` |
| True | `bahaha` | `true` | False | `mwahaha` | `false` |
| Null | `teehee` | `null` | Undefined | `imded` | `undefined` |
| Class | `ahaha` | `class` | New instance | `omegalul` | `new` |
| This | `me` | `this` | Try | `lolwut` | `try` |
| Catch | `lolnope` | `catch` | Throw | `ded` | `throw` |
| Switch | `kekw` | `switch` | Case | `pepega` | `case` |
| Default | `lulw` | `default` | Print to console | `xd` | `console.log` |
| Import | `yoink` | `import` | Export | `yeet` | `export` |
| Async | `giggle` | `async` | Await | `waitforit` | `await` |

## Grammar (informal EBNF)

```ebnf
program     = { statement } ;
statement   = varDecl | funcDecl | ifStmt | whileStmt | forStmt
            | returnStmt | exprStmt | classDecl | tryStmt | switchStmt ;

varDecl     = ("lol" | "lmao") IDENT [ "=" expression ] ";" ;
funcDecl    = [ "giggle" ] "haha" IDENT "(" [ params ] ")" block ;
ifStmt      = "lmfao" "(" expression ")" block
              { "hehe" "(" expression ")" block }
              [ "kek" block ] ;
whileStmt   = "hihi" "(" expression ")" block ;
forStmt     = "heh" "(" varDecl expression ";" expression ")" block ;
returnStmt  = "rofl" [ expression ] ";" ;
classDecl   = "ahaha" IDENT [ "extends" IDENT ] block ;
tryStmt     = "lolwut" block "lolnope" "(" IDENT ")" block ;
switchStmt  = "kekw" "(" expression ")" "{" { caseClause } [ defaultClause ] "}" ;
caseClause  = "pepega" expression ":" { statement } ;
defaultClause = "lulw" ":" { statement } ;
block       = "{" { statement } "}" ;
```

Identifiers, numbers, strings, and operators follow JavaScript rules.

## Examples

### Hello world

```
xd("Hello, world");
```

### FizzBuzz

```
heh (lol i = 1; i <= 15; i = i + 1) {
    lmfao (i % 15 == 0) {
        xd("FizzBuzz");
    } hehe (i % 3 == 0) {
        xd("Fizz");
    } hehe (i % 5 == 0) {
        xd("Buzz");
    } kek {
        xd(i);
    }
}
```

### Recursive function

```
haha factorial(n) {
    lmfao (n <= 1) {
        rofl 1;
    }
    rofl n * factorial(n - 1);
}

xd(factorial(6));
```

### Class with try/catch

```
ahaha Cat {
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
}
```

### Async

```
giggle haha fetchUser(id) {
    lmao res = waitforit fetch("/api/users/" + id);
    rofl waitforit res.json();
}
```

## Transpiler (≈40 lines of JavaScript)

A naïve token-replacement transpiler is sufficient because every keyword maps to a single JS token and identifiers cannot start with a digit.

```jsx
const KEYWORDS = {
    lol: "let", lmao: "const",
    haha: "function", rofl: "return",
    lmfao: "if", hehe: "else if", kek: "else",
    hihi: "while", heh: "for",
    lulz: "break", jaja: "continue",
    bahaha: "true", mwahaha: "false",
    teehee: "null", imded: "undefined",
    ahaha: "class", omegalul: "new", me: "this",
    lolwut: "try", lolnope: "catch", ded: "throw",
    kekw: "switch", pepega: "case", lulw: "default",
    xd: "console.log",
    yoink: "import", yeet: "export",
    giggle: "async", waitforit: "await",
};

function transpile(source) {
    // Tokenize: preserve strings and comments; replace bare word tokens.
    const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/.*|\/\*[\s\S]*?\*\/|\b[A-Za-z_]\w*\b|[\s\S])/g;
    return source.replace(re, (tok) => {
        if (/^["'`]/.test(tok) || tok.startsWith("//") || tok.startsWith("/*")) return tok;
        const key = tok.toLowerCase();
        return Object.prototype.hasOwnProperty.call(KEYWORDS, key) ? KEYWORDS[key] : tok;
    });
}

// Usage
const js = transpile(lolSource);
eval(js); // or write to a .js file
```

**Why this works:** the regex isolates string and comment literals first, so keywords inside `"haha"` are never rewritten. Everything else is matched as either a word token or a single character, and only word tokens are looked up in the map.

## Limitations and Extensions

- **Reserved identifiers.** Users cannot name variables after laugh keywords. Add a sigil (e.g. `$haha`) if collisions matter.
- **`hehe` is two JS tokens.** The simple transpiler handles it because `else if` is a valid replacement string. A real parser would emit nested `if/else` AST nodes.
- **No type system.** Add `:type` annotations and strip them before transpile to gain TypeScript-style hints.
- **REPL.** Wrap `transpile` + `eval` in a Node CLI to get an interactive `lol>` prompt.