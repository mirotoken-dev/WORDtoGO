---
name: Tracing canvas alignment fix
description: Why the visual guide and reference pixels must come from the same canvas draw call
---

## The rule
The letter guide shown to the child and the reference pixel mask used for scoring MUST be produced by the same canvas draw call.

**Why:** A DOM element (CSS-rendered `<span>`) and an offscreen canvas `fillText()` call use different font rendering pipelines even with identical font strings. The DOM element's position, size, and metrics depend on CSS layout (padding, container size, device pixel ratio, browser font hinting) while the canvas draw call uses canvas units. They will never align.

## How to apply
- `bgCanvasRef` — renders the gray guide letter via canvas API (`fillText`) and immediately captures `getImageData()` as `bgRefPixels`
- `canvasRef` (fg) — transparent canvas stacked on top; child draws here
- `computeScores(fgPixels, bgRefPixels)` — both pixel arrays are in the same CANVAS_W×CANVAS_H coordinate space → perfect alignment
- **Never** use a separate offscreen canvas or DOM element as the source of reference pixels when a visible guide exists on screen

## Font string
`900 162px Nunito, sans-serif` — used for the guide draw call. If this changes, both guide display and scoring change together automatically.
