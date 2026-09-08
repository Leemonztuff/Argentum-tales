# Argentum Tales — Game Design & Mechanics Bible

## PURPOSE

This is the **gameplay authority** for Argentum Tales.

Use this skill for:

- gameplay mechanics
- combat
- movement
- classes
- stats
- skills
- spells
- enemies
- bosses
- progression
- equipment
- loot
- quests
- maps
- interaction
- crafting
- rendering/gameplay integration
- future systems

Do NOT use it for purely visual UI work.  
For UI, use:

`argentum-ui-bible`

---

# 1. GAME IDENTITY

Argentum Tales is a:

**Medieval fantasy tactical ARPG inspired by the gameplay identity of classic Argentum-style MMORPGs, modernized for real-time mobile/PC play.**

Core pillars:

```text
TACTICAL POSITIONING
REAL-TIME COMBAT
CHARACTER PROGRESSION
CLASS IDENTITY
EQUIPMENT
EXPLORATION
DANGEROUS WORLD
BUILD VARIETY
```

The game should feel:

- deliberate
- readable
- dangerous
- rewarding
- strategic
- character-driven
- medieval
- persistent

Avoid turning it into a generic:

- hack & slash
- MMO clone
- action roguelite
- button-mashing ARPG
- damage-number simulator

---

# 2. DESIGN NORTH STAR

The player should win because they:

- positioned correctly
- chose the right attack
- understood enemy behavior
- managed range
- exploited class strengths
- prepared their character
- used equipment intelligently
- reacted to telegraphs

Not simply because:

> "My numbers are bigger."

Numbers matter, but decisions must matter too.

---

# 3. CORE COMBAT IDENTITY

Combat is based on:

**position + alignment + range + timing + accuracy + defense + abilities**

The current system explicitly models X/Y alignment and directional attacks. Melee and ranged attacks are not purely free-target action combat. 

Preserve this tactical identity.

---

# 4. GRID / POSITIONING PHILOSOPHY

The world uses a tile-oriented logical coordinate system.

Characters and entities have logical:

```text
x
y
```

positions.

Movement and combat should respect the game's spatial logic.

The current renderer intentionally enforces **4-direction movement rather than diagonals**. 

This is a core tactical characteristic.

Do NOT casually introduce:

- diagonal movement
- free 360° movement
- unrestricted aiming
- physics-based combat movement

unless the game design explicitly evolves toward that direction.

---

# 5. FOUR-DIRECTION DESIGN

Primary directions:

```text
UP
DOWN
LEFT
RIGHT
```

Facing is gameplay-relevant.

Facing may affect:

- attacks
- animation
- targeting
- positioning
- visual feedback

Do not treat facing as merely cosmetic.

---

# 6. POSITIONING SHOULD MATTER

Good positioning should provide meaningful advantages.

Examples:

- staying in attack range
- maintaining alignment
- avoiding telegraphs
- controlling distance
- exploiting ranged attacks
- approaching melee enemies safely
- escaping AoE
- controlling enemy movement

Avoid combat where position becomes irrelevant because every ability can hit everything everywhere.

---

# 7. ALIGNMENT

Current physical combat supports attacks when player and target share X or Y alignment. 

This creates the tactical concept:

```text
ALIGN
→ RANGE
→ ATTACK
```

Preserve this identity.

If the system evolves, improvements should make alignment more intuitive and strategically interesting rather than eliminating it.

---

# 8. RANGE

Range is a first-class gameplay variable.

Current data supports:

- melee range
- ranged weapon range
- spell range
- AoE radius
- boss ability radius



Range should influence:

- positioning
- risk
- class identity
- weapon identity
- enemy design

Avoid making range differences meaningless.

---

# 9. ATTACK TIMING

Attacks use weapon-specific intervals modified by class and agility.

The current system calculates: `baseInterval * classMult - agilityReduction`, minimum 600ms.

Class multipliers: picaro 0.85, guerrero 1.0, cazador 1.1, mago 1.25.

Attack speed should represent:

**tempo**, not merely DPS inflation.

Faster attacks should feel different from slower, heavier attacks.

Do not allow attack-speed scaling to trivialize every other stat.

---

# 10. COMBAT LOOP

The intended basic combat loop is:

```text
Observe
↓
Position
↓
Align
↓
Choose action
↓
Attack / skill
↓
Read result
↓
Reposition
↓
Repeat
```

For stronger enemies:

```text
Observe telegraph
↓
Predict
↓
Move
↓
Punish
↓
Recover
```

---

# 11. ACCURACY / EVASION

Combat currently uses:

```text
attacker accuracy
vs
defender evasion
```

with a bounded hit chance. 

Accuracy should create uncertainty without making combat feel random or unfair.

Maintain readable probabilities.

Avoid:

- unavoidable misses
- excessive RNG
- hidden accuracy penalties
- situations where player decisions are overridden constantly by dice rolls

---

