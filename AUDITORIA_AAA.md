# AUDITORÍA AAA — Argentum Agite

**Proyecto:** Argentum Agite (React + TypeScript + Vite, Three.js, render 2.5D HD-2D estilo Octopath Traveler, Tailwind CSS v4)
**Alcance:** Rendering, texturas, iluminación, partículas, rendimiento y arquitectura.
**Tipo:** Auditoría de solo lectura — no se modificó ni escribió código del juego.
**Idioma:** Español (convención del repo).
**Fecha:** 31 de agosto de 2026

> **Nota de verificación:** Todos los hallazgos de este documento fueron contrastados contra el código real, con referencias `archivo:línea` verificadas. Se evitó emitir afirmaciones especulativas; donde hay matices (p. ej. cachés que mitigan un riesgo), se documenta el comportamiento real y el riesgo residual.

---

## 1. Resumen ejecutivo

**Hallazgo estructural principal: el mundo tiene dos fuentes de estado desacopladas.**

- El **loop del renderer** (`Game3DRenderer.startLoop`, corre en `requestAnimationFrame` a 60 fps) interpola posiciones (lerp) y vuelve a instanciar los personajes cada frame.
- El **estado del mundo** vive en **React**: los mobs se mueven por un `setInterval` de IA en `App.tsx` (línea 1418) y se propagan al renderer a través de `updateEntities` invocado desde un `useEffect` de React en `GameCanvas.tsx` (línea 249) cada vez que cambian `player`/`activeMobs`/`selectedTarget`.

Esta dualidad provoca desincronización potencial (el renderer interpola hacia un estado que React puede actualizar de forma irregular) y acopla un motor 3D de alta frecuencia a la cadencia de re-render de React. Es la raíz de varios problemas menores de rendimiento y de la dificultad de refactorizar sin romper nada.

**Conclusión:** el proyecto tiene una dirección visual coherente y ambiciosa (PBR sintético sobre sprites, outline pixelado, bloom HD-2D, instanciado), pero la **implementación actual es ineficiente para móvil**: sombras 2048×2048, bloom por fuerza bruta de 25 taps a resolución completa, texturas de personaje que crecen combinatoriamente en memoria según HP/animación/orientación, y batches de instanciado que se regeneran y acumulan sin reciclarse. La deuda estructural (estado dual + god-objects) debe pagarse **antes** de iterar en lo visual, o cada mejora estética amplificará el coste.

---

## 2. Fallos concretos por área

Cada hallazgo incluye: descripción, referencia verificada, prioridad y corrección recomendada.

### 2.1 Estética visual

| # | Descripción | Ref | Prioridad | Corrección |
|---|---|---|---|---|
| E1 | **Dos paradigmas de iluminación compiten**: el entorno usa `MeshToonMaterial` (gradiente toon de 4 niveles) mientras los sprites de actores usan `MeshStandardMaterial` (PBR real). Los personajes "no pertenecen" al mundo visualmente. | `EnvironmentGenerator.ts` / `SpritePBRGenerator.ts` (materiales) | **Alto** | Unificar el lenguaje: o todos los actores en toon (artístico) o todos en el mismo shading. Definir en un art bible y aplicarlo a entorno + actores. |
| E2 | **Fallback de iconos usando emojis** en-game (jugador y mobs). Mezcla estética de emoji con pixel-art HD-2D al cargar sin spritesheet. | `Game3DRenderer.ts:1211` | **Medio** | Reemplazar todo fallback emoji por sprites propios; emoji solo como placeholder de desarrollo. |
| E3 | **Nombre/etiqueta del personaje quemada dentro del canvas 256px** de la textura world-space. Texto pequeño, no localizable, dependiente de resolución. | `Game3DRenderer.ts` (nombre en `renderSpriteCanvas`) | **Medio** | Mover etiquetas de nombre al HUD/overlay DOM. Mejora legibilidad, localización y DPI. |
| E4 | **Panel de desarrollo visible en la UI** ("Motor Gráfico & Precisión" con sliders del shader) no ocultable para el jugador final. | `GameCanvas.tsx` | **Bajo** | Ocultar detrás de un flag/cheat y fuera de las builds de release. |
| E5 | **Paleta y colores diseminados** en hex hardcodeados (`index.css`, `environmentConfig.ts`, `Game3DRenderer.ts`), dificultando coherencia y retoque global. | `index.css`, `environmentConfig.ts`, `Game3DRenderer.ts` | **Bajo** | Centralizar en un único tema/paleta maestra (Design Tokens) consumido por todos los departamentos. |
| E6 | **Sin mipmaps en el sprite** (`generateMipmaps=false`) con escalado lineal → shimmer/aliasing al alejarse. | `Game3DRenderer.ts:1109` | **Alto** | Usar mipmaps con filtro `NearestMipmapNearest` (mipmap correcto para pixel-art). |

