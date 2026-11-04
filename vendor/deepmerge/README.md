# deepmerge (vendored)

Upstream [deepmerge](https://github.com/TehShrike/deepmerge) 4.3.1, MIT licensed (see `license.txt`), with one change.

**Why it is vendored.** deepmerge <= 4.3.1 is affected by [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4): an own `__proto__` key (which `JSON.parse` produces) is assigned onto the merged result and replaces its prototype. No patched release exists. This repo gets deepmerge through `swagger-ui-react` → `swagger-client`, and the root `package.json` points its `pnpm.overrides.deepmerge` at this directory.

**The change.** `getKeys()` in `index.js` (upstream's `dist/cjs.js`, renamed because the repo ignores `dist/`) drops the `__proto__` key, which covers both the target and the source loop of `mergeObject()`. Everything else is byte-identical to the published 4.3.1.

**Tests.** `src/lib/__tests__/deepmerge-vendored.test.ts` checks that `swagger-client` resolves this copy, reproduces both poisoning paths, and checks normal merge behaviour.

**When to remove it.** Delete this directory and the `deepmerge` override once upstream ships a fixed release, or once `swagger-client` stops depending on deepmerge.
