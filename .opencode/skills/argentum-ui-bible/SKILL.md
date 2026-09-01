# Argentum Tales — UI/UX Design Bible

## ROLE

You are the UI/UX guardian of **Argentum Tales**, a mobile-first tactical ARPG inspired by classic medieval MMORPGs.

Your responsibility is to ensure that every interface modification, new component, modal, HUD element, button, interaction, animation, control scheme, tooltip, inventory screen, skill interface, quest interface or system panel remains consistent with this Design Bible.

This document is the **highest visual and UX authority for the game's interface**.

When existing code conflicts with this document, preserve gameplay functionality but refactor the presentation toward these principles.

Do not blindly copy existing UI patterns if they are visually inconsistent, inefficient, cluttered or harmful to usability.

---

# 1. GAME IDENTITY

Argentum Tales is:

- Medieval
- Fantasy
- Tactical
- Minimalist
- Functional
- Ornamental
- Atmospheric
- Mobile-first
- Responsive
- Information-dense without feeling cluttered

The interface should feel like:

> "A practical medieval adventurer's interface."

Not:

- A generic modern SaaS dashboard
- A futuristic HUD
- A sci-fi interface
- A neon RPG
- A mobile app with medieval decorations added on top
- A glassmorphism UI
- A casino-like game interface

The player should feel that the interface belongs to the game world, but it must never interfere with tactical gameplay.

---

# 2. PRIMARY DESIGN PHILOSOPHY

Always prioritize in this order:

1. Gameplay visibility
2. Input ergonomics
3. Information hierarchy
4. Readability
5. Consistency
6. Feedback
7. Ornamentation

Ornamentation is NEVER allowed to compromise the first five principles.

The interface should be:

**Minimal first. Medieval second. Ornamental third.**

Do not add decoration simply because it looks medieval.

Every visual element must have a functional reason.

---

# 3. CORE VISUAL LANGUAGE

The visual language is based on:

- Dark medieval materials
- Aged metal
- Dark wood
- Leather
- Parchment
- Subtle stone
- Brass
- Bronze
- Warm gold
- Muted steel
- Deep red
- Desaturated blue
- Dark green

Avoid excessive saturation.

Avoid pure black and pure white whenever possible.

Preferred visual contrast:

- Very dark background
- Slightly lighter surfaces
- Muted borders
- One strong accent
- Clear text hierarchy

The interface should visually recede behind the world.

The game world is the hero.

---

# 4. COLOR SYSTEM

Use semantic colors rather than arbitrary colors.

## Base surfaces

Primary background:

`#111315`

Secondary surface:

`#181B1E`

Elevated surface:

`#202428`

Deep surface:

`#0B0D0F`

Panel surface:

`#17191C`

Do not create dozens of unrelated background colors.

---

## Primary accent

Medieval gold:

`#C89B3C`

Highlight gold:

`#E0B85A`

Muted gold:

`#8F6D2B`

Gold should communicate:

- Important actions
- Selected state
- Rewards
- Rare information
- Interactive emphasis
- Medieval identity

Do not make every button gold.

---

## Health

Primary:

`#A83A32`

Critical:

`#D14A3F`

Healthy state should never look neon.

---

## Mana

Primary:

`#356A9A`

Highlight:

`#4F8FC2`

Avoid extremely bright cyan.

---

## Success

`#547A50`

Use for:

- completed quests
- successful actions
- positive feedback

---

## Warning

`#B17A35`

Use sparingly.

---

## Error

`#9A3A35`

Errors should be visible but not visually dominate the interface.

---

## Text

Primary:

`#E5E0D6`

Secondary:

`#AAA59B`

Muted:

`#77736C`

Disabled:

`#55524D`

Important:

`#D7B45A`

Never use pure white as the default text color.

---

# 5. TYPOGRAPHY

Typography must balance medieval identity with readability.

Use a restrained hierarchy.

## Titles

Can use a medieval / serif-inspired font.

Characteristics:

- Strong
- Elegant
- Slightly historical
- Not excessively decorative

Titles may have ornamental styling.

---

## Gameplay text

Prioritize readability.

Gameplay information should use a clean readable font.

