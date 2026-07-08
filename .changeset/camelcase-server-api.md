---
'ripple': patch
'@ripple-ts/vite-plugin': patch
---

Rename the `ripple/server` helper exports to camelCase: `create_ssr_stream`
is now `createStream` and `get_css_for_hashes` is now `getCss`
(returning the CSS text for the scoped style hashes collected by `render()`).
The old snake_case exports are removed; update imports accordingly. The vite
plugin consumes the new names internally.
