# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Expo Router routes (e.g., `(tabs)/`, screens). Entry: `expo-router/entry`.
- `components/`, `hooks/`, `constants/`, `utils/`, `styles/`: Reusable UI, logic, config, and styling.
- `assets/`: Images/fonts. `metro.config.cjs` and `app.json` configure bundling.
- `api/`: Client libraries plus tests (`api/dorkroom/__tests__/`).
- `workers/`: Background/edge helpers.
- `docs/`, `scripts/`: Contributor docs and utility scripts.

## Build, Test, and Development Commands

Use Bun to run scripts (examples shown with `bun run`):

- `bun run start`: Start Expo dev server (Dev Client).
- `bun run dev`: Start Expo Go.
- `bun run ios` / `bun run android`: Build and run native targets.
- `bun run web`: Run in browser; `bun run build` or `bun run web-export` to export web.
- `bun run test`: Run unit tests.
- `bun run lint` / `bun run type-check` / `bun run format`: Lint, TS check, and format.
- `bun run reset-project`: Clean caches and reset project; `bun run clean` removes build artifacts.
- Performance: `bun run perf:baseline`, `bun run perf:benchmark`, `bun run perf:monitor`.

## Coding Style & Naming Conventions

- TypeScript-first; 2-space indentation; semicolons auto-managed by Prettier.
- Linting: ESLint (Airbnb + Expo + TS). Formatting: Prettier (+ Tailwind plugin).
- React components: PascalCase (`MyWidget.tsx`). Utilities: kebab-case (`tokenized-search.ts`).
- Routes follow Expo Router conventions inside `app/`.

## Testing Guidelines

- Frameworks: Bun test runner; Jest/Jest-Expo preset for perf suites.
- Tests live in `__tests__/` with `*.test.ts` or `*.test.tsx`.
- Run: `bun test` for fast unit tests; use perf scripts for performance suites.
- No strict coverage threshold enforced; prioritize core logic in `utils/` and `api/`.

## Commit & Pull Request Guidelines

- Conventional Commits enforced by Commitlint/Husky. Use `bun run commit` (Commitizen).
  - Examples: `feat: add dilution ratio parser`, `fix(api): handle network retries`.
- PRs: clear description, linked issues, screenshots for UI changes, and notes on tests.
- Ensure `bun run lint` and `bun run type-check` pass; update `docs/` when behavior changes.

## Security & Configuration Tips

- Do not commit secrets; use Expo/Vercel project envs. Review `.gitignore` before adding files.
- Validate web exports before deploy: `bun run web-export` then preview on Vercel.
