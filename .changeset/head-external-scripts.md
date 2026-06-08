---
"@tsrx/ripple": patch
---

Fix client compile crash for `<script src={...} />` (and other attribute-only scripts) inside `<head>`. Such scripts now render as real elements instead of being treated as inline-text scripts, which previously threw when they had no child content.
