---
"@tsrx/core": patch
---

Fix a parser crash ("Invalid array length") when a control-flow directive
(`@if`/`@for`/`@switch`/`@try`) is followed by same-line trailing text that runs
straight into the closing tag, e.g. `<>@if (a) { … } done</>`. The manual
JSX-closing-tag re-entry now restores the two tokenizer contexts a real
`jsxTagStart` would have pushed, so the closing tag no longer underflows the
context stack.
