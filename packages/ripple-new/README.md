# ripple-new

Template-clone renderer with a React-shape state model — the successor renderer
for the ripple ecosystem. Components are authored in `.tsrx` and compiled by
[`@tsrx/ripple-new`](../tsrx-ripple-new) to calls into this runtime.

It implements the React-shape surface: hooks (`useState`, `useReducer`,
`useEffect`/`useLayoutEffect`/`useInsertionEffect`, `useMemo`, `useCallback`,
`useRef`, `useId`, `useTransition`, `useDeferredValue`, `useSyncExternalStore`,
`useImperativeHandle`, `useEffectEvent`, `useActionState`, `useFormStatus`,
`useOptimistic`), `use(thenable)` suspense via `@try`/`@pending`/`@catch`,
transitions, portals, context, and fragment refs, over a keyed template-clone
reconciler.

## Rendering and reactivity model

There is no virtual DOM. A component compiles to a *block* whose body re-runs on
update; `setState` queues just that block through `scheduleRender` and coalesces
the work in a microtask, while `flushSync` forces a synchronous commit. A body
writes directly into its cloned template nodes, so an update touches the owning
block and its slots instead of diffing a tree from the root.

Three compiler/runtime optimizations keep that model cheap:

- **Lite component slots.** When the compiler can prove a leaf component is pure
  (no hooks, `use`, `@try`, `children`, `key`, or spread), it emits
  `componentSlotLite`, which allocates only a `Scope` — no block, comment
  markers, or component-slot wrapper — so pure subtrees are near-free to mount
  and are skipped on re-render.
- **Hoisted event handlers.** A handler like `onClick={() => select(id)}`
  compiles to a `{ fn, args }` bundle stored on the element (e.g. `el.$$click`)
  and dispatched through a single delegated listener with arity-specialized fast
  paths, rather than a fresh closure per render; re-renders with the same
  identity skip the write.
- **Keyed reconciliation.** `@for` reconciles with doubly-linked-list items
  (O(1) insert/remove), a longest-increasing-subsequence move pass, and a
  small-displacement fast path for short reorders (≤4 moved positions, such as
  swaps, drags, and undo).

Reactivity is React-shape rather than signal-based: `useState` returns
`[value, setter]` and bodies re-run. ripple-new keeps a single block tree updated
in place rather than pairing a component tree with a separate signal dependency
graph. The tradeoff is that a state change re-runs the owning component body and
cascades to its non-lite descendants — not only the expressions that read the
value, the way the original `ripple` runtime's `track` signals do. The lite-slot
path collapses the pure descendants, which narrows that gap without fully closing
it for deep chains of stateful components.

Hooks are addressed by compiler-assigned slots rather than call order, so they
may be called inside `@if`/`@for`/`@switch` branches; there is no rules-of-hooks
ordering constraint.

The repo-root `benchmarks/` suites (`signal-favoring`, `recursive-context`,
`news`) exercise these axes. They are harnesses that drive a real browser, and no
measured results are committed to the repo, so run them on representative
hardware before relying on any specific numbers.

## Server rendering and hydration

ripple-new ships both a client runtime and a server runtime.

- `ripple-new` is the browser runtime: `createRoot(container).render(Component, props)`
  for a fresh render, or `hydrate(Component, container, props)` to adopt existing
  server markup. It also exports `flushSync`, the hook surface, context helpers,
  portals, and fragments.
- `ripple-new/server` is the SSR runtime: server-compiled `.tsrx` modules call
  `render(Component, props)`, which returns `{ head, body, css }`.
- `ripple-new/constants` exports the hydration marker constants shared by the
  server emit and the client hydrator.

Hydration adopts the server DOM in place rather than clearing and rebuilding it:
the client hydrator walks the `<!--[-->`/`<!--]-->` comment-marker ranges through
control flow (`@if`, `@for`, `@switch`, `@try`) and nested components, then
attaches events, refs, subscriptions, and effects to the adopted nodes.

Server hooks run with render-only semantics: `useState`/`useReducer` read their
initial value, effects and ref attachment do not run, `useMemo` computes once,
`useId` is deterministic for a pass, and `useSyncExternalStore` uses
`getServerSnapshot` when provided — both on the server and on the first client
read during hydration.

## Status

Experimental / pre-release (`private`, `0.0.x`). The API shape tracks React but
some surface area and edge cases are still being filled in; see `audit/` for the
conformance audits and `audit/SUSPENSE_DIVERGENCE.md` for the catalogue of
intentional divergences from React.