### 2.2 Iluminación

| # | Descripción | Ref | Prioridad | Corrección |
|---|---|---|---|---|
| L1 | **Sin tonemapping**: solo `outputColorSpace = SRGBColorSpace` sin `toneMapping` (queda `NoToneMapping` por defecto). Con intensidades de luz >1.0, los highlights se recortan y los colores cálidos del día "queman". | `Game3DRenderer.ts:505-510` | **Alto** | `renderer.toneMapping = ACESFilmic` con `toneMappingExposure ≈ 1.0–1.1`; en móvil bajo usar `ReinhardToneMapping` (más barato). |
| L2 | **Shadow map 2048×2048 PCF** fijo, sin escalar por calidad/dispositivo. Caro en GPU móvil, y el coste se duplica con `setPixelRatio(devicePixelRatio)`. | `Game3DRenderer.ts:764-765`, `:507` | **Alto** | Escalar por calidad: 1024 en móvil, 2048 en desktop; ajustar `shadow.camera` al deadzone visible, no a toda la escena. |
| L3 | **Punto de luz por portal** dentro de `lightGroup`; `lightGroup.clear()` los retira de la escena pero no se gestionan de forma reutilizable (pool), y no se liberan con el recorrido estándar de `dispose()`. | `EnvironmentGenerator.ts:648-651`, `Game3DRenderer.ts:751` | **Medio** | Pool de `PointLight` de tamaño fijo con reutilización por proximidad; un único `dispose` centralizado en `destroy()`. |
| L4 | **Fog exp2 constante** — no se sincroniza con el ciclo día/noche (fog y sombras cambian de color pero la niebla no sigue la hora). | `Game3DRenderer.ts:869` | **Bajo** | Vincular el color/ densidad de niebla al `timeProgress`/`isNight`. |

### 2.3 Texturas

| # | Descripción | Ref | Prioridad | Corrección |
|---|---|---|---|---|
| T1 | **Atlas único en JPEG de 46 KB** (`/textures/atlas.jpg`, 4×2 tiles) como única fuente de texturas del entorno. Resolución/calidad insuficiente para "AAA" y **artefactos de compresión JPEG** en pixel-art. | `public/textures/atlas.jpg`, `TextureAtlas.ts:50-51` | **Crítico** | Atlas en PNG/WebP sin pérdida, con tiles 128–256px y **margen de 2–4px por tile** (evita UV bleed). |
| T2 | **El entorno recarga `atlas.jpg` por cada tile** con `new Image()` en `generateBlendedTileTexture`, duplicando la textura que `TextureAtlas` ya cargó como singleton. Dos fuentes de verdad de la misma textura. | `EnvironmentGenerator.ts:235-237` | **Alto** | Reutilizar el atlas ya cargado por `TextureAtlas`; eliminar el `new Image()` repetido. |
| T3 | **Crecimiento combinatorio de la caché de texturas de personaje**: la clave incluye `hpPercent`(décimas) + `facing` + `animFrame` + `showHp` + debug. Durante el combate (HP en decadencia × 4 orientaciones × 4 frames) se generan y retienen **cientos de canvases 256×256 con sus mapas normal/rough/metal**, sin límite. | `Game3DRenderer.ts:1088`, `:1116`, `:2589` | **Alto** | Clausurar la clave a `spriteUrl`(o id de spritesheet) + orientación base; aplicar HP/animación vía textura específica limitada o uniform/instancia, no por combinación. Introducir LRU con tope de memoria. |
| T4 | **`applyUVs` usa padding manual pequeño** (`0.001`) sobre el atlas — riesgo de *UV bleeding* entre tiles con filtrado lineal. | `TextureAtlas.ts` (padding de tiles) | **Medio** | Margen real por tile en el atlas (celda de 2–4px) en lugar de padding de coordenadas mínimo. |
| T5 | **Texturas procedurales/CanvasTexture sin compresión** (formato crudo) — en móvil gastan banda de memoria y ancho de banda de texel. | `EnvironmentGenerator.ts`, `Game3DRenderer.ts:1108` | **Bajo** | Utilizar formatos comprimidos (ASTC/ETC2 en móvil) si el target lo permite. |

