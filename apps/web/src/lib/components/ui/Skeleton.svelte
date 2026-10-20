<script lang="ts">
	let { class: className = 'h-4 w-full' }: { class?: string } = $props();
</script>

<span aria-hidden="true" class="skeleton block {className}"></span>

<style>
	.skeleton {
		background: #e8e4df;
		animation: skeleton-pulse 1.6s ease-in-out infinite;
	}

	@keyframes skeleton-pulse {
		50% {
			opacity: 0.45;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: none;
		}
	}
</style>
