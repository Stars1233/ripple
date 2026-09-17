---
'@ripple-ts/adapter-bun': patch
---

The Bun static middleware now serves a prerendered page's `index.html` for a directory request. `Bun.file().exists()` is false for a directory, so these requests always fell through to the server render.