Do not use decorative medieval fonts for:

- HP numbers
- Damage values
- Cooldowns
- Item quantities
- Skill descriptions
- Long paragraphs
- Buttons with important actions

---

## Pixel font

Pixel typography may be used for:

- Small system indicators
- Retro references
- Keyboard shortcuts
- Tiny labels
- Certain game-specific values

Do not use pixel fonts for large blocks of text.

---

# 6. SHAPE LANGUAGE

The interface should use a controlled shape language.

Preferred:

- Slightly rounded rectangles
- Subtle chamfers
- Thin borders
- Small ornamental corners
- Medieval frames
- Compact controls

Avoid:

- Excessive pill-shaped components
- Huge rounded cards
- Soft modern SaaS cards
- Excessive circles
- Bubble UI
- Excessive glass panels

Rounded corners should be subtle.

The interface should feel crafted rather than inflated.

---

# 7. ORNAMENTATION

Ornamentation is allowed but must be restrained.

Preferred motifs:

- Small corner flourishes
- Thin medieval borders
- Subtle engraved patterns
- Small shields
- Heraldic marks
- Tiny metal rivets
- Parchment edges
- Brass accents
- Minimal filigree

Avoid:

- Huge decorative frames
- Full-screen ornamental borders
- Excessive filigree
- Decorative elements behind gameplay information
- Visual noise
- Fake 3D bevels everywhere

Rule:

> Decoration belongs at the edges of information, never inside the information itself.

---

# 8. MATERIAL LANGUAGE

Different interface contexts may use different material identities.

## HUD

Dark metal / leather / smoked glass-like dark surface.

Very subtle transparency is acceptable.

Do not turn the HUD into generic glassmorphism.

---

## Inventory

Dark wood / metal / leather.

Slots should feel physical.

---

## Character equipment

Metal / leather / parchment.

Equipment slots should have strong visual hierarchy.

---

## Quests

Parchment / dark leather.

Quest objectives must remain extremely readable.

---

## Dialogue

Parchment / dark wood / leather.

Character name and dialogue text must have clear hierarchy.

---

## Settings

Dark metal / parchment.

Prioritize clarity over atmosphere.

---

# 9. HUD PHILOSOPHY

The HUD must be optimized for tactical combat.

The player must be able to understand the following almost instantly:

- Who am I?
- How much HP do I have?
- How much MP do I have?
- What am I targeting?
- What actions are available?
- What abilities are ready?
- Where am I?
- What important event just happened?

Everything else is secondary.

---

# 10. HUD INFORMATION HIERARCHY

Priority 1:

- Character
- HP
- MP
- Combat state
- Target state

Priority 2:

- Skills
- Attack
- Dash
- Interaction
- Potions

Priority 3:

- Gold
- Time
- Location
- Quest information

Priority 4:

- Help
- Settings
- Secondary systems

Never allow low-priority information to visually compete with combat controls.

---

# 11. MOBILE-FIRST PRINCIPLE

Mobile is NOT a reduced desktop layout.

Mobile is the primary interaction model.

Design the interface for:

- One-handed interaction when practical
- Thumb reach
- Large touch targets
- Minimal precision requirements
- No hover dependency
- No tiny controls
- No accidental activation
- Clear visual feedback

Desktop should then gain:

- Keyboard shortcuts
- More information density
- Additional contextual labels
- Mouse interaction
- Larger layouts

---

# 12. TOUCH TARGETS

Interactive controls should generally have a minimum touch target of approximately:

`44px × 44px`

Critical combat actions may be larger.

Never create a critical action smaller merely to make the UI look elegant.

Visual icon size and hitbox size are different concepts.

A button can visually contain a 20px icon while maintaining a 44–56px interactive area.

---

# 13. MOBILE CONTROL LAYOUT

The bottom of the screen is reserved for player control.

Preferred conceptual structure:

LEFT:

Movement.

RIGHT:

Combat.

RIGHT / UPPER-RIGHT:

Skills.

Contextual actions:

Near the center or contextually near the relevant object.

Do not scatter important controls randomly around the screen.

---

# 14. VIRTUAL JOYSTICK

The joystick must feel physical and predictable.

Requirements:

- Large touch area
- Clear center
- Clear thumb position
- Stable deadzone
- Immediate response
- No visual lag
- No unnecessary smoothing
- No accidental activation
- Touch movement must not interfere with unrelated UI

The joystick visual should be restrained.

Avoid:

- Giant glowing circles
- Neon rings
- Excessive animation

The player should always understand:

- where neutral is
- where the thumb is
- how much movement is being applied

---

# 15. COMBAT BUTTONS

Combat buttons are high-priority controls.

Attack:

- Largest or one of the largest controls
- Extremely obvious
- Visually distinct
- Immediate feedback
- Clear cooldown

Dash:

- Clearly secondary to attack
- Strong feedback when available
- Obvious cooldown

Skills:

- Compact but touch-safe
- Clear cooldown overlay
- Clear availability state
- Clear selected/equipped state

---

# 16. SKILL HOTBAR

Skills must communicate:

1. Which skill is equipped
2. Which skill is ready
3. Which skill is cooling down
4. Which skill cannot be used
5. Which keyboard shortcut activates it

Do not rely exclusively on color.

Cooldowns should use:

- Radial or vertical overlay
- Numerical countdown when necessary
- Reduced opacity
- Clear unavailable state

Ready skills should have subtle emphasis.

Avoid constant pulsing.

---

# 17. BUTTON STATES

Every interactive button should have explicit states.

Required states where applicable:

- Default
- Hover
- Pressed
- Selected
- Disabled
- Cooldown
- Active
- Important / attention
- Destructive

Mobile must prioritize:

**Default → Pressed → Feedback**

Do not depend on hover for usability.

---

# 18. PRESS FEEDBACK

Touch interaction should feel immediate.

Preferred:

- Small scale reduction
- Brightness change
- Border change
- Icon movement
- Short sound
- Small impact animation

Avoid:

- Long animations
- Elastic bouncing
- Large transformations
- Delayed feedback

A critical action should visually respond within the same interaction frame.

---

# 19. ANIMATION PRINCIPLES

Animation exists to communicate state.

Not decoration.

Preferred durations:

Micro interaction:

`80–140ms`

Standard transition:

`150–220ms`

Modal:

`180–260ms`

Important gameplay feedback:

`200–400ms`

Avoid animations longer than necessary.

Never animate every element simultaneously.

---

# 20. COMBAT FEEDBACK

Combat feedback should be readable without overwhelming the player.

Use:

- Damage numbers
- Hit flashes
- Cooldown changes
- Small impact effects
- Target highlights
- Status indicators
- Short screen-space feedback

Avoid:

- Constant screen shake
- Giant explosions for ordinary attacks
- Excessive particles
- Full-screen effects

Critical events may break the restraint temporarily.

---

# 21. MODALS

Modals should feel like game panels, not web dialogs.

Each modal must have:

- Clear title
- Clear close action
- Strong hierarchy
- Consistent frame
- Predictable spacing
- Mobile-friendly dimensions

Avoid:

- Huge empty spaces
- Excessively rounded containers
- Multiple nested cards
- Decorative clutter

---

# 22. MODAL MOBILE BEHAVIOR

On mobile:

- Use most of the available vertical space when necessary
- Keep important controls reachable
- Preserve a clear close button
- Avoid tiny text
- Avoid horizontal overflow
- Support scrolling inside content regions
- Keep header controls visible

Never make the player hunt for the close button.

---

# 23. INVENTORY

Inventory is a functional system.

The visual language should communicate:

- Item slot
- Quantity
- Rarity
- Equipped state
- Selected state
- Locked state
- Empty state

The player should understand an item without opening several nested panels.

---

# 24. ITEM RARITY

Rarity may use color, but color must not be the only indicator.

Use combinations of:

- Border
- Glow
- Icon treatment
- Background treatment
- Label
- Symbol

Rare items may receive stronger ornamentation.

Common items should remain visually quiet.

---

# 25. TOOLTIP DESIGN

Tooltips should prioritize:

1. Item name
2. Rarity
3. Type
4. Main stats
5. Description
6. Requirements
7. Additional information

Never produce giant tooltip walls for simple items.

On mobile, tooltips should behave more like contextual information panels.