# 12. DAMAGE

Damage should be composed from understandable sources:

```text
base weapon damage
+
relevant stat contribution (fuerza/4 or agilidad/4)
+
class contribution (weaponType-specific bonus)
+
skill/effect modifiers
-
effective defense (flat subtraction, min 1)
```

Current physical combat already follows this general structure.

Accuracy/evasion determines hit chance: `punteria / (punteria + evasion)`, clamped [5%, 95%].

Critical hits: general chance `0.08 + agilidad * 0.005`, multiplier 1.5x. Stab critical: chance `1.6 + apunalar.level * 0.01`, ignores 50% mob defense.

Do not create arbitrary damage formulas without a design reason.

Every major modifier should have a gameplay purpose.

---

# 13. DEFENSE

Defense should mitigate damage without making enemies or players immortal.

Current systems include:

- armor defense
- helmet defense
- shield defense
- boots defense
- evasion
- magic resistance
- shield block

 

Defensive builds should feel meaningfully different from offensive builds.

---

# 14. SHIELDS

Shield gameplay is defensive identity.

Current shield mechanics include:

- block chance
- shield skill
- class contribution
- capped block chance



Future improvements should make shields strategically interesting rather than simply:

> more defense.

Potential design space:

- block timing
- directional defense
- heavy attacks
- protection against telegraphs
- tank utility

Do not add these automatically. Evaluate them against the game's tactical identity.

---

# 15. CRITICAL HITS

Critical hits are high-impact events.

Current combat contains:

- general critical hits: chance `0.08 + agilidad * 0.005`, multiplier 1.5x
- specialized stabbing criticals: chance scales with apunalar level, multiplier `1.6 + apunalar.level * 0.01`, ignores 50% mob defense
- mob criticals: 12% normal mobs, 20% bosses, 1.5x multiplier



Criticals should feel:

- exciting
- rare enough to matter
- visually readable
- mechanically meaningful

Do not allow critical spam to replace tactical decision-making.

---

# 16. ASSASSIN / STAB IDENTITY

The `picaro` class and `apunalar` system establish a specialized high-impact attack identity.  

The identity should emphasize:

- positioning
- burst
- risk
- precision
- opportunistic attacks

Avoid turning the class into a generic high-DPS melee character.

---

# 17. RANGED COMBAT

Ranged combat should create a different tactical loop:

```text
distance
→ alignment
→ attack
→ reposition
```

Ranged weapons should reward:

- spacing
- awareness
- kiting where appropriate
- terrain usage
- target selection

Do not make ranged combat simply "melee from farther away."

---

# 18. MAGIC

Magic should provide a distinct tactical toolkit.

Current spell data supports 12 spells:

```text
dardo_magico        damage   6-11    8 mana   range 4   skill 1   animation: ice
curacion_leve       heal    25-40   14 mana   range 0   skill 10  animation: holy
misil_fuego         damage  14-24   18 mana   range 5   skill 25  animation: fire
escudo_magico       heal    30-55   25 mana   range 0   skill 30  animation: holy
grito_guerra        heal    20-35   15 mana   range 0   skill 15  animation: holy
golpe_sismico       damage  35-65   20 mana   range 2   skill 35  animation: fire
lluvia_flechas      damage  30-60   22 mana   range 5   skill 35  animation: lightning
trampa_cazador      damage  25-45   18 mana   range 4   skill 20  animation: ice
golpe_fantasma      damage  45-85   25 mana   range 1   skill 40  animation: dark
humo_cegador        damage  20-40   15 mana   range 3   skill 20  animation: dark
descarga_electrica  damage  22-38   28 mana   range 5   skill 45  animation: lightning
apocalipsis         damage  50-85   55 mana   range 6   skill 70  animation: dark (segundo job only, unlocked by grimorio)
```

Spell types in code: `damage`, `heal`, `buff`, `aoe`. Note: no buff-type spells actually exist — all support spells use `type: 'heal'`. The `buff` type is in the union but unused.

Magic should trade some combination of:

- mana
- cooldown
- positioning
- vulnerability
- preparation

for stronger utility or effects.

---

# 19. SPELL DESIGN

Every spell should answer:

```text
What problem does this solve?
Why would I use it instead of attacking?
What is the cost?
What is the risk?
What is the counterplay?
```

Avoid adding spells merely because a class "needs more abilities."

Note: Spells are executed inline in `App.tsx`, not via a dedicated spell-casting service in CombatEngine. All spells are available to all classes.

---

# 20. AOE

AoE should be spatially meaningful.

Current boss abilities include:

- AoE radius
- telegraph time
- damage
- cooldown



AoE should create positioning decisions.

Never make AoE purely visual spectacle.

---

# 21. TELEGRAPHS

Boss attacks should communicate danger before damage occurs.

Current boss data explicitly supports:

```text
telegraphMs
aoeRadius
damage
cooldownMs
```



Telegraphs must be:

