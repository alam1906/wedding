<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import WorkspaceContent from '#lib/components/ui/WorkspaceContent.svelte';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { logout } from '#lib/features/auth/index.js';
	import { chooseWeddingHome } from '#lib/features/auth/api/choose-home.js';
	import { getToastContext } from '#lib/features/toast/index.js';

	type NavigationIcon = 'home' | 'commissions' | 'payouts' | 'settings';
	type NavigationItem = { href: string; label: string; icon: NavigationIcon };

	let {
		children,
		name,
		email,
		hasWedding
	}: { children: Snippet; name: string; email: string; hasWedding: boolean } = $props();
	let menuOpen = $state(false);
	let profileOpen = $state(false);
	let isLoggingOut = $state(false);
	let isSwitchingArea = $state(false);
	const toast = getToastContext();
	const initial = $derived((name.trim().charAt(0) || email.trim().charAt(0) || 'W').toUpperCase());
	const navigation: NavigationItem[] = [
		{ href: '/affiliate/dashboard', label: 'Beranda', icon: 'home' },
		{ href: '/affiliate/commissions', label: 'Komisi', icon: 'commissions' },
		{ href: '/affiliate/payouts', label: 'Pencairan', icon: 'payouts' },
		{ href: '/affiliate/settings', label: 'Rekening', icon: 'settings' }
	];
	const menuPath = $derived(
		navigating.to?.url.pathname.startsWith('/affiliate/')
			? navigating.to.url.pathname
			: page.url.pathname
	);
	const currentMenuTitle = $derived(
		navigation.find((item) => menuPath === item.href)?.label ?? 'Beranda'
	);

	function navClass(href: string) {
		return `ws-nav-button${menuPath === href ? ' is-active' : ''}`;
	}

	const attachProfile: Attachment<HTMLDivElement> = (element) => {
		const outside = (event: PointerEvent) => {
			if (event.target instanceof Node && !element.contains(event.target)) profileOpen = false;
		};
		const escape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || !profileOpen) return;
			profileOpen = false;
			element.querySelector<HTMLButtonElement>('button')?.focus();
		};
		document.addEventListener('pointerdown', outside);
		document.addEventListener('keydown', escape);
		return () => {
			document.removeEventListener('pointerdown', outside);
			document.removeEventListener('keydown', escape);
		};
	};

	async function signOut() {
		if (isLoggingOut) return;
		isLoggingOut = true;
		menuOpen = false;
		profileOpen = false;
		logout();
		await goto('/login', { replaceState: true, invalidateAll: true });
	}

	async function switchToWedding() {
		if (isSwitchingArea) return;
		if (!hasWedding) {
			profileOpen = false;
			await goto('/start');
			return;
		}
		isSwitchingArea = true;
		try {
			await chooseWeddingHome();
			profileOpen = false;
			await goto('/user/dashboard');
		} catch {
			toast.error('Gagal beralih ke Undangan. Silakan coba lagi.');
		} finally {
			isSwitchingArea = false;
		}
	}
</script>

<svelte:head><meta name="theme-color" content="#fffaf1" /></svelte:head>

<div class="workspace min-h-screen">
	<button
		type="button"
		aria-label="Tutup menu"
		onclick={() => (menuOpen = false)}
		class:open={$state.eager(menuOpen)}
		class="drawer-backdrop fixed inset-0 z-40 bg-gray-900/40 md:hidden"
	></button>

	<aside
		class:open={$state.eager(menuOpen)}
		class="sidebar fixed inset-y-0 left-0 z-50 w-64 border-r-2 border-[#191919] bg-[#fffaf1]"
	>
		<div class="flex h-full flex-col overflow-y-auto px-5 pb-7">
			<div
				class="flex h-18 w-4/5 shrink-0 items-center justify-center self-center border-b-2 border-[#191919]"
			>
				<a href="/affiliate/dashboard" class="text-2xl font-black tracking-[-0.06em]">WEDEZ</a>
			</div>

			<nav class="mt-6 flex flex-col gap-3" aria-label="Navigasi affiliate">
				{#each navigation as item (item.href)}
					<a
						href={item.href}
						aria-current={$state.eager(menuPath) === item.href ? 'page' : undefined}
						onclick={() => (menuOpen = false)}
						class={$state.eager(navClass(item.href))}
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
							{:else if item.icon === 'commissions'}
								<rect x="3" y="4" width="18" height="16" rx="2"></rect>
								<path d="M7 9h10M7 13h7"></path>
							{:else if item.icon === 'payouts'}
								<path d="M12 3v12m-4-4 4 4 4-4"></path>
								<path d="M4 17v3h16v-3"></path>
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
		</div>
	</aside>

	<div class="min-w-0 md:ml-64">
		<header
			class="sticky top-0 z-30 flex h-18 items-center gap-3 border-b-2 border-[#191919] bg-[#fffaf1] px-4 lg:px-10"
		>
			<button
				type="button"
				aria-label="Buka menu"
				aria-expanded={$state.eager(menuOpen)}
				onclick={() => {
					menuOpen = true;
					profileOpen = false;
				}}
				class="ws-button ws-button--icon md:hidden"
			>
				<span class="flex w-5 flex-col gap-1.5" aria-hidden="true">
					<span class="h-0.5 w-full rounded-full bg-current"></span>
					<span class="h-0.5 w-full rounded-full bg-current"></span>
					<span class="h-0.5 w-full rounded-full bg-current"></span>
				</span>
			</button>
			<h1 class="text-xl font-black tracking-tight sm:text-2xl">
				{$state.eager(currentMenuTitle)}
			</h1>

			<div {@attach attachProfile} class="relative ml-auto">
				<button
					type="button"
					onclick={() => (profileOpen = !profileOpen)}
					aria-label="Buka menu profil"
					aria-haspopup="menu"
					aria-expanded={profileOpen}
					aria-controls={profileOpen ? 'affiliate-profile-menu' : undefined}
					class="ws-button ws-button--icon bg-[#ff96ca]">{initial}</button
				>
				{#if profileOpen}
					<div
						id="affiliate-profile-menu"
						role="menu"
						aria-label="Menu profil"
						class="ws-inset absolute top-full right-0 z-40 mt-2 w-62 p-3"
					>
						<div class="px-2 pt-1 pb-3">
							<p class="truncate text-sm font-bold text-[#191919] capitalize">
								{name || 'Pengguna Wedez'}
							</p>
							<p class="mt-1 truncate text-sm text-[#5c554e]">{email || 'Email tidak tersedia'}</p>
						</div>
						<button
							type="button"
							role="menuitem"
							disabled={isSwitchingArea}
							aria-busy={isSwitchingArea}
							onclick={switchToWedding}
							class="ws-menu-option flex w-full cursor-pointer items-center px-2 py-2.5 text-left text-sm font-medium text-[#191919] disabled:cursor-not-allowed disabled:opacity-50"
							>{hasWedding ? 'Beralih ke Undangan' : 'Buat Undangan'}</button
						>
						<button
							type="button"
							role="menuitem"
							disabled={isLoggingOut}
							aria-busy={isLoggingOut}
							onclick={signOut}
							class="ws-menu-option flex w-full cursor-pointer items-center px-2 py-2.5 text-left text-sm font-medium text-red-500 disabled:opacity-50"
							>{isLoggingOut ? 'Sedang keluar...' : 'Keluar'}</button
						>
					</div>
				{/if}
			</div>
		</header>

		<main class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
			<div class="w-full min-w-0">
				<WorkspaceContent area="affiliate">{@render children()}</WorkspaceContent>
			</div>
		</main>
	</div>
</div>

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
