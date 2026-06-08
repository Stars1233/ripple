---
'@tsrx/core': patch
---

Preserve leading whitespace in JSX text children of elements nested inside `{ … }` expression containers. The JSX-expression reader skipped leading whitespace before anchoring the JSXText token, so `{<textarea>   a</textarea>}` lost its indentation while the bare `<textarea>   a</textarea>` kept it. Both paths now capture text identically, so every target (Ripple, React, Preact, Solid, Vue, including `typeOnly`/`to_ts` output) emits consistent JSX text.