- readable
- consistent
- reactable
- proportional to danger

A stronger attack should generally require stronger commitment, clearer warning, or greater counterplay.

Never design an unavoidable telegraph.

---

# 22. ENEMY DESIGN

Enemies should differ by behavior, not only statistics.

Enemy identity may come from:

- speed
- range
- aggression
- defense
- evasion
- attacks
- movement
- abilities
- telegraphs
- resistances
- rewards

Current mobs already expose several of these properties. 

---

# 23. ENEMY STATES

Current mob state model includes:

```text
idle
chasing
attacking
returning
telegraphing
```

State transitions are implemented in `App.tsx` (AI interval), not in a dedicated service. The `ActiveMob` type in `game.ts` tracks `state` and `stateTimer`.



Preserve the concept of readable enemy state.

Enemies should feel predictable enough to learn, but dangerous enough to respect.

---

# 24. ENEMY BEHAVIOR PRINCIPLE

Good enemy design:

```text
PLAYER OBSERVES
→ RECOGNIZES
→ PREDICTS
→ RESPONDS
```

Bad enemy design:

```text
PLAYER RANDOMLY GETS HIT
```

Difficulty should come from decisions, timing and pressure rather than invisible randomness.

---

# 25. BOSSES

Bosses must be mechanically distinct.

A boss should have:

- recognizable identity
- attack patterns
- telegraphs
- meaningful positioning
- phases or escalating pressure where justified
- unique rewards
- memorable encounter rhythm

Current `Fendhel` demonstrates the intended direction with unique abilities and guaranteed rewards. 

Do not create bosses that are simply:

> normal mob × 20 HP.

---

# 26. BOSS DESIGN LOOP

Preferred:

```text
Learn pattern
↓
Position
↓
Avoid telegraph
↓
Exploit opening
↓
Deal damage
↓
Recover
↓
Repeat
```

Bosses should test skills the player has learned throughout normal gameplay.

---

# 27. CLASSES

Current class foundation:

```text
Novicio
Guerrero
Cazador
Mago
Picaro
```



Each class must have a gameplay identity.

Do not balance classes by making them identical with different damage numbers.

---

# 28. CLASS IDENTITY

Conceptual identities:

### Guerrero

- durability
- melee
- shield
- reliable physical combat
- sustained pressure
- **combat bonuses**: attack interval ×1.0, shield block +15 classBonus, punteria mod 10

### Cazador

- ranged combat
- agility
- positioning
- ranged pressure
- traps
- **combat bonuses**: attack interval ×1.1, evasion +12, punteria mod 12, +4 classBonus ranged

### Mago

- magic
- mana management
- ranged abilities
- utility
- high-impact spells
- **combat bonuses**: attack interval ×1.25, punteria mod 4

### Picaro

- agility
- precision
- burst
- stabbing
- evasion
- opportunistic combat
- **combat bonuses**: attack interval ×0.85, evasion +10, punteria mod 8, stab critical with apunalar

### Novicio

- learning
- progression
- foundational mechanics
- transition into specialized identity
- **combat bonuses**: base values (punteria mod 4)

These are design directions, not excuses to hard-code every future mechanic.

**Note**: All 12 spells are available to all classes via `knownSpells` — there is no class-specific spell restriction in the current implementation. Class identity comes from combat bonuses, not spell access.

---

# 29. STATS

Current primary stats:

```text
fuerza
agilidad
inteligencia
constitucion
carisma
```

Stat effects in code:

- `fuerza`: melee damage contribution (fuerza/4)
- `agilidad`: ranged damage contribution (agilidad/4), attack speed reduction, critical chance, evasion (agilidad/3)
- `inteligencia`: spell damage, mana pool
- `constitucion`: HP pool
- `carisma`: shop prices, quest rewards (economic modifier)

Each stat must have a clear gameplay purpose.

Never add a stat whose only purpose is to make character sheets look deeper.

---

# 30. STAT DESIGN RULE

Before introducing or changing a stat ask:

```text
What does it affect?
Which builds value it?
Can players understand it?
Does it create meaningful choices?
Does it stack too efficiently?
```

---

# 31. SKILLS

Current skill families include 8 skills:

```text
tacticas_combate     combat tactics, accuracy, evasion contributions
combate_armas        melee weapon combat
combate_distancia    ranged weapon combat
combate_sin_armas    unarmed combat
defensa_escudos      shield block, defense
apunalar             stabbing, critical attacks (picaro)
evasion              dodge, avoidance
magia                spell casting, magic damage
```

Default starting levels (all classes): tacticas_combate 10, combate_armas 10, combate_distancia 5, combate_sin_armas 5, defensa_escudos 8, apunalar 5, evasion 8, magia 5.

Skills are part of character identity and progression.

They should improve through gameplay rather than being arbitrary menu upgrades.

---

# 32. SKILL PROGRESSION

Current skill progression uses:

```text
level
progress
```

