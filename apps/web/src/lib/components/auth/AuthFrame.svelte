<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		title,
		description,
		wide = false,
		children
	}: { title: string; description?: string; wide?: boolean; children: Snippet } = $props();
</script>

<svelte:head><meta name="theme-color" content="#fffaf1" /></svelte:head>

<main
	class="auth-screen grid min-h-dvh place-items-center bg-[#fffaf1] px-6 py-10 text-[#191919] sm:py-14"
>
	<section
		aria-labelledby="auth-title"
		class={[
			'w-full min-w-0 border-2 border-[#191919] bg-white shadow-[7px_7px_0_#191919]',
			wide ? 'max-w-3xl' : 'max-w-md'
		]}
	>
		<div class="p-6 sm:p-8">
			<div class="text-center">
				<a href="/" class="inline-flex" aria-label="Wedez, kembali ke beranda"
					><img
						class="size-16 object-contain"
						src="/images/hero/logo-wedez.webp"
						alt=""
						width="256"
						height="256"
					/></a
				>
				<h1
					id="auth-title"
					class="mt-2 text-3xl leading-[1.1] font-black tracking-[-0.045em] sm:text-4xl"
				>
					{title}
				</h1>
				{#if description}<p class="mt-4 text-sm leading-6 text-[#57534e]">{description}</p>{/if}
			</div>
			{@render children()}
		</div>
	</section>
</main>

<style>
	.auth-screen :global(:focus-visible) {
		outline: 3px solid #8030e4;
		outline-offset: 4px;
	}
	.auth-screen :global(input:focus) {
		outline: none;
		box-shadow: none;
	}
	.auth-screen :global(.auth-button) {
		display: inline-flex;
		min-height: 48px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 12px 18px;
		border: 2px solid #191919;
		background: #e5fa94;
		color: #191919;
		box-shadow: 4px 4px 0 #191919;
		font-size: 14px;
		line-height: 1.5;
		font-weight: 800;
		cursor: pointer;
		transition:
			translate 150ms,
			box-shadow 150ms;
	}
	.auth-screen :global(.auth-button-pink) {
		background: #ff96ca;
	}
	.auth-screen :global(.auth-button-neutral) {
		background: white;
	}
	.auth-screen :global(.auth-button:disabled) {
		cursor: not-allowed;
		opacity: 0.55;
	}
	.auth-screen :global(.auth-link) {
		color: #8030e4;
		font-weight: 800;
		text-underline-offset: 4px;
	}
	.auth-screen :global(.auth-link:hover) {
		text-decoration: underline;
	}
	.auth-screen :global(.auth-notice) {
		padding: 12px 16px;
		border: 2px solid #191919;
		font-size: 14px;
		line-height: 1.75;
		overflow-wrap: anywhere;
	}
	.auth-screen :global(.auth-notice-error) {
		background: #fff1f2;
		color: #9f1239;
	}
	.auth-screen :global(.auth-notice-success) {
		background: #e5fa94;
	}
	.auth-screen :global(.auth-notice-info) {
		background: #ffd1e6;
	}
	@media (hover: hover) and (prefers-reduced-motion: no-preference) {
		.auth-screen :global(.auth-button:not(:disabled):hover) {
			translate: 2px 2px;
			box-shadow: 2px 2px 0 #191919;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.auth-screen :global(.auth-button) {
			transition: none;
		}
	}
</style>
