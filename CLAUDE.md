# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # install deps
bun --hot index.html     # dev server with HMR
bun build index.html     # production build
bun test             # run tests
```

**Always use Bun** — not Node, npm, pnpm, or vite.

## Architecture

**Reactless** is a minimal React clone. The public API mirrors React: `createElement` + `render`.

```
reactless/         ← core library
  vdom.ts          ← createElement (JSX transform target)
  render-phase.ts  ← fiber tree build + reconciliation (interruptible)
  commit-phase.ts  ← DOM mutations (async, also interruptible)
  fiber.ts         ← re-exports render, kicks off the render loop
  types.d.ts       ← global type declarations (FiberNode, ReactlessElement, etc.)
  constants.ts     ← TEXT_ELEMENT sentinel
  index.ts         ← public API surface

src/app.tsx        ← user canvas / demo app
index.ts           ← entry point: render(rootElement, App())
index.html         ← loads index.ts as ES module
```

### Two-phase rendering

**Render phase** (`render-phase.ts`) — interruptible via `requestIdleCallback`. Walks the fiber tree, calls `reconcileChildren` to diff old vs new fibers, tags each with `PLACEMENT | UPDATE | DELETION`. Never touches the DOM.

**Commit phase** (`commit-phase.ts`) — also async via `requestIdleCallback`. Walks the completed fiber tree and applies all tagged effects to the DOM. `currentRoot` is swapped to `wipRoot` only after the full commit completes.

### Reconciliation (`reconcileChildren`)

Two-pass O(n) algorithm:
1. Build a `Map<key, FiberNode>` from the old fiber list.
2. For each new element: key-based match first, then positional fallback. Tag `UPDATE` (same type) or `PLACEMENT` (new) + mark old fiber `DELETION`.
3. Second pass: any old fiber not matched → `DELETION`.

### JSX configuration

`tsconfig.json` uses `"jsx": "react"` with `"jsxFactory": "createElement"`. This means `<div />` compiles to `createElement('div')` — **not** `React.createElement`. No automatic JSX runtime; `createElement` must be imported in every TSX file that uses JSX.

### Not yet implemented

- Functional components (fiber.type is always a string tag)
- Hooks
