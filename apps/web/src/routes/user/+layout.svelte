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
		const base = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition';

		return isActive(href)
			? `${base} bg-linear-to-r from-[#9400ff] to-[#7200e8] font-semibold text-white`
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
				<a
					href="/user/dashboard"
					class="bg-linear-to-r from-[#9400ff] to-[#7200e8] bg-clip-text text-xl font-bold tracking-tight text-transparent"
				>
					WEDEZ
				</a>
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
				onclick={() => {
					menuOpen = true;
					profileMenuOpen = false;
				}}
				class="grid size-10 place-items-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-gray-200 md:hidden"
			>
				<span class="flex w-5 flex-col gap-1.5" aria-hidden="true">
					<span class="h-0.5 w-full rounded-full bg-current"></span>
					<span class="h-0.5 w-full rounded-full bg-current"></span>
					<span class="h-0.5 w-full rounded-full bg-current"></span>
				</span>
			</button>
			<span class="text-xl font-bold tracking-tight text-gray-900">{currentMenuTitle}</span>

			<div {@attach attachProfileMenu} class="relative ml-auto">
				<button
					type="button"
					onclick={() => (profileMenuOpen = !profileMenuOpen)}
					aria-label="Buka menu profil"
					aria-haspopup="menu"
					aria-expanded={profileMenuOpen}
					aria-controls={profileMenuOpen ? 'profile-menu' : undefined}
					class="grid size-10 cursor-pointer place-items-center rounded-full bg-linear-to-br from-[#9400ff] to-[#7200e8] text-sm font-bold text-white"
				>
					{profileInitial}
				</button>

				{#if profileMenuOpen}
					<div
						id="profile-menu"
						role="menu"
						aria-label="Menu profil"
						class="absolute top-full right-0 z-40 mt-2 w-62 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
					>
						<div class="px-2 pt-1 pb-3">
							<p class="truncate text-sm font-bold text-gray-900">
								{profileName || 'Pengguna Wedez'}
							</p>
							<p class="mt-1 truncate text-sm text-gray-500">
								{profileEmail || 'Email tidak tersedia'}
							</p>
						</div>
						<button
							type="button"
							role="menuitem"
							disabled={isSwitchingArea}
							aria-busy={isSwitchingArea}
							onclick={switchToAffiliate}
							class="flex w-full cursor-pointer rounded-lg px-2 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{data.hasAffiliate ? 'Beralih ke Affiliate' : 'Gabung Affiliate'}
						</button>
						<button
							type="button"
							role="menuitem"
							disabled={isLoggingOut}
							aria-busy={isLoggingOut}
							onclick={handleLogout}
							class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<svg
								aria-hidden="true"
								class="size-5 shrink-0"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M14 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-3"
								></path>
								<path d="M10 12h11M18 9l3 3-3 3"></path>
							</svg>
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

	.user-form-scope :global(input:not([type='radio']):not([type='checkbox']):not([type='hidden'])),
	.user-form-scope :global(textarea),
	.user-form-scope :global(select),
	.user-form-scope :global([contenteditable='true']),
	.user-form-scope :global([data-form-control]) {
		border-color: #cbd5e1;
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
		border-color: #9400ff;
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