### 2.4 Efectos de partículas

| # | Descripción | Ref | Prioridad | Corrección |
|---|---|---|---|---|
| P1 | **No existe sistema de partículas real**: todo efecto son **mallas Three.js individuales** con `new Mesh` + geometría y `material.clone()` por instancia → draw calls individuales por partícula. | `Game3DRenderer.ts:1726`, `:1827` (arrays de meshes) | **Crítico** | Sistema de partículas GPU (`THREE.Points` / `PointsMaterial`) con atributos de buffer (posición/color/alfa/tamaño) actualizados en el loop central. Una draw call por efecto. |
| P2 | **Efectos lanzados con `requestAnimationFrame` independientes del loop** (proyectiles, loot, impactos, auto-align), desincronizados del render principal y sin pausa eficiente de pestaña inactiva. | `Game3DRenderer.ts` (RAF anidados) | **Alto** | Centralizar todos los efectos en el loop principal con un pool de partículas. |
| P3 | **`material.clone()` por spark** — multiplica programas/shader y rompe el compartido de materiales. | `Game3DRenderer.ts` (sparks) | **Alto** | Reutilizar material(es) compartidos; solo variar estado por partícula (color/alfa) vía instancia buffer. |
| P4 | **`telegraphGroup.clear()` sin `dispose()`** de las `RingGeometry`/materiales creados en cada telegrafía; y `new THREE.RingGeometry` nuevo por telegrafía → **fuga de memoria GPU** acumulada. | `Game3DRenderer.ts:1433`, `:1436`, `:1446` | **Crítico** | Pool de geometrías/materiales de telegrafía que se crean una vez y se reutilizan/ocultan; siempre `dispose()` lo creado. |
| P5 | **`spawnSpellEffect` libera solo `geometry`** del proyectil, no el material. | `Game3DRenderer.ts:1480` | **Medio** | Liberar `geometry` + `material` (+ textura si aplica) en cada proyección. |

### 2.5 Optimización y rendimiento

| # | Descripción | Ref | Prioridad | Corrección |
|---|---|---|---|---|
| R1 | **`batchKey` de instanciado incluye `name + hpPct(décimas) + facing + animFrame`**. Como HP, orientación y frame de animación cambian, cada variación crea un **nuevo `InstancedMesh`**. `commitFrame()` solo alterna `visible` pero **nunca elimina batches vacíos** → crecimiento acumulado de draw calls y fragmentación de VRAM en combate/movimiento. | `Game3DRenderer.ts:2121`, `SpriteInstancingManager.ts:84-121` | **Crítico** | Agrupar por **id de spritesheet/textura base**, no por combinación de estado; aplicar HP/animación vía atributos de instancia/uniform, y **reciclar/eliminar batches** cuando `activeCount` cae a 0. |
| R2 | **`frustumCulled = false` en todas las mallas** (sprites, NPC, instancias, sombra) → el renderer no descarta nada por culling, se dibuja todo siempre. | `Game3DRenderer.ts:891`, `:2013`; `SpriteInstancingManager.ts:88`, `:47` | **Alto** | Reactivar `frustumCulled = true` (Three calcula AABB automáticamente). Mantener `false` solo donde se require. |
| R3 | **Sin sistema de LOD** — la geometría procedural no se simplifica por distancia y los sprites no bajan de resolución lejos del jugador → overdraw en mapas grandes. | — | **Alto** | LOD para geometría (variantes de baja densidad) y para sprites (resolución reducida por distancia). |
| R4 | **Bloom por fuerza bruta: bucle anidado 5×5 (25 taps)** por píxel en un solo pase de shader a resolución completa (`window.devicePixelRatio`), junto con 4 taps de edge detection + AO + dithering. Muy caro en móvil. | `PixelShaderPass.ts:236-247`; `Game3DRenderer.ts:848` | **Alto** | Bloom separable (doble pase 1D) o a media resolución; edge detection optimizado. |
| R5 | **Doble ciclo de estado** — `updateEntities` se dispara por re-render de React con `[player, activeMobs, selectedTarget]`, mientras el loop del renderer corre a 60 fps con su propio lerp. | `GameCanvas.tsx:246-251`, `Game3DRenderer.ts:1188`, `:2092` | **Alto** | Unificar el estado: que el loop del renderer lea de una única store/ECS; React consume y escribe en esa store, no alimenta al renderer frame a frame. |
| R6 | **Pantalla de carga artificial** — `preloadMapAssets` simula progreso con `setTimeout(120ms/100ms/80ms)` en lugar de medir trabajo real de assets. | `AssetLoader.ts:88-101` | **Bajo** | Medir progreso real por resource cargado. |
| R7 | **`destroy()` no limpia `vfxGroup`, `telegraphGroup`, `lightGroup`, `debugGroup`** ni el reticle/facing-indicator (geometrías/materiales de estos grupos no se liberan). Fuga en unmount/hot-reload. | `Game3DRenderer.ts:2580-2605` | **Medio** | `dispose()` sistemático de toda geometría/material/textura de todos los grupos en `destroy()` y en `loadMap()`. |
| R8 | **`loadMap` no limpia `vfxGroup`** — VFX/retículos pueden perdurar entre mapas. | `Game3DRenderer.ts:852-865` | **Medio** | Limpiar `vfxGroup` + `telegraphGroup` + `debugGroup` al cambiar de mapa. |

