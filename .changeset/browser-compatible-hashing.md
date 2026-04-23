---
'@tsrx/core': patch
'@tsrx/ripple': patch
'ripple': patch
---

Replace `node:crypto` usage in the compiler with a pure-JS implementation so Ripple can be compiled inside browser workers (e.g. the Monaco-based playground) where `crypto.createHash` is not available.

The hashing utility is split into two functions:

- `simple_hash` — fast non-cryptographic djb2 (base36). Used for CSS class-name prefixes and runtime `{html}` hydration markers where the input is user content and the output multiplies across the shipped bundle.
- `strong_hash` — preimage-resistant SHA-256 prefix (pure-JS via `@noble/hashes`). Used everywhere a hash is derived from a server-only filesystem path (`#server` RPC ids, `track`/`trackAsync` ids, head-element hydration markers) so the hash can't be inverted to reveal the original path.

The runtime `ripple` package no longer ships its own `hashing.js` — it re-exports `simple_hash`/`strong_hash` from `@tsrx/core`, and the compiler emits `_$_.simple_hash` (previously `_$_.hash`) for dynamic `{html}` hydration markers.
