# Design Brief — Rainbow Playhouse

**Tone:** Playful, celebratory, joyful. Bold & energetic for ages 3–7.

**Palette:**

| Token | OKLCH | Usage |
|-------|-------|-------|
| Primary (Ruby Red) | `0.55 0.28 15` | CTAs, letter "A", blending highlights |
| Secondary (Ocean Blue) | `0.5 0.24 264` | Letter "B", accents, secondary actions |
| Accent (Forest Green) | `0.58 0.27 131` | Callouts, success states, celebration |
| Tertiary (Sunshine Yellow) | `0.82 0.16 84` | Highlights, warnings, cheerful moments |
| Purple | `0.55 0.22 320` | Letter "Q", discovery, unique moments |
| Muted | `0.92 0.02 94` | Backgrounds, subtle dividers |
| Foreground | `0.2 0.02 264` | Text, high contrast on light backgrounds |

**Typography:**

| Role | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| Display (headings, large text) | Space Grotesk | 32–48px | 400 | Letter names, lesson titles, celebrations |
| Body (UI labels, instructions) | Nunito | 16–24px | 400 | Button labels, descriptions, progress |
| Mono (feedback, counts) | JetBrains Mono | 14–16px | 400 | Scores, counts, debugging |

**Shape Language:** Rounded corners everywhere. Button radius 24–32px (bubbly feel). Card radius 20px. Borders 2px on interactive elements. No sharp edges.

**Structural Zones:**

| Zone | Background | Border | Purpose |
|------|-----------|--------|---------|
| Header | `bg-card` with `border-b` | `border-muted` | Profile name, navigation |
| Content | `bg-background` | none | Main learning area, flashcards, forms |
| Action Footer | `bg-card` with `border-t` | `border-muted` | Navigation buttons (Home, Progress, etc.) |
| Letter Card | `bg-gradient-*` | `shadow-playful` | Animated letter display with color per letter |
| Button (CTA) | `bg-primary` / `bg-accent` | none | `text-white` 48px min tap target |

**Spacing & Rhythm:** Large padding (32–48px) on main content. Generous gaps between buttons (16–24px). Dense information inside cards but spacious layout overall.

**Component Patterns:**

- **Large Buttons:** 48×48px minimum, rounded-full, shadow-playful, active:scale-95
- **Letter Cards:** 120–160px, gradient background, white text, drop shadow
- **Flashcards:** 200×280px, letter + illustration + word label, swipe/tap to advance
- **Progress Bar:** Colorful segments (one per letter completed), animate on milestone
- **Celebration State:** Confetti emoji, bouncing animation, playful sound cue

**Motion:**

- Tap feedback: `scale-95` on button press, 200ms
- Card entrance: Fade + slide-up, 300ms
- Letter reveal: Scale from 0.8 to 1, 400ms, ease-out
- Milestone celebration: Bounce animation on completion, 600ms
- Page transition: Crossfade, 250ms

**Signature Detail:** Each letter (A–Z) has a unique color from a rotated palette. "A is for Apple in Ruby Red", "B is for Ball in Ocean Blue", etc. Letter cards gradient from vibrant to darker shade. Celebrates learning with bounce + sound.

**Constraints:**

- No transparency gradients (use color blends instead)
- High contrast (AA+) enforced on all text
- Touch targets always 44px minimum
- Reduced motion respected (prefers-reduced-motion)
- Accessible color pairs (not red-green for color-blind users)

**Light Mode:** Cream/white background (`0.98 0.01 94`), vibrant primary text. Card layer adds subtle depth.

**Responsive:** Mobile-first portrait, scale to landscape (2:1 aspect). Header shrinks, content expands. No desktop-first assumptions.
