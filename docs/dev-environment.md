# Dev environment

Last touched: 2026-06-13

## Stack
React 18 + @react-three/fiber + @react-three/drei + three + zustand. Vite + TS.

## Running locally — IMPORTANT esbuild gotcha
pnpm 9+ ignores esbuild's build script (`ERR_PNPM_IGNORED_BUILDS`), so the
esbuild native binary and the top-level `node_modules/esbuild` symlink are
missing, and `pnpm dev` fails its pre-flight. `pnpm-workspace.yaml` has
`onlyBuiltDependencies: [esbuild]` but an env linter keeps re-adding an
`allowBuilds:` stanza — just overwrite the file back to the clean two lines.

Reliable boot sequence (bypasses pnpm pre-flight):
```bash
cd /workspace/agent/projects/nusantara-realm
pnpm install            # ok if it ends with the ignored-builds error
ESB=$(ls -d node_modules/.pnpm/esbuild@*/node_modules/esbuild)
node "$ESB/install.js"                         # materialise the binary
ln -sf ".pnpm/esbuild@0.21.5/node_modules/esbuild" node_modules/esbuild
ESBUILD_BINARY_PATH="$(pwd)/$ESB/bin/esbuild" \
  node node_modules/vite/bin/vite.js --port 5181 --host > /tmp/vite-realm.log 2>&1 &
sleep 5; curl --noproxy '*' -s -o /dev/null -w '%{http_code}\n' http://localhost:5181/
```

## Typecheck (run before every push)
```bash
node node_modules/typescript/bin/tsc --noEmit   # must exit 0
```

## QA in agent-browser
- `agent-browser set viewport 1280 800 && agent-browser open http://localhost:5181/`
- Debug handle exposed at `window.__realm = { store, playerPos }`.
- Teleport to a wild to test taming: `window.__realm.playerPos.set(11,0,0)`
  (first spawn `wild-matong-0` sits at x=13,z=0; within 4.5u triggers the prompt).
- Read state: `window.__realm.store.getState()` → mode/party/nearbyWildId/tamedWildIds.
- `agent-browser console` for runtime errors; `agent-browser screenshot <path>`.
