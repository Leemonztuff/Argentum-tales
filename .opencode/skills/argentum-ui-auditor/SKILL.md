# Argentum Tales — UI/UX Auditor

## PURPOSE

Audit and improve the Argentum Tales UI/UX.

Use this skill **only for UI/UX tasks**.

Authority:

`argentum-ui-bible/SKILL.md`

The Bible defines the visual/UX target.

This skill defines the audit and implementation process.

**Do not duplicate the Bible's design rules here.**

---

# 1. CORE LOOP

Always follow:

```text
INSPECT
→ DIAGNOSE
→ PRIORITIZE
→ PLAN
→ MODIFY
→ VALIDATE
```

Never modify UI blindly.

---

# 2. BEFORE CHANGING CODE

Inspect the relevant:

* component
* parent/children
* styles/classes
* props/state
* callbacks
* keyboard handlers
* touch handlers
* animations
* shared components
* consumers

Search the codebase before creating new UI.

---

# 3. FIRST QUESTION

Identify the actual problem.

Classify it as one or more:

```text
VISUAL
UX
MOBILE
DESKTOP
INPUT
ACCESSIBILITY
PERFORMANCE
ARCHITECTURE
GAMEPLAY
```

Do not solve a gameplay/input problem with cosmetic CSS.

---

# 4. AUTHORITY

Use this priority:

```text
Gameplay functionality
→ Architecture
→ UI Bible
→ Mobile usability
→ Desktop usability
→ Accessibility
→ Performance
→ Visual polish
→ Ornamentation
```

Never sacrifice gameplay or usability for aesthetics.

---

# 5. SCOPE CONTROL

Define:

```text
IN SCOPE
OUT OF SCOPE
```

Fix what is necessary for the requested task.

Do not silently redesign unrelated systems.

If an unrelated issue is important, report it separately.

---

# 6. SEVERITY

Classify findings:

### CRITICAL

Breaks core gameplay, input or usability.

### HIGH

Seriously harms mobile, combat, readability, accessibility or responsiveness.

### MEDIUM

Meaningful inconsistency or UX debt.

### LOW

Minor polish/decorative issue.

Fix higher severity first.

Do not let LOW issues expand scope.

---

# 7. EVIDENCE

Base findings on evidence from:

* source code
* styles
* layout calculations
* event handlers
* screenshots
* video
* runtime behavior

Never claim runtime behavior was tested if it was not.

Distinguish:

```text
CONFIRMED
LIKELY
CANNOT VERIFY
```

---

# 8. AUDIT REPORT

When asked for an audit, use:

```text
UI AUDIT

Component:
Path:

STATUS:
GOOD / NEEDS WORK / MAJOR REWORK

CRITICAL
-

HIGH
-

MEDIUM
-

LOW
-

MOBILE
-

DESKTOP
-

INPUT
-

ACCESSIBILITY
-

PERFORMANCE
-

PLAN
1.
2.
3.

SCOPE
IN:
-

OUT:
-
```

Keep findings concise and actionable.

---

# 9. MOBILE AUDIT

Treat mobile as primary.

Check conceptually at:

```text
320
360
375
390
430
tablet landscape
```

Inspect:

* touch targets
* thumb reach
* control separation
* safe areas
* overflow
* overlap
* viewport height
* gameplay visibility

Important controls should generally provide approximately:

`44×44px` minimum hit area.

Critical combat controls may be larger.

---

# 10. TOUCH AUDIT

Check for:

* overlapping hitboxes
* accidental activation
* tiny controls
* edge placement
* incorrect touch ownership
* blocked scrolling
* touch listeners affecting unrelated UI

Visible icon size is not the same as hitbox size.

---

# 11. JOYSTICK AUDIT

For joystick/input systems inspect:

* touch start
* touch move
* touch end
* touch cancel
* touch identifier
* deadzone
* radius
* normalization
* release/reset
* movement synchronization

