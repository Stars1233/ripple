---
'@tsrx/core': patch
---

Lower bare `@if`/`@for`/`@switch`/`@try` control-flow directives that sit directly in a call/`new` argument position (`func(@if (status === 'active') { … } @else { … })`). For the React, Preact, Solid, and Vue targets these previously leaked an untransformed `JSXIfExpression`/`JSXForExpression`/`JSXSwitchExpression`/`JSXTryExpression` straight to the printer and crashed with "Not implemented: JSX…Expression". The argument is now wrapped in a native TSRX fragment before transform, so it flows through the same render machinery as an expression-bodied arrow, `return`, or assignment output (a `@{ … }` code-block argument already lowered to an IIFE and is unchanged).
