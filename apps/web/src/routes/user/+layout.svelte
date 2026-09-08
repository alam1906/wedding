<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy } from 'svelte';
	import { logout } from '#lib/features/auth/index.js';
	import { resetGuestState } from '#lib/features/guests/index.js';
	import { resetWeddingState } from '#lib/features/weddings/index.js';
	import type { LayoutProps } from './$types';

	type NavigationIcon = 'home' | 'calendar' | 'invitation' | 'settings';

	type NavigationItem = {
		href: string;
		label: string;
		icon: NavigationIcon;
	};

	const navigation: NavigationItem[] = [
		{ href: '/user/dashboard', label: 'Beranda', icon: 'home' },
		{ href: '/user/data', label: 'Data Pernikahan', icon: 'calendar' },
		{ href: '/user/invitation', label: 'Undangan', icon: 'invitation' },
		{ href: '/user/setting', label: 'Pengaturan', icon: 'settings' }
	];

	let { children }: LayoutProps = $props();
	let menuOpen = $state(false);
	let isLoggingOut = $state(false);

	function resetUserState() {
		resetGuestState();
		resetWeddingState();
	}

	onDestroy(resetUserState);

	async function handleLogout() {
		if (isLoggingOut) {
			return;
		}

		isLoggingOut = true;
		menuOpen = false;
		resetUserState();
		logout();
		await goto('/login', { replaceState: true });
	}

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	function navClass(href: string) {
		const base = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition';

		return isActive(href)
			? `${base} bg-gray-200 font-semibold text-gray-900`
			: `${base} font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900`;
	}

	let currentMenuTitle = $derived(
		navigation.find((item) => isActive(item.href))?.label ?? 'Beranda'
	);
</script>

<main class="min-h-screen bg-gray-100">
	<button
		type="button"
		aria-label="Tutup menu"
		onclick={() => (menuOpen = false)}
		class:open={menuOpen}
		class="drawer-backdrop fixed inset-0 z-40 bg-gray-900/40 md:hidden"
	></button>

	<aside
		class:open={menuOpen}
		class="sidebar fixed inset-y-0 left-0 z-50 w-57.5 border-r border-gray-200 bg-white"
	>
		<div class="flex h-full flex-col px-5 py-7">
			<div class="relative flex items-center justify-center px-3">
				<a href="/user/dashboard" class="text-xl font-bold tracking-tight text-gray-900">Wedez</a>
			</div>

			<nav class="mt-7.5 flex flex-col gap-1" aria-label="Navigasi dashboard">
				{#each navigation as item (item.href)}
					<a
						href={item.href}
						aria-current={isActive(item.href) ? 'page' : undefined}
						onclick={() => (menuOpen = false)}
						class={navClass(item.href)}
					>
						<svg
							aria-hidden="true"
							class="size-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
						>
							{#if item.icon === 'home'}
								<path d="M3 11.5 12 4l9 7.5"></path>
								<path d="M5.5 10v10h13V10M9 20v-6h6v6"></path>
							{:else if item.icon === 'calendar'}
								<rect x="3" y="5" width="18" height="16" rx="2"></rect>
								<path d="M8 3v4M16 3v4M3 10h18"></path>
							{:else if item.icon === 'invitation'}
								<rect x="3" y="5" width="18" height="14" rx="2"></rect>
								<path d="m4 7 8 6 8-6"></path>
							{:else}
								<path d="M4 7h10M18 7h2M4 17h2M10 17h10"></path>
								<circle cx="16" cy="7" r="2"></circle>
								<circle cx="8" cy="17" r="2"></circle>
							{/if}
						</svg>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="mt-auto border-t border-gray-200 pt-5">
				<button
					type="button"
					disabled={isLoggingOut}
					aria-busy={isLoggingOut}
					onclick={handleLogout}
					class="w-full rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-700"
				>
					{isLoggingOut ? 'Sedang keluar...' : 'Logout'}
				</button>
			</div>
		</div>
	</aside>

	<div class="user-form-scope min-w-0 md:ml-57.5">
		<header
			class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:px-10"
		>
			<button
				type="button"
				aria-label="Buka menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = true)}
				class="grid size-10 place-items-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-gray-200 md:hidden"
			>
				<span class="flex w-5 flex-col gap-1.5" aria-hidden="true">
					<span class="h-0.5 w-full rounded-full bg-current"></span>
					<span class="h-0.5 w-full rounded-full bg-current"></span>
					<span class="h-0.5 w-full rounded-full bg-current"></span>
				</span>
			</button>
			<span class="text-xl font-bold tracking-tight text-gray-900">{currentMenuTitle}</span>
		</header>

		{@render children()}
	</div>
</main>

<style>
	.sidebar {
		transform: translate3d(-100%, 0, 0);
		transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
		will-change: transform;
	}

	.sidebar.open {
		transform: translate3d(0, 0, 0);
	}

	.drawer-backdrop {
		visibility: hidden;
		pointer-events: none;
		opacity: 0;
		transition:
			opacity 280ms ease,
			visibility 0s linear 280ms;
	}

	.drawer-backdrop.open {
		visibility: visible;
		pointer-events: auto;
		opacity: 1;
		transition-delay: 0s;
	}

	.user-form-scope :global(input:not([type='radio']):not([type='checkbox']):not([type='hidden'])),
	.user-form-scope :global(textarea),
	.user-form-scope :global(select),
	.user-form-scope :global([contenteditable='true']),
	.user-form-scope :global([data-form-control]) {
		border-color: var(--color-gray-400);
	}

	.user-form-scope :global(input::placeholder),
	.user-form-scope :global(textarea::placeholder) {
		color: var(--color-gray-300);
		opacity: 1;
	}

	.user-form-scope
		:global(input:not([type='radio']):not([type='checkbox']):not([type='hidden']):focus),
	.user-form-scope
		:global(input:not([type='radio']):not([type='checkbox']):not([type='hidden']):active),
	.user-form-scope :global(textarea:focus),
	.user-form-scope :global(textarea:active),
	.user-form-scope :global(select:focus),
	.user-form-scope :global(select:active),
	.user-form-scope :global([contenteditable='true']:focus),
	.user-form-scope :global([contenteditable='true']:active),
	.user-form-scope :global([data-form-control]:focus-within),
	.user-form-scope :global([data-form-control]:active) {
		border-color: var(--color-blue-500);
		outline: none;
		box-shadow: none;
	}

	@media (min-width: 768px) {
		.sidebar {
			transform: translate3d(0, 0, 0);
			transition: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar,
		.drawer-backdrop {
			transition: none;
		}
	}
</style>
