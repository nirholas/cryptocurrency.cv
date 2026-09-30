# Contributors

<!-- Generated from src/data/contributors.json by `npm run contributors:generate`. Edit the JSON, not this file. -->

cryptocurrency.cv is built and maintained by [@nirholas](https://github.com/nirholas). These people made it better, and we are grateful to every one of them.

Reporting a bug, a security problem or an outage is a contribution: many of the fixes below exist only because someone took the time to write it up. To be added, open an issue or a pull request that adds you to `src/data/contributors.json`.

## Code

### [Sperax (@speraxos)](https://github.com/speraxos)

_Code, Triage_

- Ended the February site-wide 500s reported in #15 by moving data-driven pages to dynamic rendering ([link](https://github.com/nirholas/cryptocurrency.cv/commit/f25bc6e6))
- Lazy x402 proxy initialisation so production builds stopped failing ([link](https://github.com/nirholas/cryptocurrency.cv/commit/fa57e818))
- Predictive cache warming for frequently requested data ([link](https://github.com/nirholas/cryptocurrency.cv/commit/1c3db33f))
- Server-side proxy for funding rates and liquidations, removing browser CORS failures ([link](https://github.com/nirholas/cryptocurrency.cv/commit/1823e8a3))
- Markets page redesign, market overview cards, and the mobile header and price rows ([link](https://github.com/nirholas/cryptocurrency.cv/commit/2c555d62))
- Coin detail page timeout fixes that stopped fallback-chain 500s ([link](https://github.com/nirholas/cryptocurrency.cv/commit/9e21c9da))
- Followed up with reporters on the #15 outage ([link](https://github.com/nirholas/cryptocurrency.cv/issues/15))

### [@cemitos](https://github.com/cemitos)

- The v2 historical archive of 346,000 articles and the retrieval (RAG) system built on it ([link](https://github.com/nirholas/cryptocurrency.cv/commit/843c7d33))

### [@notmynamepls](https://github.com/notmynamepls)

- Price chart on coin pages and a fix for the header navigation clipping ([link](https://github.com/nirholas/cryptocurrency.cv/commit/fad2d75e))

### [@yassais](https://github.com/yassais)

_Code, Docs_

- OpenRouter integration documentation ([link](https://github.com/nirholas/cryptocurrency.cv/commit/1b13a040))
- Complete MCP registry schema in server.json ([link](https://github.com/nirholas/cryptocurrency.cv/commit/3fc08f2f))

## Documentation

### [@superchain](https://github.com/superchain)

- OpenAPI description edits for the prices and yields endpoints ([link](https://github.com/nirholas/cryptocurrency.cv/commit/12c5d7e8))

### [@clankered](https://github.com/nirholas/cryptocurrency.cv/commit/96bc0fdd)

_This GitHub account no longer exists._

- Removed a stale branch note from the README ([link](https://github.com/nirholas/cryptocurrency.cv/commit/96bc0fdd))

## Security reports

### [@chenshj73](https://github.com/chenshj73)

- Found the payment bypass on API key upgrades, which led to verified and settled payments on both upgrade routes ([link](https://github.com/nirholas/cryptocurrency.cv/issues/43))

## Bug reports

### [@volumevigilante](https://github.com/volumevigilante)

- Reported the paywalled search, blocked curl and the zero-address payment challenge, with follow-up checks across endpoints ([link](https://github.com/nirholas/cryptocurrency.cv/issues/36))

### [@cmdenney](https://github.com/cmdenney)

- Flagged the Blocknative gas API shutdown, which led to the keyless eth_feeHistory gas engine ([link](https://github.com/nirholas/cryptocurrency.cv/issues/44))

### [@bomzj](https://github.com/bomzj)

- Reported the empty news feed with a full response sample ([link](https://github.com/nirholas/cryptocurrency.cv/issues/40))

### [@RaoHammas](https://github.com/RaoHammas)

- Reported the DEPLOYMENT_DISABLED outage on every endpoint ([link](https://github.com/nirholas/cryptocurrency.cv/issues/45))

### [@zhiqihuang](https://github.com/zhiqihuang)

- Reported the missing historical archive, which started the archive work ([link](https://github.com/nirholas/cryptocurrency.cv/issues/14))

### [@3lang3](https://github.com/3lang3)

- Reported the February site outage ([link](https://github.com/nirholas/cryptocurrency.cv/issues/15))

### [@webparadoxer](https://github.com/webparadoxer)

- Confirmed the February site outage ([link](https://github.com/nirholas/cryptocurrency.cv/issues/15))

## Triage and support

### [@AlestackOverglow](https://github.com/AlestackOverglow)

- Traced the #15 outage to Next.js DYNAMIC_SERVER_USAGE errors from the production logs ([link](https://github.com/nirholas/cryptocurrency.cv/issues/15))

### [@lui62233](https://github.com/lui62233)

- Broke down the payment-challenge mismatch in #36 for the reporter and maintainers ([link](https://github.com/nirholas/cryptocurrency.cv/issues/36))

## Maintenance

### [@niqv](https://github.com/niqv)

- Reviewed and merged dependency updates #26 and #30 ([link](https://github.com/nirholas/cryptocurrency.cv/pull/26))

## Feedback

### [@Yash2341](https://github.com/Yash2341)

- Asked how to fetch full article content, which pointed readers to the extraction endpoint and its guide ([link](https://github.com/nirholas/cryptocurrency.cv/issues/39))

---

Dependency updates are proposed automatically by Dependabot. Commits whose author is a placeholder address or which change no files are not listed.
