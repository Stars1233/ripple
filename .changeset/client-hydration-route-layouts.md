---
'@ripple-ts/vite-plugin': patch
---

Compose `RenderRoute` layouts during client hydration. The generated client
entry hydrated the bare page component, so a route's `layout` only existed in
the server-rendered HTML: the layout component never ran in the browser, its
CSS was missing from the client graph, and once the SSR style block was
removed after hydration the layout's styles disappeared (visible as a flash
of unstyled content). The client entry now loads the layout module and wraps
the page the same way the server does, and layout entries are included in the
client build's static route imports so their CSS is bundled.