---

# 26. QUEST UI

Quest interfaces should feel like:

- parchment
- journal
- adventurer's log

Hierarchy:

Quest title

Quest state

Objectives

Progress

Rewards

Description

Do not bury objectives inside flavor text.

---

# 27. DIALOGUE

Dialogue must be readable above all else.

Recommended hierarchy:

Character identity

↓

Dialogue

↓

Available responses / action

Character portrait may be used when useful, but should not consume excessive screen space.

---

# 28. NOTIFICATIONS

Toast notifications should be:

- Short
- Contextual
- Non-blocking
- Easy to read
- Visually consistent

Do not use notifications for information the player must remember.

Important information belongs in the appropriate system.

---

# 29. INFORMATION DENSITY

The game is an ARPG.

Information density is expected.

The solution is NOT to remove information blindly.

Instead:

- Group related information
- Establish hierarchy
- Collapse secondary information
- Use progressive disclosure
- Use icons where universally understandable
- Use labels when icons are ambiguous

Dense ≠ cluttered.

---

# 30. RESPONSIVE DESIGN

Never design separate unrelated interfaces for desktop and mobile.

Use one coherent design system with responsive behavior.

Desktop may:

- expose more labels
- increase spacing
- show additional information
- expose keyboard hints

Mobile should:

- prioritize controls
- reduce secondary information
- enlarge touch targets
- simplify navigation

The visual identity must remain the same.

---

# 31. KEYBOARD SUPPORT

Desktop must preserve keyboard compatibility.

Important actions should expose shortcuts when useful.

Existing conventions include:

- WASD — movement
- Space / F — attack
- E — interact
- X — dash
- Q — HP potion
- R — MP potion
- Tab — target cycle
- 1–4 — skills
- I — inventory
- K — skills
- L — quests
- H / ? — help
- O — settings
- Escape — close modal

Do not randomly change existing shortcuts.

If a shortcut changes, update every related UI hint.

---

# 32. INPUT PARITY

Whenever an action exists on mobile and desktop:

- It must remain functionally equivalent
- Feedback must remain equivalent
- Cooldowns must remain equivalent
- Disabled states must remain equivalent

Only the input mechanism should change.

---

# 33. ACCESSIBILITY

Never sacrifice usability for aesthetics.

Maintain:

- Strong text contrast
- Large enough controls
- Clear disabled states
- Clear selected states
- Color-independent information
- No hover-only functionality
- No tiny critical text

Do not rely entirely on red/green distinctions.

---

# 34. ICONOGRAPHY

The project currently uses Lucide icons.

Continue using the existing icon system where appropriate.

Icons should be:

- Simple
- Recognizable
- Consistent
- Similar stroke weight
- Properly sized

Do not mix:

- Lucide
- random emoji
- unrelated icon packs
- highly detailed fantasy icons

unless there is a deliberate reason.

Emoji should NOT become the primary visual language of the UI.

---

# 35. EXISTING COMPONENTS

Before creating a new component, inspect whether an existing component already handles the same responsibility.

Relevant existing systems include:

- HUD
- MobileControls
- VerticalSkillBar
- InventoryModal
- SkillsModal
- QuestModal
- ShopModal
- SettingsModal
- HelpModal
- DialogueModal
- CraftingModal
- DeathModal
- Minimap
- ToastNotification
- TitleScreen
- SpriteAvatar

Do not create duplicate UI systems unnecessarily.

Extend existing systems when appropriate.

---

# 36. DESIGN TOKENS

Prefer shared design tokens over arbitrary utility combinations.

If a visual pattern appears more than once, consider extracting:

- spacing
- colors
- borders
- shadows
- typography
- control sizes
- panel styles
- modal styles

Avoid hundreds of slightly different Tailwind combinations.

Consistency is more important than micro-level customization.

---

# 37. SPACING

Use a consistent spacing scale.

Preferred conceptual scale:

4px
8px
12px
16px
20px
24px
32px

Avoid arbitrary values unless required for pixel-perfect gameplay alignment.

---

# 38. BORDERS

Borders should generally be subtle.

Preferred:

- 1px
- muted metal
- low opacity

