# SvelteKit guidance

Use this reference for routes, layouts, data flow, forms, rendering, and deployment. Confirm task-specific details against the current official documentation.

## Routing and data

- Follow SvelteKit's filesystem routing conventions and keep route-specific code beside the route.
- Use universal `load` when code and data access are safe in both environments. Use server-only modules when secrets, privileged credentials, or server-only dependencies are involved.
- Pass loaded data through the generated page or layout types; preserve parent-child layout data contracts.
- Use SvelteKit navigation and URL APIs instead of manually reproducing router behavior.
- Prefer progressive enhancement for forms when server handling exists, so the baseline interaction works without client JavaScript.

## Static deployment constraints

This repository uses `@sveltejs/adapter-static`. New routes must be statically producible unless the user explicitly approves changing the deployment architecture.

- Ensure dynamic routes have discoverable prerender entries or another explicit static generation strategy.
- Do not add request-time server dependencies, private runtime secrets, or endpoints that require a persistent SvelteKit server.
- Treat browser-only APIs carefully because pages can execute during prerendering or server-side rendering.
- Verify route and configuration changes with a production build, not only the development server.

## Error and boundary behavior

- Use redirects, expected errors, and route error boundaries through SvelteKit's supported APIs rather than ad hoc response shapes.
- Validate external input at the server boundary and return actionable user-facing form errors without leaking sensitive details.
- Preserve status codes and avoid catching framework redirects or errors as ordinary exceptions.

## Review checks

- Route filenames and generated types match the intended URL and data contract.
- Server-only values cannot enter client bundles.
- Loading, empty, error, and navigation states remain understandable.
- Every route can be prerendered under the current static-adapter setup.
