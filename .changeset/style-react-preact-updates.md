---
"@tsrx/core": patch
"@tsrx/react": patch
"@tsrx/preact": patch
---

Add support for reusable style element expressions and update React/Preact target behavior.

Style elements can now be assigned to variables and used as class maps, while inline style blocks inside returned TSRX stay scoped to that fragment. React and Preact also preserve authored class attributes and handle conditional hooks from function component bodies with the new function-based TSRX model.
