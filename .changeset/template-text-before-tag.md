---
'@tsrx/core': patch
---

Parse template text that touches a following tag (`<>hello<span>…`) as text
plus a tag. The tokenizer treated a `<` directly after a text run ending in an
identifier character as the start of a TypeScript type-argument list
(`hello<T>`), so the tag failed to parse with "Unexpected token `>`".
