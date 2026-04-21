---
'@tsrx/solid': patch
---

Wrap element children that mix JSX with plain statements
(`VariableDeclaration`, `ExpressionStatement`, `DebuggerStatement`, etc.) in
an IIFE so the statements execute as JS during render and keep their locals
scoped to the enclosing element. Previously those statements were emitted
directly as JSX children, which made them render as literal text rather
than run — e.g. mid-template `const [state, setState] = createSignal()` or
`console.log(...)` between JSX siblings printed their source instead of
executing. Matches the React target's existing behaviour.
