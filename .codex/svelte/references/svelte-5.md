# Svelte 5 guidance

Use this reference only for Svelte component and reactivity work. Confirm task-specific details against the current official documentation.

## Modern component model

- Use `$state` for mutable reactive state, `$derived` for values computed from state, and `$effect` only for synchronization with an external system or imperative side effect.
- Do not use `$effect` to mirror state that can be expressed with `$derived`.
- Declare component inputs with `$props()`. Mark a prop with `$bindable()` only when two-way binding is part of the intended component interface.
- Use callback props and DOM event attributes such as `onclick`; do not introduce legacy `on:` component events into new code.
- Use snippets and `{@render ...}` for reusable or caller-supplied markup instead of adding new slot-based APIs.
- Put reusable reactive logic in `.svelte.ts` or `.svelte.js` modules when it needs runes outside a component. Use stores when their subscription contract or ecosystem interoperability is genuinely useful.

## Implementation choices

- Keep state owned by the narrowest component or module that needs to mutate it.
- Prefer derived data over duplicated state and keyed `{#each}` blocks when identity matters.
- Use bindings only when they clarify ownership; explicit value and callback props are usually easier to reason about across component boundaries.
- Keep browser globals and DOM-dependent work out of server rendering. Place required setup and cleanup in an appropriate lifecycle or effect and return cleanup functions.
- Preserve Svelte's scoped styling. Reach for `:global(...)` only for deliberate integration boundaries.

## Review checks

- No accidental legacy syntax in new runes-mode code.
- Effects have a real side-effect purpose and clean up resources.
- Props, callbacks, snippets, and bindings form a clear typed interface.
- Lists use stable identity where DOM or component state must survive reordering.
- Interactive elements remain semantic and keyboard accessible.
