---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/vue': patch
'@tsrx/solid': patch
---

Keep native template nodes in JSX-child shape inside synthetic fragments on
JSX-emitting targets (react, preact, solid, vue). A fragment nested in an
expression container could collapse to a bare expression placed directly in a
fragment children list (`<>{a} <>{<>{b}</>}</></>` compiled to `<>{a}b</>`),
which JSX reads as literal text — in both production output and the TS/Volar
virtual code.