and gains progress from relevant actions. 

The intended philosophy is:

> You become better at what you actually practice.

Do not replace this with a generic XP tree without a strong design reason.

---

# 33. SKILL PROGRESSION BALANCE

Avoid:

- grinding one action infinitely
- meaningless skill spam
- passive level inflation
- skills becoming mandatory chores

Skill progression should encourage varied gameplay.

---

# 34. EQUIPMENT

Equipment is a major character-building system.

Current slots include:

```text
weapon
shield
helmet
armor
boots
ring1
ring2
amulet
arrows
```

Current item count: 35 items across 11 types (weapon, shield, helmet, armor, boots, ring, amulet, potion, arrow, material, quest).

Item properties: statsBonus (Partial<PlayerStats>), hpRestore, mpRestore, buffType/buffDurationSec.

Note: `Item.rarity` field exists in the type (comun/poco_comun/raro/epico/legendario) but **no items currently define it** — the rarity system is planned but not implemented. `Chest.requiresKey` exists in the type but no chests use it.

Equipment should modify playstyle, not only increase item level.

---

# 35. WEAPON IDENTITY

Weapons should differ through:

- damage
- speed
- range
- attack type
- accuracy
- class interaction
- special properties

Current weapon model supports:

- dagger
- sword
- axe
- bow
- staff



Do not make weapon choice irrelevant because one weapon always has the highest theoretical DPS.

---

# 36. LOOT

Loot should create meaningful excitement.

Drops can provide:

- progression
- build opportunities
- crafting resources
- quest items
- rare equipment
- boss rewards

Avoid meaningless loot inflation.

If an item drops constantly but has no interesting use, it is noise.

---

# 37. ECONOMY

Gold should have meaningful sinks.

Potential sinks include:

- equipment
- consumables
- crafting
- services
- progression
- repairs or other systems if introduced

Do not introduce gold rewards faster than meaningful sinks can absorb them.

---

# 38. CONSUMABLES

Potions and consumables should create decisions.

Avoid a system where players:

> automatically spam potions whenever HP falls.

Consumables should interact with:

- combat timing
- inventory
- risk
- cooldown
- resource management

---

# 39. CRAFTING

Current crafting supports 10 recipes across 2 stations:

```text
Station: smith (herreria)
  craft_flechas          flechas x30          difficulty 5   tier basica
  craft_espada_corta     espada_corta         difficulty 10  tier basica
  craft_escudo_hierro    escudo_hierro        difficulty 20  tier basica
  craft_espada_larga     espada_larga         difficulty 30  tier intermedia
  craft_hacha_barbara    hacha_barbara        difficulty 35  tier intermedia
  craft_cota_malla       cota_malla           difficulty 25  tier intermedia
  craft_armadura_placas  armadura_placas      difficulty 50  tier avanzada

Station: alchemy (alquimia)
  craft_pocion_roja      pocion_roja x3       difficulty 5   tier basica
  craft_pocion_azul      pocion_azul x2       difficulty 10  tier basica
  craft_elixir_fuerza    elixir_fuerza        difficulty 25  tier intermedia
```

Features: ingredients, gold costs, difficulty tiers (basica/intermedia/avanzada), skill types (herreria/alquimia).

Note: `requiredBookId` field exists in CraftingRecipe type but **no recipe uses it** — planned for unlockable recipes. `skillType: 'cocina'` exists in the type union but has no recipes or implementation.



Crafting should complement exploration and progression.

It should not become mandatory menu maintenance.

---

# 40. EXPLORATION

The world contains 9 maps:

```text
mapa_novicio       Campo de Novicios      theme: town       safe: no
pueblo_inicial     Villa de Ullathorpe    theme: town       safe: yes
bosque_01          Bosque de los Lobos    theme: forest     safe: no
bosque_02          Bosque Profundo        theme: forest     safe: no
dungeon_cripta     Dungeon Cripta         theme: crypt      safe: no  dungeon: yes
costa_01           Costa de las Sirenas   theme: coast      safe: no
dungeon_faro       Faro Olvidado          theme: lighthouse safe: no  dungeon: yes
ruinas_final       Ruinas de Arandor      theme: ruins      safe: no
dungeon_final      Templo del Caos        theme: fire_temple safe: no dungeon: yes
```

Features per map: tiles (9 types), portals, chests, gatherNodes (tree/ore/herb), npcs (dialogue, shopType, quest giving, job promotion), mobSpawns.

Tile types: ground(0), wall(1), water(2), stone(3), wood(4), dense_tree(5), big_rock(6), void(7), dirt_path(8).

Note: 8 biome configs exist in environmentConfig.ts but `plains` biome has no map using it.

Exploration should provide reasons to move through the world.



Exploration should provide reasons to move through the world.

---

# 41. MAP DESIGN

Maps are logical spaces, not merely backgrounds.

A map can communicate:

