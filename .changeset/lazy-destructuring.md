---
'ripple': patch
'@ripple-ts/prettier-plugin': patch
---

feat(compiler): add lazy destructuring syntax (`&{...}` and `&[...]`)

Lazy destructuring defers property/index access until the binding is read, preserving reactivity for destructured props. Works with default values, compound assignment operators, and update expressions.
