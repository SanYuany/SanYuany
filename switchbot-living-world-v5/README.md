# SwitchBot Living World 5.2

Japanese two-floor home with the existing four life-moment scenes, same-house room exploration, and scenario planner.

## Run

Node 20+ and Python 3. The pinned Three.js runtime is included locally.

```sh
npm test
npm run check
npm run build
npm run portable
npm run preview
```

Deploy `dist/`. Direct-open page: `portable/SwitchBot-Living-World-V5.html`.

## Architectural refinement

Select `家を探索` > `外観・アプローチ` and drag to rotate the finished exterior. Selecting a room reveals the same home's interior. Independent desktop/portrait exterior camera contracts keep the property inside its viewing area. Stories retain the existing room camera tracks and product-state animations.

`refined-world.js` integrates `architectural-finish.js` with the existing renderer. `architecture-state.js` isolates the view policy and deterministic procedural material sampling. Materials and geometry are generated locally, not sourced from third-party image libraries. `planner.js`, `export.js` and the product facts are preserved.

## Verify

```sh
npm install --no-save playwright@1.55.0
npx playwright install --with-deps chromium
# Serve dist on port 4185 before running browser checks.
BASE_URL=http://127.0.0.1:4185/ node tests/refinement-browser.mjs
# Install FFmpeg/libx264 before generating the exterior film.
BASE_URL=http://127.0.0.1:4185/ node scripts/exterior-film.mjs
```

The test workflow captures the actual WebGL output, checks the view transition, validates a real plan download, and saves desktop/mobile screenshots before film generation. Videos are sequential camera renders, not hardware FPS measurements.

## Release boundary

An architectural illustration, not construction drawings or product CAD. No live pricing, payment or unified checkout is implemented. `netlify.toml` contains deployment configuration; a successful local build does not prove a public deployment. Verify the actual public domain and runtime before declaring publication. Never place credentials in source, logs or distributable packages.

Three.js is redistributed with its MIT license. All newly added geometry and procedural surface maps are original.

## V5.2 completion pass

The first and last story views show the finished facade. Scroll reveals the same underlying rooms before the morning scene. The facade is a pure reversible function of scroll position, not a new house. No product claims or automation rules changed.

The direct 3D entry opens the exterior; auto-rotation preserves it instead of jumping to the cutaway. Local file pages export a shareable plan file, never a broken null-origin URL. Desktop and portrait remain independently composed.

Public hosting is separate from browser acceptance. Deployment uses only an existing standard NETLIFY_AUTH_TOKEN repository secret, never credentials or temporary proxy authorizations stored in repository files. No payment or unified checkout is implemented.