- danger
- progression
- faction
- biome
- resources
- shortcuts
- encounters
- secrets

Do not create huge maps filled with empty walking.

---

# 42. SAFE VS DANGEROUS AREAS

Maps explicitly support:

```text
isSafe
isDungeon
```



Safe spaces should allow:

- preparation
- recovery
- commerce
- social interaction

Dangerous spaces should introduce:

- risk
- resource pressure
- combat
- exploration decisions

---

# 43. DUNGEONS

A dungeon should feel different from an outdoor map.

Use:

- stronger enemies
- environmental identity
- progression
- encounters
- resource pressure
- boss conclusion
- meaningful rewards

Do not make dungeons merely darker versions of normal maps.

---

# 44. QUESTS

Quest objectives currently support:

```text
kill
gather
clear_dungeon
talk
```

Current quest count: 12 quests. 11 use `kill` objective, 1 uses `gather`. The `clear_dungeon` and `talk` objective types exist in the Quest interface but **no quests currently use them**.

Quest types include: tutorial (quest_novicio_entrenamiento), class job trials (4 quests for guerrero/cazador/mago/asesino), main story (5 quests progressing through maps), second job mastery (quest_segundo_job_maestria), and side quests (quest_side_hierro — gathering).

Quests should reinforce exploration and world context.

Avoid turning the game into:

> waypoint → kill 10 → return → repeat forever.

---

# 45. NPCS

NPCs may provide:

- dialogue
- shops
- quests
- class promotion
- second-job progression
- services



NPCs should support the world's identity, not merely function as vending machines.

---

# 46. CHARACTER PROGRESSION

Progression should have multiple dimensions:

```text
LEVEL
STATS
SKILLS
EQUIPMENT
SPELLS
CLASS
CRAFTING
EXPLORATION
QUESTS
```

No single progression axis should completely dominate the others.

---

# 47. POWER CURVE

When increasing player power, consider:

```text
damage
survivability
tempo
utility
range
consistency
resource efficiency
```

Do not balance solely around damage-per-second.

---

# 48. CONTENT SCALING

When adding new content, compare it against existing content.

New enemy:

```text
HP
damage
accuracy
evasion
defense
resistance
speed
range
reward
behavior
```

New item:

```text
damage/defense
speed
range
stats
class interaction
rarity
economic value
```

New spell:

```text
damage/heal
range
mana
cooldown
skill requirement
area
utility
counterplay
```

New boss:

```text
pattern
telegraph
damage
HP
mobility
arena
rewards
mechanical identity
```

---

# 49. CONTENT SHOULD ADD MECHANICS, NOT JUST NUMBERS

Prefer:

> New enemy with a new behavior

over:

> Existing enemy with +30 HP.

Prefer:

> New weapon that changes combat rhythm

over:

> Existing sword with +10 damage.

Prefer:

> New boss pattern

over:

> Boss with +500 HP.

Numbers are useful for progression.

Mechanics create variety.

---

# 50. DIFFICULTY

Difficulty should primarily come from:

- enemy behavior
- positioning
- timing
- resource management
- encounter composition
- telegraphs
- pressure

Not only:

- inflated HP
- inflated damage
- inflated defense

---

# 51. PLAYER DEATH

Death should have consequences, but consequences must be fair.

Current player state includes gold loss information and a death flow. 

Death should teach:

> What mistake did I make?

rather than:

> The game randomly killed me.

---

# 52. FEEDBACK

Gameplay feedback should communicate:

- hit
- miss
- block
- critical
- skill use
- cooldown
- damage
- loot
- progression
- danger

Current systems already expose floating combat text, combat logs, target indicators and impact effects. 

Feedback should clarify mechanics, not become visual spam.

---

# 53. COMBO SYSTEM

The current implementation tracks a short combo window against the same mob. 

A combo mechanic should reward:

- accuracy
- tempo
- sustained pressure
- correct targeting

It must not force repetitive button spam.

If expanded, introduce meaningful interaction rather than merely increasing a number.

---

# 54. RENDERING PHILOSOPHY

The game uses a **3D renderer to present a 2D/2.5D game world**.

The renderer currently uses:

- Three.js
- billboard sprite geometry
- instancing
- sprite textures
- normal mapping
- specular treatment
- pixel shader/post-processing
- pixel snapping
- perspective camera
- GameLoop (requestAnimationFrame with accumulator pattern)
- 5 shader presets (HD2D_CINEMA, PIXEL_OUTLINE, CEL_OUTLINE, RETRO_DITHER, OFF)
- VegetationBillboardSystem (single draw call, InstancedBufferGeometry + custom ShaderMaterial)
- Magenta chroma-key for sprite transparency
- Head calibration system for body+head sprite composition



The renderer exists to enhance the game presentation without changing its core tactical identity.

---

# 55. 2.5D VISUAL IDENTITY

The world should read as:

**2D characters inside a spatial 3D environment.**

Characters remain visually readable as sprites.

