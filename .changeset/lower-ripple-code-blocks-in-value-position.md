---
'@tsrx/ripple': patch
---

Lower a `@{ … }` code block that produces render output when it sits in a plain expression position — assigned to a variable (`const view = @{ … }`, `view = @{ … }`) or returned (`return @{ … }`). Ripple only lowered a code block when it was a function body, so as a bare value it reached the printer as a raw `JSXCodeBlock` and crashed with "Not implemented: JSXCodeBlock" (and produced malformed `const view = { … }` virtual TS in editor/`to_ts` output). The block is now wrapped in an immediately-invoked arrow (`(() => @{ … })()`) before analysis, reusing the existing arrow-body render path; the synthesized arrow gets its own scope so the block's setup statements resolve correctly. This applies to client, server, and `to_ts` output, so type-checking, hover, and navigation work for these positions.
