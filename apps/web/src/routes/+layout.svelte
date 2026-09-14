<script lang="ts">
	import { onDestroy } from 'svelte';
	import './layout.css';
	import { setToastContext, ToastState, ToastViewport } from '#lib/features/toast/index.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const toast = setToastContext(new ToastState());

	onDestroy(() => toast.reset());
</script>

{@render children()}
<ToastViewport />
