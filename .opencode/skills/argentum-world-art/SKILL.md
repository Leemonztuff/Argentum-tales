# Argentum World Art — Consolidated Authority (V1 + V2)

## PURPOSE

Visual and technical-art authority for the Argentum Tales world: 3D environment construction, pixel-art visual language, terrain, buildings, vegetation, rocks, props, materials/textures, lighting and shadows, world composition, environmental hierarchy, 2D/3D coherence, procedural world art, and Three.js rendering/performance.

Does NOT define: gameplay rules, combat systems, UI design, progression, networking, character gameplay logic.

Do not use this skill to justify unrelated architectural rewrites. Preserve working functionality; find the smallest correct change.

---

## DOCTRINE

### 1. Core Art Direction

Argentum Tales is NOT:

> A conventional 3D game with pixel textures.

It IS:

> A pixel-art world built on top of a 3D spatial structure.

**3D provides structure. Pixel art provides identity.**

The final impression must feel like:

> "A pixel-art RPG that happens to have real 3D depth."

NOT:

> "A generic 3D game with low-resolution textures."

References: Stylized Warcraft-like readability + anime/JRPG influence + pixel-art sensibility + medieval fantasy materials + handcrafted appearance.

Non-targets: realism, photorealistic PBR, generic low-poly, asset-store aesthetics, realistic medieval simulation, overly clean geometric abstraction, random colors, visual styles that conflict with the 2D characters.

When forced to choose REALISTIC vs STYLIZED + READABLE, prefer STYLIZED + READABLE unless realism directly improves gameplay readability or world identity.

### 2. Layered Role Split

Use 3D for structure: terrain height, elevation, collision, navigation, building volume, rocks, tree trunks, props, depth, perspective, lighting, shadows, spatial gameplay.

Use pixel art for identity: terrain surfaces, ground variation, walls, roofs, wood, stone, bark, foliage, decals, signs, small props, material identity, visual accents, stylized shadows, environmental details.

Do not force every element to use the same technique. The combination must feel intentional.

### 3. Visual Identity & Anti-Generic Rule

Stylized, colorful but controlled, strong silhouettes, simplified forms, readable materials, deliberate exaggeration, handcrafted look, cohesive world palette. Avoid blur (nearest-neighbor world), photographic textures, excessive texture noise, smooth generic primitives, random hue variation, unnecessary geometric complexity.

Anti-generic: if an asset could belong to a Unity/Unreal demo scene, an asset store pack, or any generic Three.js demo, it is insufficiently specific. Ask: **"What makes this Argentum Tales?"** — answer with silhouette, palette, pixel language, material treatment, proportions, environmental context. Reject and redesign.

### 4. Core Priority Ladder

```
SILHOUETTE
→ PROPORTION
→ MATERIAL
→ COLOR
→ STRUCTURAL DETAIL
→ MICRO DETAIL
```

Do not begin with micro-detail. A beautiful material cannot rescue a generic silhouette. Inspect front, side, top and gameplay-camera silhouettes before adding detail; fix major masses first. Stylization allows controlled exaggeration (large roofs, thick beams, oversized doors, chunky stone, large foliage, exaggerated towers, strong foundations) that improves readability without becoming cartoon noise. Avoid perfect symmetry unless the object logically requires it — introduce controlled variation via rotation, scale, offsets, branch direction, stone placement, roof/window irregularity, prop arrangement, always inside the family's grammar. Avoid perfectly uniform repetition and meaningless polygon noise.

### 5. Pixel-Art System

Pixel art is a visual system, not merely texture resolution. Use: nearest-neighbor filtering, intentional pixel clusters, limited palettes, controlled value ranges, readable silhouettes, hard-edged details, simplified shading, deliberate highlights, dithering only when useful.

Avoid: bilinear/trilinear texture blur, uncontrolled anti-aliasing, photographic textures, excessive micro-detail, random noise, smooth gradients where pixel clusters would work better.

Texture resolution by importance (e.g. 16, 24, 32, 48, 64 px). Do not raise resolution simply because hardware allows it — "pixel influence" does not mean making everything extremely low resolution either.

Maintain coherent **pixel density** across the world: before adding an asset, compare character scale, ground texture scale, building texture scale, foliage detail and prop detail. If an object looks significantly more detailed or smoother than neighbours, simplify it. Visual coherence wins over individual asset quality.

### 6. Texture & Material System

Prefer shared texture atlases over isolated materials (e.g. `environment_atlas` containing grass, dirt, mud, sand, stone, rock, wood, bark, moss, roof tiles, leaves, plaster). Benefits: visual and palette consistency, fewer materials/draw calls, easier procedural variation and biome management, better mobile performance.

