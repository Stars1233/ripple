---
'@tsrx/core': patch
---

Fix descendant and sibling selectors being wrongly pruned as unused in the
shared JSX targets (react, preact, solid, vue).

Selector pruning for free-standing `<style>` blocks runs before the transform
walker has stamped ancestor paths onto template nodes, so combinator matching
(`.card h2`, `.card > ul`) found no ancestors and marked every such selector
unused. Element collection for pruning now records each element's ancestor
chain itself, so descendant matching works the same as in the Ripple target.