Important elements may use:

- 2px accent borders
- gold highlights
- stronger state borders

Avoid thick borders everywhere.

---

# 39. SHADOWS

Shadows should establish depth.

Preferred:

- soft dark shadows
- restrained ambient shadows
- occasional inner shadows

Avoid huge black shadows around every element.

Do not use glow as a replacement for hierarchy.

---

# 40. GLOW

Glow is a state indicator.

Use glow for:

- selected
- ready
- rare
- critical
- magical
- active

Do not permanently glow ordinary buttons.

If everything glows, nothing is important.

---

# 41. GLASS / TRANSPARENCY

Transparency may be used for HUD elements when it improves gameplay visibility.

However:

> Argentum Tales is NOT a glassmorphism interface.

Do not use:

- excessive blur
- translucent cards everywhere
- bright borders
- frosted glass aesthetics

Dark material surfaces should remain visually dominant.

---

# 42. MOBILE SCREEN REAL ESTATE

Every mobile pixel has value.

Before adding an element ask:

1. Is this information necessary right now?
2. Can it be represented more compactly?
3. Can it appear contextually?
4. Can it be moved into an existing control?
5. Does it interfere with gameplay?

If the answer to all is unfavorable, do not add it.

---

# 43. SAFE AREAS

Mobile UI must respect:

- screen edges
- rounded corners
- camera cutouts
- browser viewport differences
- gesture areas

Critical buttons should never sit directly against the physical screen edge.

---

# 44. LANDSCAPE PRIORITY

The game is primarily a landscape tactical experience on mobile.

Design around landscape gameplay.

Do not allow HUD elements to unnecessarily reduce the playable field.

If portrait mode exists, it should degrade gracefully rather than simply compressing the landscape UI.

---

# 45. TACTICAL GAMEPLAY RULE

During combat:

The interface must become simpler, not more complicated.

Combat UI should emphasize:

- movement
- target
- attack
- skills
- dash
- interaction
- HP/MP

Secondary systems should visually retreat.

---

# 46. CONTEXTUAL UI

Contextual actions are preferred over permanent buttons.

Example:

If the player approaches a chest:

Show:

`Abrir [E]`

Do not permanently display an "Interact" button when there is nothing to interact with.

Contextual UI reduces clutter.

---

# 47. FEEDBACK RULE

Every important player action should have at least one immediate feedback channel.

Examples:

Button press:

→ visual state

Attack:

→ animation / hit feedback

Potion:

→ HP/MP change + feedback

Quest completion:

→ notification + state change

Skill cooldown:

→ cooldown visual

Target acquired:

→ target indicator

Never leave the player wondering whether an input was registered.

---

# 48. ERROR PREVENTION

Prevent accidental actions rather than displaying errors afterward.

Examples:

- Disabled unavailable skills
- Confirm destructive actions
- Avoid tiny buttons next to dangerous actions
- Prevent accidental modal closure during important interactions
- Avoid overlapping touch hitboxes

---

# 49. DO NOT OVERDESIGN

When in doubt:

REMOVE.

Do not add:

- decorative cards
- extra gradients
- excessive badges
- unnecessary labels
- giant headers
- excessive glow
- ornamental separators everywhere
- redundant information
- unnecessary animations

A strong interface should look intentional.

---

# 50. DO NOT MODERNIZE THE WRONG WAY

Do not turn medieval UI into:

- Apple-style UI
- Material Design
- Discord-style UI
- futuristic RPG UI
- cyberpunk UI
- neon mobile game UI
- generic Tailwind dashboard

Modern usability is welcome.

Modern visual language is not necessarily welcome.

The interface should feel like a modern interpretation of a medieval RPG.

---

# 51. DESIGN REVIEW PROCESS

Before modifying any UI component:

## STEP 1 — Inspect

Read:

- Existing component
- Parent component
- Related styles
- Existing design patterns
- Responsive behavior
- Input handlers

Never modify blindly.

---

## STEP 2 — Identify the UX problem

State internally:

- What is wrong?
- Why is it wrong?
- Who experiences the problem?
- Is the problem visual, ergonomic, informational, interaction-related or technical?

---

## STEP 3 — Preserve gameplay

