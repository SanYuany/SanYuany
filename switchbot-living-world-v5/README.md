# SwitchBot Living World V5

Japanese detached-house scenario experience. SwitchBot only. Four chapters: Morning, Leaving, Coming Home, Good Night.

## Run

Node 22: npm test; npm run check; npm run build; npm run preview.
For a portable offline HTML: npm run portable (Python 3).

## Actual implementation

Self-hosted Three.js, real perspective geometry, continuous reversible camera path, independently composed portrait path, same-house exploration, locally saved/deduplicated product plans and HTML export. No external render dependencies.

## Film

Install Playwright and Chromium, and FFmpeg with libx264, then run npm run film while the HTTP preview is running. The script validates the encoder BEFORE frame capture and keeps recoverable frames on failures. Films are deterministic renders from this website, NOT a frame-rate benchmark, and NOT the original Scroll World AI-video chain.

## Deploy

Netlify: build command npm run check && npm test && npm run build; publish directory dist. Existing authorized site: switchbot-living-world. Browser smoke checks must target the production URL as well as local HTTP. Offline and static distributions are separate artifacts.

## Scope and disclosure

These are simplified procedural 3D illustrations, not CAD-accurate SwitchBot products or an officially approved brand campaign. Prices, checkout and live hardware control are not implemented. Official product links and compatibility conditions are provided in the scene solutions and docs. No third-party influencer media is redistributed.

## Maintenance

- src/timeline.js: camera and device states
- src/house.js and src/living-details.js: scene geometry
- src/world.js: renderer, controls and state application
- src/data.js and docs/FACT_REGISTRY.json: product/claim data
- src/planner.js and src/export.js: solution quantities and export
- scripts/: builds, local server, portable bundler and video capture
- tests/: domain, build, browser and production checks

Release source recovered from workflow 35065908896 / artifact 10435070540, then corrected to manifest version 5.0.1. Static tests do not substitute for visual acceptance.
