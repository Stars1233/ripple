---
"@tsrx/core": patch
---

Preserve whitespace between a control-flow directive's closing `}` and the
following template text. A bare `else` (or any sibling text) after an `@if`
block such as `@if (x) { … } else` now keeps the leading space instead of
dropping it, matching how text after a plain element is handled.
