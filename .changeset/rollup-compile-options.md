---
'@ripple-ts/rollup-plugin': patch
---

Pass `compilerOptions` to the compiler instead of the raw file id. This fixes a
`TypeError` when compiling `.tsrx` files and ensures options such as `mode`,
`dev`, `hmr`, and `hydration` are respected.
