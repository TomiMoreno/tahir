# Repository Guidelines

## Project Overview
This repository implements a browser-based version of Tahir, an Afghan alignment game known as “juego de los camellos.” It is a golden-ratio variation of three-in-a-row played on a trihex-like board with three pieces per player. The objective is to place three pieces in a straight line. See the source references in the project notes for historical background and board geometry.

## Project Structure & Module Organization
- `src/pages` contains Next.js routes (e.g., `src/pages/index.tsx`, `src/pages/_app.tsx`).
- `src/lib` holds game logic (board state, moves) in `src/lib/tree.ts`.
- `src/styles` contains global styles like `src/styles/globals.css`.
- `src/env` defines Zod schemas for environment validation.
- `public` stores static assets (favicons, images).

## Game Rules & Variants
- Phase 1 (placement): players alternate placing their three pieces on empty nodes.
- Phase 2 (movement): if no line is formed, players slide one piece along a line to an adjacent empty node.
- Win condition: align three pieces in a straight line.
- Variant: play with five pieces per player.
- Open research questions: who has a theoretical advantage, and how many unique positions exist after all pieces are placed.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the Next.js dev server.
- `npm run build` creates a production build.
- `npm run start` runs the production server from `.next`.
- `npm run lint` runs ESLint with the Next.js core web vitals rules.

## Coding Style & Naming Conventions
- TypeScript + React 18 + Next.js 12; prefer functional components and hooks.
- Formatting: 2-space indentation, double quotes, semicolons; keep inline styles readable.
- ESLint config is in `.eslintrc.json`; Prettier is installed (`npx prettier --write .`).
- Naming: components in PascalCase, hooks in `useX` form, helpers in camelCase.

## Testing Guidelines
- No automated test runner is configured yet.
- For manual checks: load `/`, place pieces to verify turn handling, and test movement rules once both players have three pieces.

## Commit & Pull Request Guidelines
- Use short, sentence-case commit summaries (e.g., "Show board correctly").
- PRs should include a brief description, testing notes, and screenshots/GIFs for UI changes.

## Configuration & Environment
- Use `.env.local` for local variables; update `src/env/schema.mjs` and `src/env/client.mjs` or `src/env/server.mjs` when adding keys.
- Client-exposed variables must use the `NEXT_PUBLIC_` prefix.
