<script lang="ts">
	import { onDestroy } from 'svelte';
	import { onNavigate } from '$app/navigation';
	import './layout.css';
	import { setToastContext, ToastState, ToastViewport } from '#lib/features/toast/index.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const toast = setToastContext(new ToastState());

	onNavigate(({ from, to }) => {
		if (from?.url.pathname === to?.url.pathname) return;

		// Let SvelteKit reset or restore scroll instantly when changing pages.
		const root = document.documentElement;
		root.classList.add('route-navigation');
		return () => root.classList.remove('route-navigation');
	});

	onDestroy(() => toast.reset());
</script>

{@render children()}
<ToastViewport />