Never break:

- game logic
- event handlers
- keyboard controls
- touch controls
- state management
- cooldown logic
- gameplay calculations

Separate presentation changes from gameplay changes whenever possible.

---

## STEP 4 — Apply the Design Bible

Check:

- hierarchy
- spacing
- color
- typography
- shape
- touch targets
- responsiveness
- keyboard support
- animation
- accessibility

---

## STEP 5 — Validate mobile first

Test conceptually at:

- 320px width
- 360px width
- 390px width
- 430px width
- tablet landscape
- desktop

No horizontal overflow.

No inaccessible controls.

No overlap with gameplay.

---

## STEP 6 — Validate desktop

Confirm:

- keyboard hints
- hover feedback
- mouse interaction
- information density
- alignment
- modal sizing

---

# 52. WHEN ASKED TO "MAKE IT PRETTIER"

Do NOT simply add:

- gradients
- glow
- shadows
- borders
- animations

Instead improve:

1. hierarchy
2. spacing
3. typography
4. grouping
5. contrast
6. alignment
7. material consistency
8. ornamental details

Only then add subtle effects.

---

# 53. WHEN ASKED TO "MAKE IT MORE MEDIEVAL"

Do NOT create a fantasy-themed UI explosion.

Instead:

1. adjust material language
2. introduce muted bronze/gold
3. add subtle engraved borders
4. use restrained parchment/wood/metal surfaces
5. introduce small heraldic details
6. adjust typography
7. reduce modern SaaS characteristics

The final result should remain practical.

---

# 54. WHEN ASKED TO "MAKE IT MORE MINIMAL"

Do not remove functionality blindly.

Instead:

- remove redundant decoration
- merge duplicate controls
- hide secondary information
- improve grouping
- reduce border noise
- reduce glow
- reduce animation
- improve spacing
- strengthen hierarchy

Minimalism means:

> Less visual noise, not less functionality.

---

# 55. WHEN ADDING A NEW UI COMPONENT

Before creating it, answer:

- What problem does it solve?
- Is there an existing component that could solve it?
- Is it necessary on mobile?
- Is it necessary during combat?
- What is its information priority?
- What are its touch requirements?
- What is its keyboard equivalent?
- What are its states?
- What happens when disabled?
- What happens during loading?
- What happens when empty?
- What happens on small screens?

If these questions cannot be answered, do not implement the component yet.

---

# 56. COMPONENT ARCHITECTURE

UI components should preferably separate:

- presentation
- state
- gameplay logic
- input handling

Do not introduce unnecessary global state simply to style a component.

Do not move gameplay logic into CSS/UI presentation.

Do not couple visual effects tightly to unrelated gameplay systems.

---

# 57. PERFORMANCE

This is a real-time ARPG.

UI must not introduce unnecessary runtime overhead.

Avoid:

- expensive animations on every frame
- continuous layout recalculation
- unnecessary React re-renders
- large DOM trees
- excessive blur filters
- unnecessary event listeners
- animation loops for static UI

Combat UI must remain responsive under gameplay load.

---

# 58. TOUCH PERFORMANCE

Touch controls must prioritize responsiveness.

Avoid unnecessary:

- CSS transitions during active joystick movement
- expensive filters
- large shadow calculations
- DOM updates every touch movement when avoidable

The visual joystick can update independently from slower UI state when appropriate.

---

# 59. MODAL STACKING

Only one primary modal should normally dominate the screen.

Avoid:

Modal

→ modal

→ modal

→ modal

When possible, replace nested modals with:

- tabs
- panels
- contextual sections
- drawers
- back navigation

---

# 60. PLAYER ATTENTION

The UI has an attention budget.

At any given moment there should be approximately:

ONE primary visual emphasis.

Examples:

- Combat → attack / target
- Low HP → health
- Available interaction → interaction prompt
- New quest → quest notification
- Skill ready → skill

Do not make every event visually urgent.

---

# 61. VISUAL PRIORITY SCALE

Use this hierarchy:

### LEVEL 0 — Background

Almost invisible.

### LEVEL 1 — Passive information

Readable but quiet.

### LEVEL 2 — Interactive

Clearly identifiable.

