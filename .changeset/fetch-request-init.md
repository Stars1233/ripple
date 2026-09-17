---
'@ripple-ts/adapter': patch
---

Apply the `init` argument when a same-origin `fetch(request, init)` made during server rendering is routed straight to the handler. The method, body and headers passed in `init` were dropped, so a `POST` reached the route as the original `GET`.

Reject URL-rewriting errors instead of throwing synchronously, and reject request-construction and handler errors instead of retrying same-origin requests over the network.