Release must reliably return movement input to neutral.

Be suspicious of:

```text
touchmove
→ React state update
→ large UI rerender
```

during continuous input.

---

# 12. COMBAT AUDIT

During combat prioritize:

```text
movement
target
attack
skills
dash
interaction
potions
```

Secondary UI must not compete with primary combat actions.

Check that every combat action communicates:

* available
* pressed
* unavailable
* cooldown
* selected/active

---

# 13. KEYBOARD AUDIT

Preserve existing keyboard behavior unless explicitly asked to change it.

Known mappings may include:

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
H/?        help
O          settings
Escape     close
```

If UI hints exist, they must match actual bindings.

---

# 14. INPUT PARITY

Major actions should remain equivalent across:

```text
MOBILE
DESKTOP
```

Check:

* movement
* attack
* dash
* interact
* potions
* skills
* inventory
* quests
* settings
* close/back

Different input method is acceptable.

Different gameplay result is not.

---

# 15. HUD AUDIT

Check whether the HUD communicates:

* player identity
* HP
* MP
* target
* combat state
* primary actions
* relevant context

Then ask:

> Does it obscure gameplay?

If yes, reduce:

* size
* decoration
* opacity
* redundancy

before removing important information.

---

# 16. MODAL AUDIT

Check:

* title
* close action
* dimensions
* scrolling
* overflow
* mobile usability
* desktop usability
* Escape behavior
* backdrop
* focus
* nested modals

Avoid unnecessary modal stacking.

Prefer sections/tabs/drawers where appropriate.

---

# 17. RESPONSIVE AUDIT

Inspect:

* fixed widths
* fixed heights
* flex behavior
* absolute positioning
* viewport units
* overflow
* safe areas
* z-index
* text wrapping

Do not assume desktop + smaller width = mobile design.

---

# 18. VISUAL AUDIT

Compare the implementation against:

`argentum-ui-bible`

Check:

* hierarchy
* spacing
* typography
* color
* surfaces
* shapes
* borders
* shadows
* ornamentation
* iconography

Do not introduce a second visual language.

---

# 19. DESIGN-SYSTEM AUDIT

Search for repeated:

* buttons
* panels
* modal headers
* spacing
* colors
* typography
* borders
* shadows
* control sizes

If the same pattern is implemented differently, prefer consolidation when practical.

Do not abstract trivial differences.

---

# 20. COMPONENT REUSE

Before creating a component:

Search for an existing equivalent.

Prefer:

```text
existing component
→ extend/reuse

repeated pattern
→ shared component/token

unique responsibility
→ new component
```

Avoid duplicate UI systems.

---

# 21. PERFORMANCE AUDIT

Inspect:

* unnecessary React renders
* `touchmove`
* `mousemove`
* `scroll`
* `resize`
* timers
* `requestAnimationFrame`
* expensive filters
* blur
* animated shadows
* animated gradients
* excessive DOM

Every-frame work deserves special scrutiny.

Do not add dependencies for trivial UI effects.

---

# 22. UI VS GAMEPLAY

Trace the problem to the correct layer.

Examples:

```text
Camera lag
→ renderer/gameplay

Joystick visual lag
→ input/UI

Movement caused by bad joystick input
→ input/gameplay integration

Button not responding
→ UI OR gameplay; trace first

