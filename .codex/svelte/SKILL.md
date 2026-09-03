---
name: svelte
description: Build, change, or review Svelte 5 and SvelteKit code in this repository. Use for components, routes, layouts, data loading, styling, reactivity, accessibility, and static-site behavior; do not use for unrelated tooling or non-Svelte assets.
---

# Svelte development

Use current Svelte and SvelteKit documentation, then make changes that fit this repository rather than relying on legacy syntax or generic framework habits.

## Documentation workflow

When Svelte MCP tools are available:

1. Call `list-sections` before working on a Svelte or SvelteKit task.
2. Select every section whose `use_cases` matches the task and fetch them with `get-documentation`.
3. When writing or changing `.svelte` code, run `svelte-autofixer` on the complete component. Resolve all issues and suggestions, then repeat until it reports none.

If the MCP tools are unavailable, state that briefly and consult only the relevant pages in the official [Svelte](https://svelte.dev/docs/svelte) and [SvelteKit](https://svelte.dev/docs/kit) documentation. Do not guess version-sensitive APIs.

Read [references/svelte-5.md](references/svelte-5.md) for component syntax, reactivity, events, snippets, or shared reactive logic. Read [references/sveltekit.md](references/sveltekit.md) for routing, loading data, rendering, navigation, forms, or deployment behavior.

## Repository conventions

- Treat local components as Svelte 5 runes-mode components; `vite.config.ts` forces runes mode outside dependencies.
- Use TypeScript and preserve strict type checking. Prefer explicit types at public or ambiguous boundaries, while allowing inference for obvious local values.
- Reuse code through `src/lib` and the `#lib` import alias when it improves ownership or avoids fragile relative imports.
- Use the existing Tailwind CSS 4 setup and established styles. Keep component-specific CSS scoped; put truly global rules in the existing global stylesheet.
- Preserve static-site compatibility. Avoid server-only behavior unless the task explicitly changes the deployment model.
- Maintain semantic HTML, keyboard access, visible focus, labels, useful alternative text, and reduced-motion behavior where relevant.

## Verification

After edits, run the narrowest useful checks, then finish with:

```sh
npm run check
npm run lint
```

Run `npm run build` when routing, loading, prerendering, configuration, or deployment output changes. Report any check that could not be run or any failure that predates the change.
