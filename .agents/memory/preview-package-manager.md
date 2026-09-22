---
name: Preview package-manager dependency
description: Environment constraint affecting managed workflow startup and Preview verification.
---

The managed frontend and mockup workflows can fail before application startup when `pnpm` is not on PATH and the configured Corepack pnpm cache is incomplete.

**Why:** The workflow command depends on pnpm, so a missing package manager prevents Preview from opening and produces no browser-level signal about the application code.

**How to apply:** Before diagnosing a blank Preview as an app defect, confirm that the workflow's package manager is available and that its cached executable is usable.