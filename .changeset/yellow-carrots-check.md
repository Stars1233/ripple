---
'@tsrx/typescript-plugin': patch
'create-ripple': patch
'@ripple-ts/cli': patch
---

Add prepare script to the typescript-plugin to make sure dist is published and in
general provided. Change the ones that point their main to dist to prepare from
prepack to cover more use cases.