### 2.6 Arquitectura profesional

| # | Descripción | Ref | Prioridad | Corrección |
|---|---|---|---|---|
| A1 | **`Game3DRenderer.ts` (2606 líneas) es un god-object**: renderer, input, movimiento, colisión, raycast, VFX, partículas, retículo y cámara todo en una clase. Viola SRP y dificulta test/refactor. | `Game3DRenderer.ts` | **Crítico** | Dividir en módulos cohesivos: `SceneDirector`, `SpriteRenderer`, `EnvironmentRenderer`, `ParticleSystem`, `InputController`, `CollisionSystem`, `CameraRig`, `LightingManager`. `Game3DRenderer` como fachada. |
| A2 | **`App.tsx` (2244 líneas)** cargar estado, economía, crafting, combate, UI y **pathfinding A\* inline**. | `App.tsx` | **Alto** | Extraer servicios/hooks (EconomyService, CraftingService, PathFinder). |
| A3 | **A\* inline con `openList.sort` O(n log n) por iteración + `shift()` O(n) + `find` O(n)** → cuasi-O(n³) en el peor caso, dentro del componente React. | `App.tsx:317`, `:318`, `:345` | **Alto** | Usar min-heap / `BinaryHeap` para la open list; mover a un servicio de pathfinding. |
| A4 | **Acoplamiento contractil React↔Renderer**: `rendererRef` pasa como prop bruta; `GameCanvas` muta el renderer vía decenas de setters en `useEffect`. Frágil y difícil de testear. | `GameCanvas.tsx`, `App.tsx` (props) | **Alto** | Intermediario único (`GameWorld` store) consumido por renderer y UI por separado. |
| A5 | **AssetLoader y TextureAtlas duplican caché / no comparten** y `EnvironmentGenerator` crea su propia carga (ver T2). | `AssetLoader.ts`, `TextureAtlas.ts`, `EnvironmentGenerator.ts` | **Medio** | Caché única centralizada de texturas/imágenes. |
| A6 | **RNG deterministico duplicado** — `seededRandom` copiado en `EnvironmentGenerator.ts:8` y `ProceduralTreeGenerator.ts:8`. | ambos | **Bajo** | Extraer a `utils/math.ts` (un solo determinismo garantizado). |

---

## 3. Anti-patrones y deuda técnica

1. **Doble fuente de verdad del estado del mundo** (renderer a 60fps vs React por re-render) — deuda estructural raíz.
2. **God-objects** (`Game3DRenderer.ts`, `App.tsx`) y lógica de dominio embebida en componentes UI.
3. **Recursos creados con `new` por evento/frame sin pool ni reciclado** (telegraph, partículas, proyectiles, batches) → fugas y draw calls crecientes.
4. **Cachés sin límite de memoria** (texturas de personaje por combinación de estado).
5. **Carga duplicada de recursos** (atlas por tile + singleton).
6. **`frustumCulled=false` global** y **sin LOD** → sin culling ni simplificación.
7. **Pathfinding O(n³) en el componente**.
8. **Sin sistema de partículas dedicado**; efectos como mallas individuales con RAF anidados.
9. **Sin tests ni CI** (documentado en AGENTS.md) — agrava el riesgo de cualquier refactor.
10. **Ruido de documentación** en el código ("AAA HD-2D ARCHITECTURE", "Physical Rules") que no sustituye documentación real y dificulta el mantenimiento (deuda menor).

