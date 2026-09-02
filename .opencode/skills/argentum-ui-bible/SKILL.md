# Argentum Tales — UI Design Bible

## PURPOSE

Authoritative visual and UX specification for Argentum Tales.

Use this skill **only for UI/UX work**.

The game is a **mobile-first tactical ARPG** with a medieval fantasy identity.

Core identity:

**Minimal · Medieval · Ornamental · Practical · Tactical · Ergonomic**

The interface must feel like a modern, highly usable medieval RPG — never like a generic modern app decorated with medieval elements.

---

# 1. PRIORITY ORDER

When design decisions conflict, prioritize:

1. Gameplay visibility
2. Input ergonomics
3. Readability
4. Information hierarchy
5. Consistency
6. Accessibility
7. Performance
8. Visual polish
9. Ornamentation

**Usability always beats decoration.**

---

# 2. VISUAL LANGUAGE

Use:

* dark medieval materials
* aged metal
* leather
* dark wood
* parchment
* bronze
* muted gold
* muted steel
* restrained fantasy accents

Avoid:

* neon
* cyberpunk
* futuristic HUDs
* generic SaaS UI
* excessive glassmorphism
* excessive gradients
* excessive glow
* oversized rounded cards
* bubble/pill UI
* decorative clutter

The game world remains the visual hero.

---

# 3. COLOR SYSTEM

Prefer semantic colors.

### Surfaces

```text
Deep       #0B0D0F
Primary    #111315
Secondary  #181B1E
Elevated   #202428
Panel      #17191C
```

### Accent

```text
Gold        #C89B3C
Highlight   #E0B85A
Muted Gold  #8F6D2B
```

### Semantic

```text
Health      #A83A32
Mana        #356A9A
Success     #547A50
Warning     #B17A35
Error       #9A3A35
```

### Text

```text
Primary     #E5E0D6
Secondary   #AAA59B
Muted       #77736C
Disabled    #55524D
Important   #D7B45A
```

Avoid pure black/white as default UI colors.

Do not use color as the only state indicator.

---

# 4. TYPOGRAPHY

Use two functional categories:

### Display

Medieval/serif-inspired.

Use for:

* screen titles
* major headings
* important thematic labels

### Gameplay

Clean and highly readable.

Use for:

* HP/MP
* damage
* cooldowns
* item stats
* descriptions
* buttons
* objectives

Decorative fonts must never reduce gameplay readability.

---

# 5. SHAPE LANGUAGE

Prefer:

* subtle rounded corners
* restrained chamfers
* thin borders
* compact panels
* medieval frames
* small ornamental corners

Avoid:

* giant rounded cards
* excessive pills
* thick borders
* excessive circles
* bubble interfaces

The UI should feel **crafted**, not inflated.

---

# 6. MATERIAL LANGUAGE

Use material identity according to context.

```text
HUD        → dark metal / leather
Inventory  → wood / leather / metal
Equipment  → metal / leather / parchment
Quests     → parchment / journal
Dialogue   → parchment / wood
Settings   → dark metal / parchment
```

Different systems may have different material emphasis, but all must belong to the same visual family.

---

# 7. ORNAMENTATION

Ornamentation is restrained.

Allowed:

* thin medieval borders
* corner flourishes
* engraved details
* small heraldic marks
* subtle rivets
* parchment edges
* bronze/gold accents

Rule:

**Decoration belongs around information, never inside it.**

Remove decoration when it reduces readability or gameplay visibility.

---

# 8. HUD

The HUD must answer quickly:

* Who am I?
* HP?
* MP?
* Target?
* Available actions?
* Skills ready?
* Where am I?
* What important event happened?

During combat prioritize:

```text
HP / MP
Target
Movement
Attack
Skills
Dash
Interaction
```

Secondary information must visually retreat during combat.

Never allow HUD elements to unnecessarily obscure the game world.

---

# 9. MOBILE-FIRST

Mobile is the primary interaction model.

Do not create a desktop UI and merely shrink it.

Design around:

* thumb reach
* large touch targets
* immediate feedback
* no hover dependency
* minimal precision requirements
* safe areas
* landscape gameplay
* limited screen space

Target interactive hitboxes:

**≈44×44px minimum**

Critical combat controls may be larger.

Visible icon size and touch hitbox are separate concerns.

---

# 10. MOBILE CONTROL PRINCIPLES

Conceptual layout:

```text
LEFT       → movement / joystick

RIGHT      → attack / combat

RIGHT-UP   → skills / secondary combat

CONTEXTUAL → interaction
```

Keep important controls spatially predictable.

Avoid unnecessary permanent buttons.

Contextual actions should appear only when relevant.

---

# 11. JOYSTICK

Joystick must feel:

* immediate
* predictable
* stable
* responsive

Maintain:

* deadzone
* maximum radius
* normalized input
* correct touch ownership
* release/reset behavior

Avoid unnecessary visual smoothing.

Never allow joystick interaction to interfere with unrelated UI.

---