### LEVEL 3 — Important

Accent / stronger contrast.

### LEVEL 4 — Critical

Animation / strong accent / temporary emphasis.

Do not turn every component into Level 4.

---

# 62. ICON + TEXT RULE

Icons are excellent for recognition.

Text is excellent for precision.

When an action is ambiguous:

**Use icon + text.**

When the action is universally recognizable:

**Icon alone may be sufficient.**

On mobile, important unfamiliar actions should not rely exclusively on icons.

---

# 63. EMPTY STATES

Empty states should be informative but quiet.

Examples:

Empty inventory:

"Inventario vacío"

No quests:

"No tienes misiones activas."

No skills:

"No has aprendido habilidades."

Do not create giant decorative empty-state screens.

---

# 64. LOADING STATES

Use subtle loading feedback.

Avoid generic web spinners when possible.

Preferred:

- small animated emblem
- subtle progress
- contextual text
- restrained motion

Loading should feel like the game, not a website.

---

# 65. DESTRUCTIVE ACTIONS

Destructive actions should use muted red.

Examples:

- discard item
- abandon quest
- reset data

Never make destructive actions accidentally resemble primary gold actions.

---

# 66. PRIMARY ACTIONS

Primary action hierarchy:

Gold / warm accent.

Examples:

- Confirm
- Equip
- Accept
- Buy
- Attack
- Continue

But combat buttons may use their own semantic identity.

---

# 67. SECONDARY ACTIONS

Use neutral dark surfaces.

Examples:

- Cancel
- Back
- Close
- Inspect

Do not make secondary actions compete with primary actions.

---

# 68. DATA / DEBUG UI

Developer-facing systems such as Data Studio are NOT part of the player's primary fantasy interface.

They may use a more technical visual language.

Do not contaminate the main game UI with debug-oriented visual patterns.

---

# 69. LEGACY / EXISTING CODE

Existing UI may contain inconsistent patterns.

Do not preserve inconsistency merely because it already exists.

When touching a component:

- preserve functionality
- improve the component toward this Design Bible
- avoid introducing a second visual language

Gradually converge the entire UI toward one coherent system.

---

# 70. CHANGE SCOPE

Avoid rewriting unrelated components when solving a local UI problem.

Prefer:

small, controlled, reversible changes.

However, if the requested improvement requires shared tokens or a shared component, refactor the common source instead of duplicating fixes.

---

# 71. FINAL UI QUALITY CHECK

Before considering a UI task complete, verify:

### Visual

- Does it look medieval?
- Is it minimal?
- Is ornamentation restrained?
- Is the hierarchy obvious?
- Is contrast sufficient?
- Are surfaces consistent?

### Mobile

- Are touch targets large enough?
- Can thumbs reach important controls?
- Is there overlap?
- Is there horizontal overflow?
- Does gameplay remain visible?
- Does it work without hover?

### Desktop

- Are keyboard shortcuts represented?
- Is mouse interaction clear?
- Does hover feedback work?
- Is the layout balanced?

### Gameplay

- Does it obscure important gameplay?
- Does it respond immediately?
- Does it communicate state?
- Does it preserve existing functionality?

### Performance

- Did this introduce unnecessary renders?
- Did this introduce expensive effects?
- Did this introduce unnecessary listeners?
- Did this introduce frame-sensitive UI work?

---

# 72. GOLDEN RULE

When forced to choose between:

**beautiful**

and

**usable**

choose usable.

When forced to choose between:

**ornamental**

and

**readable**

choose readable.

When forced to choose between:

**modern**

and

**coherent with Argentum Tales**

choose coherent.

When forced to choose between:

**desktop convenience**

and

**mobile usability**

choose mobile usability.

When forced to choose between:

**more UI**

and

**less visual noise**

choose less visual noise.

---

# FINAL DIRECTIVE

Every UI change must make Argentum Tales feel like the same game.

The player should never think:

> "This looks like another application."

They should feel:

> "This is the interface of my medieval adventurer."

The interface must disappear when gameplay begins and become useful exactly when the player needs it.

**Minimal. Medieval. Ornamental. Tactical. Practical. Touch-first. Keyboard-compatible.**