Do not gradually transform the project into a conventional 3D action RPG.

---

# 56. SPRITE PRIORITY

Characters must remain:

- readable
- visually grounded
- correctly scaled
- consistent with the world
- easy to distinguish during combat

Visual rendering should never make tactical positioning ambiguous.

---

# 57. LIGHTING

Current sprite rendering supports normal/specular lighting. 

Lighting should improve:

- depth
- atmosphere
- material separation
- world coherence

Avoid lighting so strong that sprites lose their illustrated/pixel identity.

---

# 58. CAMERA

Current camera supports:

```text
DEADZONE
HARD_FOLLOW
pixel snapping
optional smoothing
screen shake
critical impact
```



The camera should prioritize:

1. spatial clarity
2. responsiveness
3. tactical awareness
4. visual stability
5. cinematic feedback

Do not add smoothing merely because smooth movement looks modern.

For tactical movement, precision is more important than cinematic softness.

---

# 59. CAMERA DEVELOPMENT RULE

If camera behavior feels wrong, determine whether the problem is:

```text
player movement
camera target
deadzone
smoothing
pixel snapping
render interpolation
screen shake
```

Do not randomly change smoothing until the actual source is understood.

---

# 60. PIXEL PERFECT

Pixel snapping is part of the current visual strategy.

Do not disable it globally merely to make motion appear smoother.

If visual jitter appears, investigate:

- logical position
- render position
- snapping
- camera
- sprite sampling
- scaling

before abandoning the pixel-oriented presentation.

---

# 61. SCREEN SHAKE

Screen shake is feedback, not decoration.

Use it for:

- major impacts
- critical hits
- important abilities
- boss attacks

Avoid constant shake.

Critical impacts may have stronger treatment, as the current camera system supports. 

---

# 62. RENDERER / GAMEPLAY SEPARATION

Gameplay state should remain logically independent from visual presentation where practical.

Prefer:

```text
GAME STATE
↓
GAMEPLAY SYSTEM
↓
RENDER STATE
↓
VISUAL OUTPUT
```

Do not bury gameplay rules inside rendering code.

**Current state**: The renderer runs at 60fps via `requestAnimationFrame` and interpolates positions (lerp), while mob AI runs via `setInterval` in `App.tsx`. React state propagates to the renderer via `updateEntities` in `GameCanvas.tsx`. This dual-source architecture is a known structural issue — renderer reads from one cadence while React updates at another.

---

# 63. PERFORMANCE

The renderer is real-time.

Prioritize:

- stable frame time
- efficient sprite rendering
- instancing
- asset caching
- limited unnecessary allocations
- controlled post-processing

Current architecture already includes dedicated managers for:

- CameraManager
- SpriteInstancingManager
- PostProcessingManager
- AssetLoader
- EnvironmentGenerator
- TextureAtlas
- SpritePBRGenerator
- GameLoop
- VegetationBillboardSystem
- ProceduralTreeGenerator
- ProceduralBuildingGenerator
- PropFamilyGenerator
- ContentRegistry (singleton data registry with integrity validation)



Preserve modularity.

---

# 63A. DAY/NIGHT CYCLE

A real-time day/night cycle exists via `useDayNightCycle.ts`.

The system tracks:

- `timeProgress` (0.0 to 1.0)
- `isNight` flag
- Renderer syncs lighting to cycle state

The cycle affects ambient light, fog color, and shadow color. The cycle is continuous and tied to gameplay time.

---

# 63B. COMBO SYSTEM

A short combo window exists via `useCombatCounters.ts`.

Features:

- 3-second combo window against the same mob
- Combo count tracking
- Time-left percentage for UI display
- Simple counter (not a complex chain system)

The combo system rewards sustained pressure on a single target.

---

# 63C. DASH SYSTEM

A dodge/dash ability exists with 2500ms cooldown.

The dash is a short-range positioning tool. It is bound to the dash input on both mobile and desktop.

---

# 63D. STEALTH

PlayerCharacter supports:

- `isStealthed` boolean
- `stealthDurationMs` duration tracking

The picaro class can trigger invisibility via buff effects. There is no dedicated stealth service — stealth state is tracked on the player character and checked by mob AI.

---

# 63E. JOB SYSTEM

Character progression includes a job promotion system:

```text
jobStage: 'novicio' | 'primer_job' | 'segundo_job'
```

The job promotion system works through:

- Class-specific trial quests (quest_job_guerrero, quest_job_cazador, quest_job_mago, quest_job_asesino)
- Job instructors in pueblo_inicial (4 NPCs)
- Second job unlocked via quest_segundo_job_maestria (kill golem_antiguo x2)
- Second job grants access to powerful spells (e.g., apocalipsis via grimorio)

---

# 63F. CHARACTER SLOTS

The game supports 3 character save slots:

- localStorage persistence
- Active slot tracking
- Switch between characters without full restart

---

# 63G. AUTO-PICKUP

