---
'@tsrx/core': patch
---

Parse ternaries whose branches are JSX elements or fragments with children inside a `{ … }` expression container (e.g. `{cond ? <div>a</div> : <span>b</span>}`, including nested ternaries, fragment branches, and ternaries in attribute values or `.map()` callbacks). A JSX branch left the tokenizer at `exprAllowed === false`, so the `<` after the `:` was not recognized as a tag start and parsing failed with "Unexpected token". Expression position is now restored after a JSX ternary branch so the alternate parses as JSX too.
