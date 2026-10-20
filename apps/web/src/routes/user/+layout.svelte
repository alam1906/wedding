<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy, onMount } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { getAuthenticatedEmail, getAuthenticatedName, logout } from '#lib/features/auth/index.js';
	import { chooseAffiliateHome } from '#lib/features/auth/api/choose-home.js';
	import { GuestState, setGuestContext } from '#lib/features/guests/index.js';
	import { MusicOptionsState, setMusicOptionsContext } from '#lib/features/musics/index.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	import { setWeddingContext, WeddingState } from '#lib/features/weddings/index.js';
	import type { LayoutProps } from './$types';

	type NavigationIcon = 'home' | 'calendar' | 'invitation' | 'upgrade' | 'settings';

	type NavigationItem = {
		href: string;
		label: string;
		icon: NavigationIcon;
	};

	const navigation: NavigationItem[] = [
		{ href: '/user/dashboard', label: 'Beranda', icon: 'home' },
		{ href: '/user/data', label: 'Data Pernikahan', icon: 'calendar' },
		{ href: '/user/invitation', label: 'Undangan', icon: 'invitation' },
		{ href: '/user/upgrade', label: 'Upgrade', icon: 'upgrade' },
		{ href: '/user/setting', label: 'Pengaturan', icon: 'settings' }
	];

	let { children, data }: LayoutProps = $props();
	const guests = setGuestContext(new GuestState());
	const musicOptions = setMusicOptionsContext(new MusicOptionsState());
	const wedding = setWeddingContext(new WeddingState());
	const toast = getToastContext();
	let menuOpen = $state(false);
	let profileMenuOpen = $state(false);
	let profileName = $state('');
	let profileEmail = $state('');
	let isLoggingOut = $state(false);
	let isSwitchingArea = $state(false);
	let profileInitial = $derived(
		(profileName.trim().charAt(0) || profileEmail.trim().charAt(0) || 'W').toLocaleUpperCase(
			'id-ID'
		)
	);

	function resetUserState() {
		guests.reset();
		musicOptions.reset();
		wedding.reset();
	}

	onDestroy(resetUserState);
	onMount(() => {
		profileName = getAuthenticatedName();
		profileEmail = getAuthenticatedEmail();
	});

	const attachProfileMenu: Attachment<HTMLDivElement> = (element) => {
		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;
			if (target instanceof Node && !element.contains(target)) profileMenuOpen = false;
		};
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || !profileMenuOpen) return;

			profileMenuOpen = false;
			element.querySelector<HTMLButtonElement>('button')?.focus();
		};

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleKeydown);
		};
	};

	async function handleLogout() {
		if (isLoggingOut) {
			return;
		}

		isLoggingOut = true;
		menuOpen = false;
		profileMenuOpen = false;
		resetUserState();
		logout();
		await goto('/login', { replaceState: true });
	}

	async function switchToAffiliate() {
		if (isSwitchingArea) return;
		isSwitchingArea = true;
		try {
			await chooseAffiliateHome();
			profileMenuOpen = false;
			await goto('/affiliate/dashboard');
		} catch {
			toast.error('Gagal beralih ke Affiliate. Silakan coba lagi.');
		} finally {
			isSwitchingArea = false;
		}
	}

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	function navClass(href: string) {
		return `ws-nav-button${isActive(href) ? ' is-active' : ''}`;
	}

	let currentMenuTitle = $derived(
		navigation.find((item) => isActive(item.href))?.label ?? 'Beranda'
	);
</script>

<svelte:head><meta name="theme-color" content="#fffaf1" /></svelte:head>

<main class="workspace min-h-screen">
	<button
		type="button"
		aria-label="Tutup menu"
		onclick={() => (menuOpen = false)}
		class:open={menuOpen}
		class="drawer-backdrop fixed inset-0 z-40 bg-gray-900/40 md:hidden"
	></button>

	<aside
		class:open={menuOpen}
		class="sidebar fixed inset-y-0 left-0 z-50 w-64 border-r-2 border-[#191919] bg-[#fffaf1]"
	>
		<div class="flex h-full flex-col overflow-y-auto px-5 pb-7">
			<div
				class="flex h-18 w-4/5 shrink-0 items-center justify-center self-center border-b-2 border-[#191919]"
			>
				<a href="/user/dashboard" class="text-2xl font-black tracking-[-0.06em]"> WEDEZ </a>
			</div>

			<nav class="mt-6 flex flex-col gap-3" aria-label="Navigasi dashboard">
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
							{:else if item.icon === 'upgrade'}
								<path
									d="m3 6 4.5 4L12 3l4.5 7L21 6l-2 11H5L3 6ZM5 21h14"
									stroke-linecap="round"
									stroke-linejoin="round"
								></path>
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
				aria-expanded={menuOpen}
				onclick={() => {
					menuOpen = true;
					profileMenuOpen = false;
				}}
				class="ws-button ws-button--icon md:hidden"
			>
				<span class="flex w-5 flex-col gap-1.5" aria-hidden="true">
					<span class="h-0.5 w-full rounded-full bg-current"></span>
					<span class="h-0.5 w-full rounded-full bg-current"></span>
					<span class="h-0.5 w-full rounded-full bg-current"></span>
				</span>
			</button>
			<span class="text-lg font-black tracking-tight sm:text-2xl">{currentMenuTitle}</span>

			<div {@attach attachProfileMenu} class="relative ml-auto">
				<button
					type="button"
					onclick={() => (profileMenuOpen = !profileMenuOpen)}
					aria-label="Buka menu profil"
					aria-haspopup="menu"
					aria-expanded={profileMenuOpen}
					aria-controls={profileMenuOpen ? 'profile-menu' : undefined}
					class="ws-button ws-button--icon bg-[#ff96ca]"
				>
					{profileInitial}
				</button>

				{#if profileMenuOpen}
					<div
						id="profile-menu"
						role="menu"
						aria-label="Menu profil"
						class="ws-inset absolute top-full right-0 z-40 mt-2 w-62 p-3"
					>
						<div class="px-2 pt-1 pb-3">
							<p class="truncate text-sm font-bold text-[#191919] capitalize">
								{profileName || 'Pengguna Wedez'}
							</p>
							<p class="mt-1 truncate text-sm text-[#5c554e]">
								{profileEmail || 'Email tidak tersedia'}
							</p>
						</div>
						<button
							type="button"
							role="menuitem"
							disabled={isSwitchingArea}
							aria-busy={isSwitchingArea}
							onclick={switchToAffiliate}
							class="ws-menu-option flex w-full cursor-pointer px-2 py-2.5 text-left text-sm font-medium text-[#191919] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{data.hasAffiliate ? 'Beralih ke Affiliate' : 'Gabung Affiliate'}
						</button>
						<button
							type="button"
							role="menuitem"
							disabled={isLoggingOut}
							aria-busy={isLoggingOut}
							onclick={handleLogout}
							class="ws-menu-option flex w-full cursor-pointer items-center px-2 py-2.5 text-left text-sm font-medium text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isLoggingOut ? 'Sedang keluar...' : 'Keluar'}
						</button>
					</div>
				{/if}
			</div>
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
