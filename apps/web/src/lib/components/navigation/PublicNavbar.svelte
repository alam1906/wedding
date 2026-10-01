<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { slide } from 'svelte/transition';

	let { currentPage = 'home' }: { currentPage?: 'home' | 'themes' } = $props();
	let mobileMenuOpen = $state(false);
	let menuButton = $state<HTMLButtonElement>();
	const navItems = $derived([
		{ href: currentPage === 'home' ? '#beranda' : '/', label: 'Beranda' },
		{ href: '/tema', label: 'Tema' },
		{ href: currentPage === 'home' ? '#harga' : '/#harga', label: 'Harga' }
	]);

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && mobileMenuOpen) {
			closeMobileMenu();
			menuButton?.focus();
		}
	}

	function handleResize() {
		if (window.innerWidth >= 768) closeMobileMenu();
	}

	afterNavigate(closeMobileMenu);
</script>

<svelte:window onkeydown={handleKeydown} onresize={handleResize} />

<header
	class="fixed inset-x-0 top-0 z-50 shrink-0 border-b border-gray-200 bg-white/90 backdrop-blur-md md:sticky md:inset-x-auto"
>
	<div
		class="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-4 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-8 2xl:max-w-[1600px] 2xl:px-10"
	>
		<a
			class="flex items-center gap-2"
			href={currentPage === 'home' ? '#beranda' : '/'}
			aria-label="Wedez, kembali ke beranda"
			onclick={closeMobileMenu}
		>
			<img
				class="size-12 shrink-0 object-contain"
				src="/images/hero/logo-wedez.webp"
				alt=""
				width="256"
				height="256"
			/>
			<span
				class="bg-linear-to-r from-[#9400ff] to-[#7200e8] bg-clip-text text-xl font-bold tracking-[-0.04em] text-transparent"
				>wedez.id</span
			>
		</a>

		<nav class="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
			{#each navItems as item (item.href)}
				<a
					class={[
						'text-sm font-medium transition-colors hover:text-gray-950',
						currentPage === 'themes' && item.href === '/tema' ? 'text-violet-700' : 'text-gray-600'
					]}
					aria-current={currentPage === 'themes' && item.href === '/tema' ? 'page' : undefined}
					href={item.href}>{item.label}</a
				>
			{/each}
		</nav>
		<a
			class="hidden justify-self-end rounded-full bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-2.5 text-sm font-semibold text-white md:inline-flex"
			href="/login">Login</a
		>

		<button
			bind:this={menuButton}
			class="grid size-10 place-items-center rounded-xl border border-gray-200 text-gray-900 md:hidden"
			type="button"
			aria-expanded={mobileMenuOpen}
			aria-controls="mobile-navigation"
			aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
		>
			{#if mobileMenuOpen}
				<svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M6 6L18 18M18 6L6 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			{:else}
				<svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M4 7H20M4 12H20M4 17H20"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			{/if}
		</button>
	</div>

	{#if mobileMenuOpen}
		<nav
			id="mobile-navigation"
			class="absolute inset-x-0 top-full overflow-hidden border-y border-gray-200 bg-white px-4 py-4 shadow-lg md:hidden"
			aria-label="Navigasi mobile"
			transition:slide={{ duration: 240, axis: 'y' }}
		>
			<div class="mx-auto flex w-full max-w-7xl flex-col gap-1">
				{#each navItems as item (item.href)}
					<a
						class="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
						aria-current={currentPage === 'themes' && item.href === '/tema' ? 'page' : undefined}
						href={item.href}
						onclick={closeMobileMenu}>{item.label}</a
					>
				{/each}
				<a
					class="mt-2 rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-4 py-3 text-center text-sm font-semibold text-white"
					href="/login"
					onclick={closeMobileMenu}>Login</a
				>
			</div>
		</nav>
	{/if}
</header>
<div class="h-18 shrink-0 md:hidden" aria-hidden="true"></div>
