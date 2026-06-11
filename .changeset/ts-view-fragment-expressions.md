---
'@tsrx/ripple': patch
---

Keep fragment expression children inside `{ … }` containers in the TS/Volar
virtual code. Fragments with multiple children printed bare expressions as
JSX children (`<>{a} {a}</>` became `<>aa</>`), which TypeScript reads as
JSX text — hiding the expressions from type checking, hover, and rename in
the editor.