Wrong HP display
→ state/data/UI; trace first
```

Do not patch symptoms in the presentation layer.

---

# 23. SAFE MODIFICATION

Preserve whenever possible:

* props
* callbacks
* state semantics
* keyboard mappings
* touch behavior
* gameplay logic
* component contracts

If a shared component changes, inspect its consumers.

---

# 24. SHARED STYLE CHANGES

Before changing a shared style ask:

```text
Who uses this?
```

Inspect all relevant consumers before accepting the change.

Especially for:

* buttons
* panels
* modals
* global CSS
* typography
* design tokens
* responsive utilities

---

# 25. "MAKE IT PRETTIER"

Do this order:

```text
spacing
→ hierarchy
→ alignment
→ typography
→ grouping
→ contrast
→ consistency
→ material
→ ornamentation
→ effects
```

Do not start with glow, gradients or animation.

---

# 26. "MAKE IT MORE MEDIEVAL"

Do not add random decoration.

Inspect:

```text
materials
→ palette
→ typography
→ borders
→ ornamentation
→ iconography
```

Maintain usability.

---

# 27. "MAKE IT MORE MINIMAL"

Reduce:

* redundancy
* visual noise
* decoration
* excessive borders
* glow
* unnecessary animation
* duplicated controls

Do not remove necessary functionality.

---

# 28. "FIX THE HUD"

Inspect:

```text
information hierarchy
combat visibility
mobile layout
desktop layout
touch controls
keyboard hints
z-index
responsive behavior
```

Do not redesign the whole HUD unless the evidence indicates a systemic problem.

---

# 29. "FIX THE CONTROLS"

Determine whether the problem is:

```text
visual
hitbox
layout
input
feedback
state
gameplay integration
```

Trace input before changing CSS.

---

# 30. IMPLEMENTATION RULE

Prefer the smallest correct change.

Decision tree:

```text
Local problem
→ local fix

Repeated problem
→ shared fix

Systemic inconsistency
→ controlled design-system refactor

Input/gameplay issue
→ trace logic first
```

---

# 31. VALIDATION

After modifying UI, verify:

```text
□ TypeScript/build
□ affected components
□ imports
□ callbacks
□ keyboard
□ touch
□ responsive layout
□ overflow
□ z-index
□ animation
□ visual consistency
```

Compilation success does not equal UX success.

---

# 32. PROJECT COMMANDS

Use existing project scripts when available.

Examples:

```text
npm run build
npm run typecheck
npm run lint
```

Only run commands that actually exist.

Do not invent scripts.

---

# 33. REGRESSION CHECK

After modifying shared code ask:

```text
What else consumes this?
```

Inspect affected consumers.

Never fix one screen by silently breaking another.

---

# 34. UI DEBT

When recurring problems are discovered, record them conceptually as:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Do not automatically fix all debt.

Prioritize debt relevant to the current task.

Avoid introducing new debt.

---

# 35. STOP CONDITION

Stop when:

* requested problem is solved
* Bible rules are respected
* no obvious regression exists
* mobile works
* desktop works
* input remains functional
* further changes would only be subjective polish

Do not endlessly refine.

---

# 36. ANTI-PATTERNS

Never:

* modify blindly
* redesign unrelated UI
* duplicate components unnecessarily
* use hover as required interaction
* make critical controls tiny
* solve everything with z-index
* solve everything with `overflow-hidden`
* solve input problems with cosmetic CSS
* add effects before fixing hierarchy
* add dependencies for trivial styling
* invent runtime results
* silently expand scope
* sacrifice gameplay for aesthetics

---

# 37. FINAL CHECK

Before completing any UI task:

```text
FUNCTION
□ gameplay preserved
□ state preserved
□ keyboard preserved
□ touch preserved

MOBILE
□ controls reachable
□ hitboxes adequate
□ no overlap
□ no overflow
□ gameplay visible

DESKTOP
□ mouse works
□ keyboard hints correct
□ hover works where useful

VISUAL
□ follows UI Bible
□ coherent
□ readable
□ restrained

PERFORMANCE
□ no unnecessary frame work
□ no excessive effects
□ no unnecessary listeners

SCOPE
□ task solved
□ no unrelated redesign
```

---

# FINAL DIRECTIVE

For every UI task:

**READ THE BIBLE → INSPECT → DIAGNOSE → MAKE THE SMALLEST CORRECT CHANGE → VALIDATE → STOP.**

The goal is not more UI.

The goal is a single coherent, practical, medieval tactical ARPG interface.