Automatic item pickup with configurable type filters:

- Gold
- Consumables
- Materials
- Equipment
- Quest items

Filters are configurable per-player via game settings.

---

# 63H. GAME SETTINGS

Player-configurable settings include:

- Auto-pickup type filters
- Critical hit screen shake toggle
- Loot toast notification toggle
- Auto-align to grid
- Sound mute

Settings managed via `useGameSettings.ts` and UIStore.

---

# 63I. SOUND SERVICE

Sound effects are synthesized via Web Audio API (`src/services/sound.ts`).

Sound categories include: sword swing, hit impact, spell cast, potion drink, level up, critical hit, death.

No external audio files — all sounds are generated programmatically.

---

# 63J. CONTENT REGISTRY

A singleton ContentRegistry (`src/services/ContentRegistry.ts`) provides:

- Centralized access to items, mobs, spells, quests, recipes, maps
- Content integrity validation
- Content package import capability

---

# 63K. STAMINA (PLACEHOLDER)

PlayerCharacter includes `currentStamina` and `maxStamina` fields.

These fields exist in the type definition but **no stamina system is implemented** — no consumption, no regeneration, no gameplay effect. This is dead/planned data.

---

# 64. NEW SYSTEMS

Before adding a new mechanic ask:

```text
Does it reinforce the core pillars?
Does it create meaningful decisions?
Does it interact with existing systems?
Does it add depth rather than noise?
Can the player understand it?
Does it create future design space?
```

If the answer is mostly no:

Do not add it.

---

# 65. SYSTEM INTERACTION

Good systems interact.

Example:

```text
weapon
→ attack speed
→ class
→ skill
→ positioning
→ damage
→ loot
→ progression
```

Another:

```text
map
→ enemy
→ resource
→ quest
→ crafting
→ equipment
→ progression
```

Systems should reinforce each other naturally.

Avoid isolated mechanics.

---

# 66. AVOID SYSTEM BLOAT

Do not add:

- currencies without purpose
- stats without decisions
- skills without roles
- equipment slots without identity
- crafting materials without sinks
- quests without world relevance
- enemies without behavioral identity

More systems do not automatically mean deeper gameplay.

---

# 67. BACKWARD COMPATIBILITY

When improving a mechanic:

Prefer evolution over replacement.

Example:

```text
Existing combat
↓
identify weakness
↓
improve formula/feedback/counterplay
↓
preserve player knowledge
```

Do not repeatedly reinvent foundational systems.

---

# 68. BALANCE CHANGES

When changing numbers, inspect their relationships.

Never change:

```text damage = 10 → 20
```

without considering:

- enemy HP
- defense
- attack speed
- healing
- potion economy
- XP
- encounter duration
- boss design

Balance is systemic.

---

# 69. CONTENT GROWTH

As the project grows, new content should be introduced in layers:

```text
FOUNDATION
→ new mechanic
→ basic content
→ combinations
→ advanced encounters
→ mastery
```

Do not immediately create ten variations of an untested mechanic.

---

# 70. PROTOTYPE BEFORE EXPANSION

When introducing a new mechanic:

1. Implement the smallest playable version.
2. Test whether it is fun.
3. Observe player decisions.
4. Identify exploits/problems.
5. Improve the core.
6. Only then expand content.

---

# 71. DO NOT BALANCE A BAD MECHANIC

If a mechanic is boring:

Do not try to fix it by adding:

- more damage
- more XP
- more loot
- shorter cooldowns

First determine whether the underlying interaction is actually fun.

---

# 72. PLAYER AGENCY

Prefer mechanics where the player can influence outcomes.

Good:

```textposition
timing
target selection
ability selection
resource management
risk/reward
```

Bad:

```texthidden RNG
unavoidable damage
arbitrary cooldown walls
stat checks everywhere
```

Randomness should add tension, not remove agency.

---

# 73. READABILITY

Players must be able to understand:

- where they are
- where enemies are
- what enemies are doing
- what attacks are possible
- what is dangerous
- what happened

If a mechanic cannot be understood during play, simplify its presentation or interaction.

---

# 74. COUNTERPLAY

Every powerful enemy mechanic should have a counter.

Possible counters:

- move
- align
- interrupt
- outrange
- block
- evade
- use ability
- exploit cooldown
- exploit positioning

Do not introduce powerful mechanics with no meaningful response.

---

# 75. RISK / REWARD

Strong actions should generally involve one or more:

- resource cost
- cooldown
- positioning requirement
- timing requirement
- vulnerability
- opportunity cost

Free high-power actions quickly become mandatory.

---

# 76. CLASS BALANCE

Balance classes around:

```text
strengths
weaknesses
utility
difficulty
resource requirements
combat rhythm
```

Do not require perfect symmetry.

Asymmetric strengths are desirable.

---

# 77. BUILD DIVERSITY

A player should eventually be able to make meaningful choices.

Examples:

