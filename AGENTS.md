# Argentum Agite — Agent Guide

2.5D mobile action RPG. React + TypeScript + Vite, Three.js for 3D rendering (Octopath Traveler style), Tailwind CSS v4, Gemini AI API integration.

## Commands

- `bun run dev` — dev server on port 3000
- `bun run build` — production build
- `bun run lint` — type-check only (`tsc --noEmit`). This is the only check; no test suite exists.

## Architecture

- Entry: `src/main.tsx` -> `src/App.tsx` (monolithic ~2200-line game controller)
- `src/engine/` — Three.js renderer, camera, shaders, procedural generation, sprite instancing, texture atlasing
- `src/components/` — React UI (HUD, modals, mobile controls, minimap)
- `src/data/` — Static game data: maps, mobs, items, spells, quests, crafting recipes, spritesheets, environment config
- `src/services/` — Combat engine, content registry, save/load, sound
- `src/types/game.ts` — All TypeScript interfaces/types for the game domain
- `src/utils/inventoryUtils.ts` — Inventory logic
- `assets/` — Local assets (currently only `.aistudio/` config)
- `public/textures/` — Texture assets
- Root has one-off utility scripts (`fix_*.cjs`, `rewrite_maps.ts`, etc.) — not part of the app build

## Path Alias

`@/*` maps to project root (configured in both `tsconfig.json` and `vite.config.ts`).

## Key Conventions

- Game content (item names, class names, skill names, map IDs, dialogue) is in **Spanish**. Preserve Spanish when adding or modifying game data.
- Character classes: `novicio`, `guerrero`, `cazador`, `mago`, `picaro`
- Skill names, stat names (`fuerza`, `agilidad`, etc.), and map IDs use Spanish identifiers.
- Spritesheets are loaded at runtime from remote GitHub URLs defined in `src/engine/assetManifest.json`.
- No `.env` file needed locally — `GEMINI_API_KEY` and `APP_URL` are injected by AI Studio at runtime. See `.env.example`.
- `DISABLE_HMR` env var disables Vite HMR + file watching (used by AI Studio agent edits).
- No test framework is configured. If you add tests, discuss framework choice with the user first.
- No CI/CD pipelines. No pre-commit hooks. No formatter config.

## Rendering Pipeline

The game uses a custom 2.5D renderer (`Game3DRenderer.ts`) that combines:
- Orthographic Three.js camera with 45-degree isometric tilt
- Sprite-based characters (`SpritePBRGenerator`, `SpriteInstancingManager`)
- Procedural terrain and environment (`EnvironmentGenerator`, `ProceduralTreeGenerator`)
- Post-processing via `PostProcessingManager` and `PixelShaderPass`

## Modals

All UI modals live in `src/components/`. They are toggled by boolean state in `App.tsx`. When adding a new modal, follow the existing pattern: create component, add toggle state in App, wire it into the render tree.
