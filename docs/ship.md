# Ship / push

Last touched: 2026-06-13

## Repo
- github.com/faisalmahdy/nusantara-realm — public, default branch `main`.
- Created 2026-06-13 via GitHub REST API.

## Tokens
GitHub PAT + Cloudflare token live in memory `secrets_nusantara_tokens.md` /
`reference_cloudflare_pages.md`. Do NOT hardcode in committed files.

## Push (OneCLI proxy — Basic auth works, Bearer does NOT)
```bash
TOKEN=<github PAT from secrets memory>
BASIC=$(printf "faisalmahdy:%s" "$TOKEN" | base64 -w0)
GIT_SSL_CAINFO=/tmp/onecli-combined-ca.pem \
  git -c http.extraHeader="Authorization: Basic $BASIC" push origin main
```
Remote URL is kept clean (no embedded token); auth is via the extraHeader.

## GitHub REST API
```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
curl --noproxy '*' -H "Authorization: Bearer $TOKEN" https://api.github.com/...
```

## Deploy
Not yet wired. When ready, Cloudflare Pages (same pattern as nusantara-monster
→ pages.dev). Build command `pnpm build`, output `dist/`.

## Standing rule
Per `feedback_ship_only_on_request.md`: the hourly loop MAY commit+push to `main`
(Mahdy explicitly authorized the autonomous loop, msg #130). For non-loop work,
commit then STOP unless Mahdy says ship/push/deploy.