Keep a limited material vocabulary: grass, dirt, stone, wood, bark, plaster, metal, roof, sand, snow, water. Materials communicate function: foundation→stone, structure→wood/stone, roof→wood/thatch/tile, metalwork→iron/bronze, magic→controlled fantasy accent. Avoid generic shiny materials; identify materials through palette, pixel clusters, value and simplified shading, not PBR complexity.

**Pixel-painted geometry**: where useful, paint lighting/value into the texture (e.g. a stone wall with dark lower stones, medium body, lighter upper planes, selective highlights, painted cracks, moss accents) instead of relying entirely on real-time lighting. 3D geometry + pixel-art texture + nearest filtering + stylized lighting.

### 7. Color Language

Restrained fantasy palettes: earthy greens, muted browns, warm stone, desaturated blue, deep red, muted gold, natural foliage, controlled fantasy accents. Avoid neon, excessive saturation, rainbow materials, random hue variation, overly bright surfaces. Color variation should communicate material, biome or importance. Each biome keeps a controlled palette; biome identity must remain visible even when textures are simplified.

### 8. Lighting, Shadows & Water

Stylized, not PBR: simple key light, controlled ambient, readable light direction, controlled highlights, soft or stepped tonal transitions, restrained specular. Avoid plastic appearance, bloom-heavy scenes, realistic cinematic lighting, complex reflections. Use pixel-art/stylized **shadow decals** under characters, trees, buildings and rocks.

Lighting composition establishes time/biome mood, important areas, depth and material separation — not merely to make everything brighter. Shadows provide grounding and lighting direction; prioritize characters and major structures before tiny props; avoid expensive shadow complexity for objects that barely affect gameplay.

Water: 3D geometry + pixel-art surface + controlled animation (texture offsets, simple wave patterns, foam, shoreline decals, underwater color variation) + pixel-art shoreline treatment. Readable at gameplay distance; avoid photorealistic ocean simulation.

### 9. Buildings & Families

Buildings are constructed from visual masses: foundation + main body + secondary volume + roof + openings + structural elements + trim + props. Add beams, supports, stone corners, window frames, doors, chimneys, signs, roof trim, balconies, awnings. Do not place windows on a cube and call it a building; avoid cubes-with-a-texture, perfectly identical houses, excessive realism, completely smooth geometry.

Use 3D geometry for volume and structure (walls, roof volume, doors, windows, beams, chimneys, balconies); pixel art for surfaces (stone, wood, plaster, roof tiles, windows, doors, decorative details).

Buildings belong to **role-named architectural families** (matching the code):

```
MEDIEVAL VILLAGE
├── small_house / pavilion
├── workshop
├── blacksmith
├── inn
└── storage
(future: SHOP, TOWER)
```

Shared: roof language, material palette, structural logic, proportions, trim. Variable: silhouette, footprint, roof shape, window placement, props, color accents, size. Variation comes from structure, not merely random colors.

### 10. Vegetation

Never represent a tree as `cylinder trunk + cone foliage` unless intentionally stylized for a purpose. Use: irregular 3D trunk + simplified major branches + pixel-art foliage masses + pixel-art ground shadow. Foliage cards/billboards/crossed planes are appropriate (strong silhouette, low poly, mobile-friendly). Multiple foliage masses, asymmetric silhouette, controlled variation.

Create vegetation families preserving species identity AND size tiers:

```
species tiers: tree_small/medium/large, ancient_tree, dead_tree,
bush_small/large, ground_vegetation
species identity: Oak_A/B/C, AncientTree_A, DeadTree_A, Bush_A/B, Grass_A/B
```

Foliage reads as stylized masses, not random geometry or uniform repetition.

### 11. Rocks

Strong silhouette, large planes, controlled faceting, irregular proportions, readable material: base mass → major planes → secondary fracture → material variation. Exaggerated shapes, simplified planes, biome-specific palettes, pixel-art rock textures, controlled highlights. Avoid generic deformed spheres and realistic geological simulation. Identifiable from a distance.

### 12. Props & Environmental Storytelling

Props tell the player something:

```
crate → storage          forge → crafting       campfire → human presence
broken cart → history    sign → navigation      altar → lore/religion/magic
well → settlement        statue → culture       ruins → age
```

Props use simple readable geometry, pixel-art materials, strong silhouettes, controlled detail. Prefer modular prop families over hundreds of unrelated assets. Avoid random decorative clutter.

Combine props to imply history without text: e.g. old road + broken cart + scattered crates + overgrown stones = abandoned trade route.

### 13. Terrain & Biomes

Terrain is a key visual layer; it must feel authored even when procedural: height/slope/material/vegetation/rocks/water/paths/structures; biome-specific pixel textures, transitions, decals, patches. Not a flat plane with one repeated texture. Visual grammar per biome:

- GRASS: dirt patches → worn paths → stones → vegetation → landmarks
- FOREST: grass, dirt, leaves, roots, moss, shadows
- COAST: sand, rock, weathered wood, water, coastal vegetation
- RUINS: broken stone, collapsed structures, overgrowth, aged materials
- DESERT: sand, darker sand, rocks, dry vegetation, erosion
- MOUNTAIN: grass, exposed rock, stone, snow where appropriate
- DUNGEON: controlled darkness, stone, structural repetition, strong landmarks

Terrain and biome transitions must be gradual and visually understandable. Do not differentiate biomes using color alone.

Procedural terrain art stays inside an art-directed envelope: deterministic seeds, controlled noise, biome rules, weighted distributions, modular texture sets, min/max density limits. Avoid pure random placement, uniform noise, obvious copy/paste, visual clutter.

### 14. Circulation: Paths, Landmarks, Density

Paths communicate navigation: dirt, stone, grass interruption, fences, lighting, props, terrain shaping, road width, vegetation reduction, elevation. Never rely exclusively on minimap/UI.

Landmarks identify areas without UI: unusual silhouette, height/verticality, unique architecture, color accent, larger props, lighting differences, strong framing. "That is the castle." Do not make every object visually important.

Density varies: dense areas + open areas + landmarks + transition zones. Do not fill every tile; empty space communicates importance, danger, travel, scale, anticipation.

Environmental hierarchy (3 levels; HERO maps to PRIMARY, BACKGROUND maps to distant TERTIARY):

```
PRIMARY/SECONDARY/TERTIARY
├── PRIMARY: city gates, castles, shrines, boss arenas, landmarks, dungeons  (highest detail, strongest identity)
├── SECONDARY: houses, roads, large trees, bridges, towers, ruins  (strong silhouette, moderate detail)
└── TERTIARY: crates, barrels, small rocks, fences, benches, distant vegetation  (readable but inexpensive; minimal geometry)
```

Detail budget follows gameplay importance + camera proximity + visual prominence. A major landmark deserves more work than a small rock.

### 15. Characters & World Coherence

The world is the stage; characters are the actors. Environment must support character readability: compatible saturation, contrast, pixel density and lighting direction. Avoid noisy backgrounds, high-contrast textures behind characters, chaotic colors, excessive foliage overlap, effects that obscure sprites. Do not make the world ugly or excessively dark to solve character readability.

### 16. Camera-Aware Art & Gameplay Readability

Judge every asset from the actual gameplay camera — at gameplay distance, normal camera angle, mobile screen size, movement and combat. Consider perspective, camera angle, distance, sprite scale, screen coverage. A detail invisible from gameplay distance is low priority. Silhouette > micro-detail.

World art must never obscure the player, enemies, interactables, combat areas, navigation or tactical information. Important gameplay information stays visually dominant. Prevent environment art from compromising targeting, movement, telegraphs or interaction points. Vegetation may partially overlap but must not constantly hide gameplay-critical entities.

Collision and visual geometry are separate layers: VISUAL (detailed, optimized for appearance) vs GAMEPLAY (simple, deterministic, collision/navigation-optimized). A beautiful house can use a simple collision footprint; never add expensive geometry merely to represent collision.

### 17. Procedural Rules

- **Deterministic seeds** wherever practical: same seed + parameters → same asset. Improves debugging, reproducibility, world persistence, testing, balancing.
- **Variation within identity** (fixed grammar + bounded randomness + seed + asset family). Never randomize every parameter independently.
- Vary scale, rotation, position, orientation, cluster size, material accent within safe bounds — repeated assets recognizable but not obviously duplicated. Preserve species/family identity.
- **Modularity**: build reusable parts (wall_segment, roof_segment, beam, window, door, chimney, fence, stone, tree_branch, foliage_cluster) and combine into families — not one monolithic mesh.
- **Evolution rule**: improve the grammar before multiplying assets. Establish tree/stone/building/road/prop/material language first; a strong family of 10 coherent assets beats 100 unrelated ones. A family succeeds when assets differ yet obviously belong to the same world.
- **World scale**: maintain consistent relationships between character, door, house, tree, rock, road, terrain. Exaggeration allowed, world must remain believable as a coherent place.

### 18. Performance & Rendering (mobile-first)

Share geometries and materials; instance repeated objects (trees, rocks, grass, torches, fences, repeated architecture, decorative props) — variation via transform/scale/rotation/material attributes, but do not sacrifice all variation for performance. Reuse a geometry when an object differs only by transform; generate-once-and-cache when uniquely deformed; never regenerate static geometry per frame. Use texture atlases, low polygon counts, object pooling, LOD when justified, controlled draw calls, efficient shadows.