---

## 4. Recomendaciones AAA por área

**Ilimitación / color (mayor impacto visual por menor coste):**
- Activar tonemapping ACES + exposición; calibrar en paralelo (los valores >1.0 cambiarán de look al pasar a ACES).
- Escalar shadow maps y pixelRatio por perfil de dispositivo.
- Unificar el material de actores con el entorno (toon vs PBR estándar) para abolir el choque estético E1.

**Texturas:**
- Atlas PNG de alta calidad con margen por tile; centralizar la carga en un solo loader (elimina T2/T4).
- Mipmaps correctos para pixel-art (`NearestMipmapNearest`) en sprites (E6/T3).
- Caché de texturas con clave estable y LRU con tope de VRAM (T3).

**Partículas:**
- Sistema de partículas GPU (`Points`) unificado en el loop principal, con pool de buffers y materiales compartidos (P1/P2/P3).
- Pool + `dispose()` estricto para telegraph y proyectiles (P4/P5).

**Rendimiento:**
- Estabilizar `batchKey` por spritesheet base y reciclar batches (R1).
- Reactivar `frustumCulled`, añadir LOD (R2/R3).
- Bloom separable/media-resolución (R4).
- Unificar estado en una store única (R5); limpiar todos los grupos en `destroy`/`loadMap` (R7/R8).

**Arquitectura:**
- Descomponer renderer y App en módulos cohesivos y servicios; min-heap para pathfinding (A1–A4).
- **Añadir tests (vitest) y snapshots de render** antes de refactorizar, dado el riesgo sin CI.

---

## 5. Matriz de prioridades (orden recomendado de ataque)

| Fase | Acción | Prioridad | Riesgo build | Esfuerzo | Valor |
|---|---|---|---|---|---|
| 1 | Pool + dispose en telegraph/proyectiles y limpieza de grupos en `destroy`/`loadMap` (P4/P5/R7/R8) | Crítico | Bajo | Bajo | Alto (estabilidad) |
| 2 | Estabilizar `batchKey` por spritesheet y reciclar batches (R1) | Crítico | Medio | Medio | Alto (draw calls) |
| 3 | Limitar caché de texturas con clave estable + LRU (T3) | Alto | Bajo | Bajo | Alto (memoria) |
| 4 | Atlas PNG + carga centralizada (T1/T2/T4) | Crítico | Medio | Medio | Alto (calidad) |
| 5 | Tonemapping + sombras/pixelRatio escalados (L1/L2) | Alto | Bajo | Bajo | Alto (look/perf) |
| 6 | Reactivar `frustumCulled` + LOD básico (R2/R3) | Alto | Medio | Medio | Alto (perf) |
| 7 | Sistema de partículas GPU unificado (P1-P3) | Alto | Alto | Alto | Alto |
| 8 | Unificar estado (store única) + desacoplar renderer de React (R5/A4) | Alto | Alto | Alto | Medio (habilitador) |
| 9 | Bloom separable/media-res (R4) | Alto | Bajo | Bajo | Medio |
| 10 | Refactor god-objects + pathfinding min-heap (A1-A3) | Alto | Alto | Alto | Medio |
| 11 | Unificar material actores/entorno y mipmaps (E1/E6) | Alto | Medio | Medio | Medio |

**Orden lógico:** primero lo que elimina coste/fuga sin cambiar el look (1→3), luego lo que mejora calidad base (4→5), luego rendimiento estructural (6→9), y por último el refactor arquitectónico grande (8, 10) que debe **habilitarse** con tests previos.

---

## 6. Opciones estratégicas

### Opción A — Pulido de bajo riesgo (mantener arquitectura)
Aplicar las correcciones de alto impacto y bajo riesgo: pool/dispose (P4/P5/R7), estabilizar batchKey (R1), caché LRU (T3), atlas PNG (T1/T2), tonemapping + sombras escaladas (L1/L2), `frustumCulled` (R2).
- **Pros:** rápido, alto impacto visual/perf inmediato, riesgo de build bajo, sin tocar estructura.
- **Contras:** deja la deuda estructural (estado dual + god-objects) intacta; volverá a morder en cada feature nuevo.
- **Ejemplo real:** pulir un motor existente (tipo patch de estabilidad) sin re-escritura.

