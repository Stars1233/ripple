---
'ripple': patch
---

Accept a component function as the `children` prop in `mount()` and
`hydrate()`. Compiled component call sites normalize `children` via
`normalize_children`, but props passed through the mount options skipped that
step, so a plain component function would be rendered as text. The same
normalization is now applied to `options.props`, which lets bootstrap code
hydrate a layout with its page as `children` without reaching into runtime
internals.