Mobile caution: transparency, overdraw, shadows, blur, post-processing, high-poly geometry, unique materials, particle counts. Visual quality must survive mobile hardware.

Avoid: unique material per object, hundreds of unique textures, excessive real-time lights, expensive post-processing, unnecessary render targets, excessive transparency. Never sacrifice gameplay performance for invisible detail.

**Optional pixel-oriented rendering**: the world may render at a lower internal resolution and upscale with nearest-neighbor while UI stays full resolution. Verify mobile readability, UI separation, character readability, camera movement and text rendering before use. Optional, not mandatory.

### 19. Art & Technical Debt

Prioritize visual work: P0 (broken rendering, unreadable gameplay, camera/world mismatch, broken materials, severe performance) → P1 (inconsistent art direction, generic assets, bad terrain transitions, poor lighting, wrong pixel density) → P2 (repetitive assets, missing props, minor texture quality, secondary decoration) → P3 (cosmetic polish). Fix structural problems before decorative details.

When a visual problem repeats across many assets, do not fix each asset individually — fix the underlying generator, material, geometry function, family, palette or composition rule. One systemic fix beats many patches.

Keep procedural generation maintainable with shared generators + parameters + presets + seeds + cached outputs; avoid per-asset special cases unless genuinely necessary.

Do not over-engineer: inspect the existing architecture, identify the smallest correct change, reuse existing systems, avoid duplicate pipelines and unnecessary abstraction, preserve working functionality. Do not rewrite the renderer because one asset looks generic. Change strategy: CURRENT PROBLEM → VISUAL GOAL → SYSTEM AFFECTED → MINIMAL IMPLEMENTATION → GAMEPLAY CAMERA TEST → PERFORMANCE CHECK → EXPAND.

### 20. Workflow

**Asset creation pipeline**: 1. identify gameplay role → 2. identify biome → 3. define silhouette → 4. define visual family → 5. choose geometry complexity → 6. choose pixel texture resolution → 7. apply shared palette/material rules → 8. validate from gameplay camera → 9. validate mobile performance → 10. integrate with procedural placement. Do not create isolated assets without considering their family.

**Asset review**: recognizable silhouette? medieval fantasy identity? stylized not generic? pixel-art compatible with characters? readable from gameplay camera? material identity? controlled asymmetry? no unnecessary detail? reusable? performant?

**World review**: evaluate landmarks, silhouettes, biome, color, density, paths, lighting, gameplay readability as a whole — a collection of beautiful assets can still be an ugly environment if composition is poor. Design with foreground, gameplay plane, background, landmarks, negative space; avoid uniform object placement.

**Visual improvement order** (foundation first): 1. camera/render presentation → 2. terrain → 3. ground textures → 4. buildings → 5. vegetation → 6. rocks → 7. props → 8. lighting → 9. shadows → 10. environmental details → 11. biome-specific polish. Do not polish rocks while the town silhouette is generic; never start by adding polygons, textures, particles, lighting or props.

### 21. Interpretation Clauses

- "Make it prettier" → improve composition, silhouettes, proportions, asset variety, material identity, palette, lighting. Not more geometry.
- "Make it more 3D" → depth, layering, elevation, mass, shadows, spatial relationships, material response — not realism. Maintain stylized 2.5D identity.
- "Make it more like Warcraft" → strong silhouettes, exaggerated proportions, chunky forms, clear material identity, stylized fantasy, visual hierarchy. Never copy specific assets of any proprietary game.
- "Make it more anime" → clean shapes, controlled proportions, readable color blocks, expressive silhouettes, restrained detail. Do not make environment objects character-like.
- "Make it more pixel art" → crisp visual grouping, limited palette, strong silhouettes, controlled texture detail, pixel-aware presentation. Do not blindly pixelate every surface.

### 22. Validation & Final Bar

After touching world generation or renderer systems verify: build/typecheck, no broken imports, no runtime errors, assets/materials render correctly, camera view readable, characters visible, collision valid, mobile performance considered, existing world content remains compatible.

A successful Argentum Tales environment feels: HANDCRAFTED, STYLIZED, MEDIEVAL, FANTASTICAL, READABLE, COHERENT, TACTICAL. It does NOT feel: procedurally-random, generic, asset-store-like, photorealistic, empty, overdetailled, visually noisy.

Ask of every asset: What is this? Why does it exist? What makes its silhouette recognizable? What makes it belong to Argentum Tales? How does it read from the gameplay camera? How does it interact with surroundings? How does it stay performant on mobile?

Final hierarchy —

```
3D           → depth
PIXEL ART    → identity
STYLIZATION  → personality
LIGHTING     → atmosphere
COMPOSITION  → meaning
GAMEPLAY     → purpose
```

**3D provides structure. Pixel art provides identity. Gameplay provides purpose.**