# 12. COMBAT CONTROLS

Attack is a primary action.

Skills are high-priority actions.

Dash is secondary combat.

Potions are contextual combat utilities.

Controls must communicate:

* ready
* pressed
* selected
* unavailable
* cooldown

Never depend exclusively on color.

---

# 13. SKILLS

Every skill control should communicate:

1. identity
2. availability
3. cooldown
4. selected/equipped state
5. keyboard shortcut where applicable

Cooldown feedback may use:

* radial overlay
* vertical overlay
* countdown
* reduced opacity

Avoid constant pulsing.

---

# 14. BUTTONS

Required states when applicable:

```text
default
hover
pressed
selected
disabled
active
cooldown
destructive
```

Mobile priority:

**default → pressed → immediate feedback**

Never make hover necessary to understand an action.

---

# 15. FEEDBACK

Important actions require immediate feedback.

Examples:

```text
Press       → visual response
Attack      → hit feedback
Potion      → HP/MP feedback
Quest done  → notification/state change
Skill       → cooldown state
Target      → target indicator
```

Feedback should be fast and restrained.

---

# 16. ANIMATION

Animation communicates:

* feedback
* state
* transition

Approximate durations:

```text
Micro        80–140ms
Standard     150–220ms
Modal        180–260ms
Gameplay     200–400ms
```

Avoid unnecessary:

* bouncing
* pulsing
* long transitions
* constant animation
* simultaneous attention effects

If everything animates, nothing is important.

---

# 17. GLOW

Glow is a state indicator.

Use it for:

* selected
* ready
* rare
* critical
* magical
* active

Do not permanently glow ordinary UI.

---

# 18. GLASS / TRANSPARENCY

Subtle transparency may be used when it improves gameplay visibility.

But:

**Argentum Tales is not a glassmorphism UI.**

Avoid excessive:

* blur
* frosted surfaces
* translucent cards
* glowing borders

Prefer dark material surfaces.

---

# 19. INFORMATION HIERARCHY

Use four levels:

```text
L0 → background
L1 → passive information
L2 → interactive
L3 → important
L4 → critical
```

At any moment there should normally be **one primary visual emphasis**.

Do not make every element visually urgent.

---

# 20. INFORMATION DENSITY

The game is an ARPG, so information density is acceptable.

The solution to clutter is not automatically removing information.

Instead:

* group related information
* establish hierarchy
* collapse secondary information
* use progressive disclosure
* use icons where clear
* use text where precision matters

**Dense ≠ cluttered.**

---

# 21. ICONOGRAPHY

Prefer the existing icon system.

Icons must be:

* recognizable
* consistent
* simple
* similar in visual weight

Avoid mixing unrelated icon styles.

Emoji must not become the primary UI icon system.

Use icon + text when an action is ambiguous.

---

# 22. INVENTORY

Inventory must clearly communicate:

* item slot
* quantity
* rarity
* equipped
* selected
* locked
* empty

Rarity may use color plus:

* border
* icon treatment
* background
* symbol
* label

Common items remain visually quiet.

---

# 23. TOOLTIPS

Priority:

```text
Name
Rarity
Type
Main stats
Description
Requirements
Additional information
```

Avoid giant tooltip walls.

On mobile prefer contextual panels over hover-dependent tooltips.

Essential information must remain accessible without hover.

---

# 24. QUESTS

Quest UI should feel like an adventurer's journal.

Hierarchy:

```text
Quest title
State
Objectives
Progress
Rewards
Description
```

Objectives must never be buried inside flavor text.

---

# 25. DIALOGUE

Prioritize:

1. Character identity
2. Dialogue
3. Responses/actions

Portraits may be used but must not consume excessive gameplay space.

---

# 26. MODALS

Modals are game panels, not generic web dialogs.

Every modal needs:

* clear title
* obvious close action
* strong hierarchy
* predictable spacing
* mobile-safe dimensions
* internal scrolling when necessary

Avoid:

* excessive empty space
* nested cards
* unnecessary decoration
* tiny close controls

---

# 27. MODAL MOBILE RULES

On mobile:

* use available space efficiently
* keep close/navigation controls reachable
* prevent horizontal overflow
* preserve readable text
* scroll content internally when needed
* keep headers usable

Never hide important content because of fixed heights.

---

# 28. RESPONSIVE DESIGN

Support conceptually:

```text
320
360
375
390
430
tablet landscape
desktop
```

Check:

* overflow
* absolute positioning
* fixed widths
* flex behavior
* viewport height
* safe areas
* control overlap
* z-index

Landscape mobile is a primary gameplay environment.

---

# 29. DESKTOP

Desktop may expose:

* keyboard shortcuts
* hover feedback
* additional labels
* higher information density
* mouse interaction

But it must remain visually consistent with mobile.

Known gameplay shortcuts may include:

```text
WASD       movement
Space/F    attack
E          interact
X          dash
Q          HP potion
R          MP potion
Tab        target
1–4        skills
I          inventory
K          skills
L          quests
H / ?      help
O          settings
Escape     close
```