```text
fast melee
heavy melee
shield tank
ranged hunter
trap-focused hunter
burst assassin
evasion assassin
spell damage mage
utility mage
```

These are directions, not mandatory builds.

---

# 78. CONTENT QUALITY BAR

Before adding content, ask:

```text
Is it memorable?
Is it useful?
Is it mechanically distinct?
Does it fit the world?
Does it interact with existing systems?
Will players care about it?
```

If not, improve the concept before implementing it.

---

# 79. WHAT MUST NOT DRIFT

Unless explicitly changed by the game's design direction, preserve:

```text
Medieval fantasy identity
4-direction tactical movement
Spatial positioning
Alignment-based combat
Meaningful range
Class identity
Skill progression
Equipment-driven builds
Readable enemies
Telegraphed danger
2D/2.5D presentation
Exploration
Persistent character progression
```

These are the game's foundational identity.

---

# 80. WHAT MAY EVOLVE

These are implementation details, not sacred rules:

```text
exact damage values
exact cooldowns
exact XP values
exact map dimensions
exact enemy statistics
exact camera parameters
exact shader parameters
exact UI arrangement
exact item numbers
```

Improve them when evidence supports the change.

---

# 81. CHANGE JUSTIFICATION

For major mechanical changes, explain internally:

```text
CURRENT PROBLEM
→ DESIGN GOAL
→ PROPOSED CHANGE
→ SYSTEMS AFFECTED
→ PLAYER IMPACT
→ BALANCE RISKS
```

Do not make major mechanical changes simply because they are technically easier.

---

# 82. REGRESSION PROTECTION

Before modifying a foundational system inspect its consumers.

Especially:

```text
CombatEngine
Game3DRenderer
CameraManager
PlayerCharacter
ActiveMob
Spell
Item
GameMap
Quest
Skill
```

Changes to these can affect many systems.

---

# 83. IMPLEMENTATION PRINCIPLE

Prefer:

**small, composable, testable systems**

over:

**large special-case implementations**

New mechanics should ideally be reusable for future content.

---

# 84. FUTURE-PROOFING

Do not over-engineer speculative systems.

Future-proof by:

- clean data structures
- explicit types
- reusable calculations
- modular behavior
- clear ownership
- data-driven content

Do not build massive abstractions for mechanics that have not been proven fun.

---

# 85. DEBUGGING GAMEPLAY

When a mechanic behaves incorrectly:

```text
INPUT
↓
GAME STATE
↓
GAMEPLAY RULE
↓
RESULT
↓
RENDER STATE
↓
VISUAL FEEDBACK
```

Find where the divergence occurs.

Do not patch the final visual symptom if the underlying gameplay state is wrong.

---

# 86. PERFORMANCE VS GAMEPLAY

Never optimize away a mechanic's responsiveness.

Never add visual complexity that harms gameplay performance.

When choosing:

```text
visual effect
vs
combat responsiveness
```

choose combat responsiveness.

---

# 87. DEVELOPMENT PRIORITY

When deciding what to improve next:

```text
1. Broken gameplay
2. Poor combat feel
3. Input problems
4. Unclear feedback
5. Balance problems
6. Systemic UX problems
7. Content depth
8. Visual polish
```

Do not polish a system that is fundamentally unfun.

---

# 88. QUALITY GATE

Before accepting a new gameplay feature:

```text
□ Fits game identity
□ Creates meaningful decisions
□ Has understandable rules
□ Has counterplay
□ Has appropriate risk/reward
□ Interacts with existing systems
□ Does not invalidate existing classes/builds
□ Does not create excessive grind
□ Does not rely only on stat inflation
□ Is technically maintainable
□ Does not introduce unnecessary complexity
```

---

# 89. FINAL DESIGN TEST

Ask:

> Does this change make Argentum Tales more tactical, more interesting, more readable, or more memorable?

If yes:

Proceed.

If it only makes the game:

- bigger
- busier
- shinier
- more complicated
- more statistically inflated

without improving player decisions:

Reject or redesign it.

---

# 90. FINAL DIRECTIVE

OpenCode must protect the identity of Argentum Tales as the project grows.

Do not drift toward generic ARPG conventions simply because they are common.

Do not replace tactical positioning with button spam.

Do not replace meaningful progression with endless numbers.

Do not replace enemy behavior with HP inflation.

Do not replace class identity with cosmetic differences.

Do not replace readable 2D/2.5D gameplay with unnecessary 3D complexity.

Do not add systems simply because they are technically possible.

Build outward from the existing foundation.

**Content language**: all game content (item names, quest titles, mob names, map names, dialogue, skill names) is in **Spanish**. Preserve Spanish when adding or modifying game data.

**Argentum Tales should become deeper as it grows — not merely larger.**

The ultimate objective is:

> **A modern medieval tactical ARPG where positioning, timing, character development, equipment and enemy knowledge create meaningful decisions in every fight.**