### Opción B — Refactor arquitectónico del núcleo
Extraer una capa de estado única (store) consumida por renderer y UI, y descomponer `Game3DRenderer`/`App.tsx` en módulos cohesivos y servicios (R5/A1-A4).
- **Pros:** correcto a largo plazo; permite añadir features (partículas, LOD, multiplayer) con base sana.
- **Contras:** alto alcance y riesgo; sin tests ni CI, cada paso debe validarse manualmente; retrasa mejoras visuales.
- **Ejemplo real:** re-escrituras de motor que primero amoldan la arquitectura y luego el contenido.

### Opción C — Micro-piloto aislado (recomendada)
Construir, fuera de `App.tsx`, un PoC aislado del sistema de partículas GPU + tonemapping + material unificado; validar look HD-2D y rendimiento en móvil **antes** de comprometerse al refactor completo.
- **Pros:** valida el valor real del cambio con riesgo mínimo; decide A vs B con datos; no bloquea las mejoras de bajo riesgo de la Opción A en paralelo.
- **Contras:** añade un módulo PoC que puede descartarse; requiere tiempo de laboratorio.
- **Ejemplo real:** *vertical slice* / prototipo técnico para des-riesgar antes de un refactor.

**Recomendación final:** ejecutar **Opción C** como des-riesgo, en paralelo a las correcciones de la **Opción A** (Fases 1–6). Si el PoC confirma el beneficio, escalar a la **Opción B** con confianza y, sobre todo, **con tests (vitest) montados primero**. Esto maximiza valor inmediato y reduce el riesgo del cambio estructural. Es una recomendación — la decisión final de roadmap es del equipo/producto.

---

## 7. Riesgos de build y rendimiento a evitar

- **No tocar el pipeline PBR por alto coste sin un snapshot previo**: cualquier cambio en `generateSpriteMaterialTextures` afecta a todos los sprites (el coste O(n²) ya está mitigado por caché, pero romper la clave/caché podría regenerar todo y disparar memoria/CPU).
- **No activar mipmaps/`frustumCulled` a ciegas sobre el atlas JPEG** con padding manual mínimo: puede introducir *UV bleeding* visible. Convertir primero el atlas a PNG con margen (T1/T4).
- **No reemplazar el sistema de partículas de golpe**: introducir el `Points`-based en paralelo y comparar draw calls/perf antes de eliminar el sistema actual (P1).
- **Cuidado al cambiar tonemapping**: los valores de luz >1.0 ya recortados se reasignarán al pasar a ACES — calibrar exposición en el mismo pase sin romper el look (L1).
- **Sin tests ni CI (`tsc --noEmit` solo)**: un refactor grande del renderer puede pasar lint y fallar en runtime silenciosamente. Hacer cambios incrementales verificables y **montar vitest/snapshots antes del refactor**.
- **No añadir EffectComposer (three/addons) sin medir**: el post-procesado actual ya hace bloom O(25) por píxel a resolución completa; ampliar sin optimizar (bloom separable/media-res) empeora el coste móvil (R4).
- **Contenido del juego en español**: no traducir ni anglicanizar ids/nombres de contenido (convención del repo) al tocar datos.

---

## 8. Próximos pasos sugeridos

1. **Validar la decisión de roadmap** (Opción A / B / C) con el equipo de dirección.
2. **Ejecutar el "pas triple" de bajo riesgo** (Fases 1–3) que no cambian el look y eliminan fugas/coste: pool/dispose, batchKey estable, caché LRU.
3. **Montar red de pruebas mínima** (vitest + snapshot del renderer y de texturas) **antes** de cualquier refactor estructural, para que `tsc --noEmit` no sea la única red de seguridad.
4. **Definir art bible + paleta maestra y nuevo atlas** de alta calidad (colaboración `art-director`/`concept-artist`) antes de las iteraciones visuales.
5. **Métricas de validación** — "lo logramos si": FPS estable ≥ objetivo en móvil con draw calls < X, memoria de texturas < presupuesto, VFX sin fugas tras N minutos de combate, y sin scrolling/UV-bleed en el nuevo atlas.

---

*Documento generado por el Creative Director (auditoría técnica/visual de solo lectura). Ningún archivo de código del juego fue modificado.*
