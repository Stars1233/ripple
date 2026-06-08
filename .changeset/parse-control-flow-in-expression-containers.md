---
'@tsrx/core': patch
---

Parse `@{ … }` code blocks and `@if`/`@for`/`@switch`/`@try` control-flow directives inside an element nested in a `{ … }` expression container (e.g. `{<div>@if (x) { … }</div>}`, including in `.map()` callbacks). These previously crashed with "RangeError: Invalid array length": the directive parser strips JSX tokenizer contexts so its body parses as JS, and inside an expression container it also stripped the container's and enclosing element's contexts, underflowing the context stack when the surrounding markup closed. The directive filter now preserves every context below the innermost expression-container baseline, matching the bare `function … @{ … }` form.
