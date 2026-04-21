---
'ripple': patch
---

Restore the `ripple/compiler` subpath export. The compiler was moved into
`@tsrx/ripple` during the Ripple/TSRX split, which accidentally dropped
`ripple/compiler` from the published `exports` map — breaking downstream
tooling that imports the compiler by the public path, including
`livecodes` and any playground served through `esm.sh`. The path now
re-exports the `@tsrx/ripple` API (`compile`, `parse`,
`compile_to_volar_mappings`, and the shared types), and `@tsrx/ripple` is
promoted to a runtime dependency so the re-export resolves for installed
consumers.
