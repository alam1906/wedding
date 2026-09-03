<script lang="ts">
	import './layout.css';
	import { ToastViewport } from '#lib/features/toast/index.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
<ToastViewport />
