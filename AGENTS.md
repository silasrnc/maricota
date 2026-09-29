# Repository Guidelines

## Project Structure

- `app/` contains Next.js App Router pages and the shared global stylesheet (`globals.css`). Route folders use Portuguese names such as `app/produtos/` and `app/vendas/`.
- `components/` holds reusable layout and form components. Add `"use client"` only to components that need browser state or event handlers.
- `lib/` contains Supabase clients and shared data/formatting helpers. Keep server and browser Supabase access in their respective `lib/supabase/` modules.
- `supabase/migrations/` contains SQL schema, RLS policies, and database functions. `README.md` documents local setup and deployment.
- There is no separate test or static asset directory yet.

## Development Commands

- `npm install` installs dependencies.
- `npm run dev` starts the local Next.js development server.
- `npm run lint` runs ESLint across the repository.
- `npm run build` creates a production build; `npm run start` serves that build locally.
- No test framework or `npm test` script is configured. If tests are introduced, document the runner and add a script here.

## Style and Naming

Use TypeScript with strict checking and two-space indentation. Name React components and component files in PascalCase where practical; use camelCase for functions and variables, and lowercase Portuguese route segments. Prefer the `@/` import alias for project-root modules. Keep UI copy in Brazilian Portuguese, currency in BRL, and date calculations in the São Paulo time zone. Follow the existing ESLint configuration and use semantic HTML and responsive CSS.

## Database and Security

Keep schema changes in a new, descriptively named SQL migration. Preserve row-level security and authenticated-only access. Store local credentials in `.env.local`; never commit environment files, service-role keys, or other secrets. Only the public Supabase URL and publishable key belong in `NEXT_PUBLIC_*` variables.

## Commits and Pull Requests

This checkout has no Git history to establish existing commit conventions. Use short imperative Conventional Commit messages, for example `feat: add product editing` or `fix: handle partial payments`. Pull requests should explain user-visible changes, note database migrations or environment changes, include screenshots for UI updates, and report lint/build results. There are no linked issue or review templates to follow.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