Do not change existing shortcuts casually.

---

# 30. INPUT PARITY

Mobile and desktop actions should remain functionally equivalent.

The input mechanism may differ.

The result should not.

Preserve:

* attack
* movement
* dash
* interaction
* potions
* skills
* inventory
* quests
* settings
* modal close

---

# 31. ACCESSIBILITY

Maintain:

* sufficient contrast
* readable text
* clear states
* visible focus
* keyboard access
* touch access
* non-color-dependent information

Never rely solely on red/green distinctions.

---

# 32. SPACING

Use a consistent scale:

```text
4
8
12
16
20
24
32
```

Avoid arbitrary values unless gameplay alignment requires them.

---

# 33. BORDERS

Default:

* 1px
* muted
* subtle

Important states may use stronger borders.

Avoid thick borders everywhere.

---

# 34. SHADOWS

Use shadows primarily for depth.

Prefer:

* restrained dark shadows
* subtle inner shadows

Avoid giant shadows around every element.

Glow must not replace hierarchy.

---

# 35. PRIMARY ACTIONS

Primary actions generally use the warm gold accent.

Examples:

* confirm
* equip
* accept
* buy
* continue

Combat controls may use semantic colors when necessary.

Do not make every button gold.

---

# 36. SECONDARY ACTIONS

Secondary actions use neutral dark surfaces.

Examples:

* cancel
* back
* close
* inspect

They must not compete visually with primary actions.

---

# 37. DESTRUCTIVE ACTIONS

Use muted red for:

* discard
* abandon
* reset
* destructive confirmation

Never make destructive actions visually resemble primary gold actions.

---

# 38. CONTEXTUAL UI

Prefer contextual actions over permanent controls.

Example:

```text
Near chest
→ "Abrir [E]"
```

Instead of permanently displaying:

```text
Interact
```

when there is nothing to interact with.

---

# 39. EMPTY STATES

Keep empty states:

* clear
* concise
* quiet

Explain what is empty and what can be done next.

Avoid large decorative empty screens.

---

# 40. LOADING

Loading UI should:

* communicate activity
* remain restrained
* fit the game aesthetic
* avoid unnecessary blocking

Prefer small game-themed indicators over generic web UI when appropriate.

---

# 41. DEBUG UI

Developer/debug systems may use a more technical visual language.

Do not force the medieval player-facing aesthetic onto development tools.

---

# 42. PERFORMANCE

The game is real-time.

Avoid unnecessary:

* render loops
* React re-renders
* DOM complexity
* event listeners
* blur
* backdrop filters
* animated shadows
* animated gradients
* expensive touch handlers

Every-frame UI work requires special scrutiny.

Do not introduce dependencies for trivial visual effects.

---

# 43. ARCHITECTURE

Prefer separation between:

```text
gameplay logic
state
input
presentation
```

Reuse existing components and patterns.

Do not duplicate UI systems unnecessarily.

Do not move gameplay calculations into presentation code merely for convenience.

---

# 44. WHEN MODIFYING EXISTING UI

Preserve:

* gameplay behavior
* state behavior
* callbacks
* keyboard mappings
* touch behavior
* component contracts

Improve presentation toward this Bible.

The existing UI is **implementation history**, not design authority.

---

# 45. WHEN ADDING NEW UI

Before adding anything ask:

```text
Is it necessary?
Is it useful during combat?
Can it be contextual?
Can an existing component handle it?
Does mobile need it?
What is its keyboard equivalent?
Does it introduce visual noise?
```

If it does not provide sufficient value, do not add it.

---

# 46. "MAKE IT PRETTIER"

Do not start with effects.

Improve in this order:

```text
spacing
→ hierarchy
→ alignment
→ typography
→ grouping
→ contrast
→ material
→ ornamentation
→ subtle effects
```

---

# 47. "MAKE IT MORE MEDIEVAL"

Do not add random fantasy decoration.

Improve:

```text
materials
→ palette
→ typography
→ borders
→ restrained ornamentation
→ iconography
```

Keep the interface practical.

---

# 48. "MAKE IT MORE MINIMAL"

Do not remove functionality.

Reduce:

* redundant information
* decoration
* borders
* glow
* animation
* duplicated labels
* unnecessary controls

Minimalism means:

**less visual noise, not less functionality.**

---

# 49. GOLDEN RULES

If beautiful conflicts with usable:

**Choose usable.**

If ornamental conflicts with readable:

**Choose readable.**

If modern conflicts with coherent:

**Choose coherent.**

If desktop conflicts with mobile:

**Choose mobile.**

If more UI conflicts with clarity:

**Choose less UI.**

---

# 50. FINAL DIRECTIVE

Argentum Tales should feel like:

> **A modern tactical ARPG interface expressed through a restrained medieval visual language.**

The interface must support the player, not compete with the game.

**Minimal. Medieval. Ornamental. Practical. Tactical. Touch-first. Keyboard-compatible.**
