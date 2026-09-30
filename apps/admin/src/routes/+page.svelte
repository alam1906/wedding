<script lang="ts">
	import { onMount } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import StatusFilter from '#lib/features/admin/components/StatusFilter.svelte';

	import {
		adminEmail,
		errorMessage,
		getOverview,
		getRecords,
		isUnauthorized,
		login,
		logout,
		setAffiliateStatus,
		setPayoutStatus
	} from '#lib/features/admin/api.js';
	import {
		dateTime,
		rupiah,
		type AffiliateRecord,
		type AffiliateStatus,
		type PaymentRecord,
		type PayoutRecord,
		type PayoutStatus,
		type Section,
		type UserRecord,
		type WeddingRecord
	} from '#lib/features/admin/model.js';

	const navigation: { id: Section; label: string; icon: Section }[] = [
		{ id: 'overview', label: 'Beranda', icon: 'overview' },
		{ id: 'users', label: 'Pengguna', icon: 'users' },
		{ id: 'weddings', label: 'Undangan', icon: 'weddings' },
		{ id: 'payments', label: 'Pembayaran', icon: 'payments' },
		{ id: 'affiliates', label: 'Afiliasi', icon: 'affiliates' },
		{ id: 'payouts', label: 'Pencairan', icon: 'payouts' }
	];
	const statusOptions: Partial<Record<Section, string[]>> = {
		payments: ['pending', 'paid', 'failed', 'expired', 'refunded'],
		affiliates: ['pending', 'active', 'rejected', 'suspended'],
		payouts: ['requested', 'processing', 'paid', 'rejected', 'failed']
	};
	const statusLabels: Record<string, string> = {
		pending: 'Menunggu',
		paid: 'Dibayar',
		failed: 'Gagal',
		expired: 'Kedaluwarsa',
		refunded: 'Dikembalikan',
		active: 'Aktif',
		rejected: 'Ditolak',
		suspended: 'Ditangguhkan',
		requested: 'Diajukan',
		processing: 'Diproses'
	};

	let authenticated = $state(false);
	let menuOpen = $state(false);
	let profileOpen = $state(false);
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let loginBusy = $state(false);
	let loginError = $state('');
	let section = $state<Section>('overview');
	let loading = $state(false);
	let error = $state('');
	let notice = $state('');
	let counts = $state<Record<string, number>>({});
	let overviewLoaded = $state(false);
	let users = $state<UserRecord[]>([]);
	let weddings = $state<WeddingRecord[]>([]);
	let payments = $state<PaymentRecord[]>([]);
	let affiliates = $state<AffiliateRecord[]>([]);
	let payouts = $state<PayoutRecord[]>([]);
	let page = $state(1);
	let totalPages = $state(1);
	let totalItems = $state(0);
	let search = $state('');
	let query = $state('');
	let status = $state('');
	let actionBusy = $state(false);
	let pendingAffiliate = $state<{ record: AffiliateRecord; status: AffiliateStatus } | null>(null);
	let pendingPayout = $state<{ record: PayoutRecord; status: PayoutStatus } | null>(null);
	let actionDetail = $state('');
	let actionError = $state('');
	let affiliateDialog: HTMLDialogElement;
	let actionDialog: HTMLDialogElement;
	let requestVersion = 0;

	const selectedLabel = $derived(
		navigation.find((item) => item.id === section)?.label ?? 'Beranda'
	);
	const profileInitial = $derived(
		(authenticated ? adminEmail().trim().charAt(0) || 'W' : 'W').toLocaleUpperCase('id-ID')
	);

	function navClass(id: Section) {
		const base = 'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition';
		return section === id
			? `${base} bg-linear-to-r from-[#9400ff] to-[#7200e8] font-semibold text-white`
			: `${base} font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900`;
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
	const currentItems = $derived(
		section === 'users'
			? users
			: section === 'weddings'
				? weddings
				: section === 'payments'
					? payments
					: section === 'affiliates'
						? affiliates
						: payouts
	);

	onMount(() => {
		// BaseAuthStore is intentionally memory-only: refreshing the page requires a fresh login.
		return () => logout();
	});

	async function signIn(event: SubmitEvent) {
		event.preventDefault();
		if (loginBusy) return;
		loginBusy = true;
		loginError = '';
		try {
			await login(email.trim(), password);
			password = '';
			authenticated = true;
			await refresh();
		} catch (cause) {
			loginError = errorMessage(cause);
		} finally {
			loginBusy = false;
		}
	}

	function signOut() {
		requestVersion++;
		if (affiliateDialog?.open) affiliateDialog.close();
		if (actionDialog?.open) actionDialog.close();
		logout();
		authenticated = false;
		menuOpen = false;
		profileOpen = false;
		password = '';
		pendingAffiliate = null;
		pendingPayout = null;
		actionDetail = '';
		actionError = '';
		error = '';
		notice = '';
	}

	async function refresh() {
		const version = ++requestVersion;
		loading = true;
		error = '';
		try {
			if (section === 'overview') {
				const result = await getOverview();
				if (version === requestVersion) {
					counts = result;
					overviewLoaded = true;
				}
				return;
			}
			if (section === 'users') {
				const result = await getRecords<UserRecord>('users', page, query, status);
				if (version === requestVersion) {
					users = result.items;
					totalPages = result.totalPages;
					totalItems = result.totalItems;
				}
			} else if (section === 'weddings') {
				const result = await getRecords<WeddingRecord>('weddings', page, query, status);
				if (version === requestVersion) {
					weddings = result.items;
					totalPages = result.totalPages;
					totalItems = result.totalItems;
				}
			} else if (section === 'payments') {
				const result = await getRecords<PaymentRecord>('payments', page, query, status);
				if (version === requestVersion) {
					payments = result.items;
					totalPages = result.totalPages;
					totalItems = result.totalItems;
				}
			} else if (section === 'affiliates') {
				const result = await getRecords<AffiliateRecord>('affiliates', page, query, status);
				if (version === requestVersion) {
					affiliates = result.items;
					totalPages = result.totalPages;
					totalItems = result.totalItems;
				}
			} else {
				const result = await getRecords<PayoutRecord>('payouts', page, query, status);
				if (version === requestVersion) {
					payouts = result.items;
					totalPages = result.totalPages;
					totalItems = result.totalItems;
				}
			}
		} catch (cause) {
			if (version !== requestVersion) return;
			if (isUnauthorized(cause)) {
				signOut();
				loginError = 'Sesi admin berakhir. Silakan masuk kembali.';
			} else {
				error = errorMessage(cause);
			}
		} finally {
			if (version === requestVersion) loading = false;
		}
	}

	function navigate(next: Section) {
		section = next;
		menuOpen = false;
		profileOpen = false;
		page = 1;
		search = '';
		query = '';
		status = '';
		notice = '';
		void refresh();
	}

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		query = search.trim();
		page = 1;
		void refresh();
	}

	function changeStatus(next: string) {
		status = next;
		page = 1;
		void refresh();
	}

	function changePage(next: number) {
		if (next < 1 || next > totalPages) return;
		page = next;
		void refresh();
	}

	function openAffiliate(record: AffiliateRecord, next: AffiliateStatus) {
		pendingAffiliate = { record, status: next };
		actionError = '';
		affiliateDialog.showModal();
	}

	async function updateAffiliate(event: SubmitEvent) {
		event.preventDefault();
		if (!pendingAffiliate || actionBusy) return;
		actionBusy = true;
		actionError = '';
		try {
			await setAffiliateStatus(pendingAffiliate.record, pendingAffiliate.status);
			notice = `Status afiliasi ${pendingAffiliate.record.code} diperbarui.`;
			affiliateDialog.close();
			await refresh();
		} catch (cause) {
			actionError = errorMessage(cause);
		} finally {
			actionBusy = false;
		}
	}

	function openPayout(record: PayoutRecord, next: PayoutStatus) {
		pendingPayout = { record, status: next };
		actionDetail = '';
		actionError = '';
		actionDialog.showModal();
	}

	async function updatePayout(event: SubmitEvent) {
		event.preventDefault();
		if (!pendingPayout || actionBusy) return;
		actionBusy = true;
		actionError = '';
		try {
			await setPayoutStatus(pendingPayout.record, pendingPayout.status, actionDetail.trim());
			notice = `Pencairan berhasil diubah menjadi ${statusLabels[pendingPayout.status]}.`;
			actionDialog.close();
			await refresh();
		} catch (cause) {
			actionError = errorMessage(cause);
		} finally {
			actionBusy = false;
		}
	}
</script>

<svelte:head>
	<title>Admin Wedez</title>
	<meta name="description" content="Dashboard internal Wedez" />
</svelte:head>

{#if !authenticated}
	<main class="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
		<section class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
			<div class="flex flex-col items-center">
				<img
					src="/logo-wedez.webp"
					alt="Wedez"
					width="256"
					height="256"
					class="size-20 object-contain"
				/>
				<h1 class="mt-4 text-2xl font-bold tracking-tight text-gray-900">Selamat datang</h1>
			</div>
			<form class="mt-8 space-y-5" onsubmit={signIn}>
				<div>
					<label for="email" class="mb-2 block text-sm font-medium text-gray-700">Email</label>
					<input
						id="email"
						type="email"
						autocomplete="username"
						required
						bind:value={email}
						class="admin-input w-full px-4 py-3 text-sm"
						placeholder="nama@email.com"
					/>
				</div>
				<div>
					<label for="password" class="mb-2 block text-sm font-medium text-gray-700"
						>Kata sandi</label
					>
					<div class="relative">
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							required
							bind:value={password}
							class="admin-input w-full px-4 py-3 pr-12 text-sm"
							placeholder="Masukkan kata sandi"
						/>
						<button
							type="button"
							aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
							aria-pressed={showPassword}
							onclick={() => (showPassword = !showPassword)}
							class="absolute inset-y-0 right-2 flex items-center justify-center px-2 text-violet-600 hover:text-violet-800"
						>
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								class="size-5"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6Z"
								/>
								<circle cx="12" cy="12" r="2.75" />
								{#if showPassword}<path stroke-linecap="round" d="m3 21 18-18" />{/if}
							</svg>
						</button>
					</div>
				</div>
				{#if loginError}
					<p role="alert" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
						{loginError}
					</p>
				{/if}
				<button
					type="submit"
					disabled={loginBusy}
					class="w-full rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
					>{loginBusy ? 'Sedang masuk…' : 'Masuk'}</button
				>
			</form>
		</section>
	</main>
{:else}
	<div class="min-h-screen bg-gray-100 text-gray-900">
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
					<button
						type="button"
						onclick={() => navigate('overview')}
						class="bg-linear-to-r from-[#9400ff] to-[#7200e8] bg-clip-text text-xl font-bold tracking-tight text-transparent"
						>WEDEZ</button
					>
				</div>
				<nav class="mt-7.5 flex flex-col gap-1" aria-label="Navigasi admin">
					{#each navigation as item (item.id)}
						<button
							type="button"
							onclick={() => navigate(item.id)}
							aria-current={section === item.id ? 'page' : undefined}
							class={navClass(item.id)}
						>
							<svg
								aria-hidden="true"
								class="size-5 shrink-0"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
							>
								{#if item.icon === 'overview'}
									<path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10v10h13V10M9 20v-6h6v6"></path>
								{:else if item.icon === 'users'}
									<circle cx="12" cy="8" r="3.5"></circle><path d="M5 20a7 7 0 0 1 14 0"></path>
								{:else if item.icon === 'weddings'}
									<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"
									></path>
								{:else if item.icon === 'payments'}
									<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18M7 15h4"
									></path>
								{:else if item.icon === 'affiliates'}
									<circle cx="9" cy="8" r="3"></circle><path
										d="M3 20a6 6 0 0 1 12 0M16 9h5M18.5 6.5v5"
									></path>
								{:else}
									<path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3"></path>
								{/if}
							</svg>
							{item.label}
						</button>
					{/each}
				</nav>
			</div>
		</aside>

		<div class="min-w-0 md:ml-57.5">
			<header
				class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:px-10"
			>
				<button
					type="button"
					aria-label="Buka menu"
					aria-expanded={menuOpen}
					onclick={() => {
						menuOpen = true;
						profileOpen = false;
					}}
					class="grid size-10 place-items-center rounded-xl bg-gray-100 text-gray-700 transition hover:bg-gray-200 md:hidden"
				>
					<span class="flex w-5 flex-col gap-1.5" aria-hidden="true"
						><span class="h-0.5 w-full rounded-full bg-current"></span><span
							class="h-0.5 w-full rounded-full bg-current"
						></span><span class="h-0.5 w-full rounded-full bg-current"></span></span
					>
				</button>
				<h1 class="text-xl font-bold tracking-tight">{selectedLabel}</h1>
				<div {@attach attachProfile} class="relative ml-auto">
					<button
						type="button"
						onclick={() => (profileOpen = !profileOpen)}
						aria-label="Buka menu profil admin"
						aria-haspopup="menu"
						aria-expanded={profileOpen}
						aria-controls={profileOpen ? 'admin-profile-menu' : undefined}
						class="grid size-10 cursor-pointer place-items-center rounded-full bg-linear-to-br from-[#9400ff] to-[#7200e8] text-sm font-bold text-white"
						>{profileInitial}</button
					>
					{#if profileOpen}
						<div
							id="admin-profile-menu"
							role="menu"
							aria-label="Menu profil admin"
							class="absolute top-full right-0 z-40 mt-2 w-62 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
						>
							<div class="px-2 pt-1 pb-3">
								<p class="text-sm font-bold">Administrator</p>
								<p class="mt-1 truncate text-sm text-gray-500">{adminEmail()}</p>
							</div>
							<button
								type="button"
								role="menuitem"
								onclick={signOut}
								class="flex w-full cursor-pointer items-center rounded-lg px-2 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50"
								>Keluar</button
							>
						</div>
					{/if}
				</div>
			</header>
			<main class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
				<div class="mx-auto w-full max-w-6xl min-w-0">
					{#if notice}<p
							role="status"
							class="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
						>
							{notice}
						</p>{/if}
					{#if error}<div
							role="alert"
							class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
						>
							<span>{error}</span><button
								type="button"
								onclick={refresh}
								class="font-semibold underline">Coba lagi</button
							>
						</div>{/if}
					{#if section === 'overview'}
						{#if loading}<p role="status" class="py-8 text-sm text-gray-500">
								Memuat ringkasan…
							</p>{:else if overviewLoaded}
							<div class="grid w-full min-w-0 gap-5 lg:grid-cols-2">
								{#each [{ label: 'Pengguna terdaftar', value: counts.users ?? 0, target: 'users' as Section, icon: 'users' }, { label: 'Undangan dibuat', value: counts.weddings ?? 0, target: 'weddings' as Section, icon: 'weddings' }] as card (card.target)}
									<button
										type="button"
										onclick={() => navigate(card.target)}
										class="flex min-w-0 items-center rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:border-violet-300"
									>
										<span
											class="grid size-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-600"
										>
											<svg
												aria-hidden="true"
												class="size-5"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
											>
												{#if card.icon === 'users'}<circle cx="12" cy="8" r="3.5"></circle><path
														d="M5 20a7 7 0 0 1 14 0"
													></path>{:else}<rect x="3" y="5" width="18" height="14" rx="2"
													></rect><path d="m4 7 8 6 8-6"></path>{/if}
											</svg>
										</span>
										<span class="ml-3 min-w-0"
											><span class="block text-sm font-medium text-gray-500">{card.label}</span
											><span class="mt-1 block text-xl font-bold text-gray-900"
												>{card.value.toLocaleString('id-ID')}</span
											></span
										>
									</button>
								{/each}
							</div>
							<section class="mt-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
								<div class="flex flex-wrap items-start justify-between gap-4">
									<div>
										<h2 class="text-sm font-medium text-gray-500">Perlu ditindaklanjuti</h2>
										<p class="mt-2 text-2xl font-bold text-gray-900">
											{(
												(counts.pendingAffiliates ?? 0) + (counts.requestedPayouts ?? 0)
											).toLocaleString('id-ID')} tugas menunggu
										</p>
									</div>
									<button
										type="button"
										onclick={refresh}
										disabled={loading}
										aria-label="Perbarui data"
										title="Perbarui data"
										class="group grid size-10 shrink-0 place-items-center rounded-xl border border-violet-500 text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
									>
										<svg
											aria-hidden="true"
											class="size-5 transition-transform duration-500 motion-safe:group-hover:rotate-180"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" />
											<path d="M21 3v5h-5" />
											<path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" />
											<path d="M8 16H3v5" />
										</svg>
									</button>
								</div>
								<div class="mt-5 grid gap-3 sm:grid-cols-2">
									<button
										type="button"
										onclick={() => navigate('affiliates')}
										class="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:bg-gray-50"
										><span class="text-sm font-medium text-gray-600"
											>Afiliasi menunggu persetujuan</span
										><span
											class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
											>{counts.pendingAffiliates ?? 0}</span
										></button
									>
									<button
										type="button"
										onclick={() => navigate('payouts')}
										class="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:bg-gray-50"
										><span class="text-sm font-medium text-gray-600">Pencairan diajukan</span><span
											class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
											>{counts.requestedPayouts ?? 0}</span
										></button
									>
								</div>
							</section>
							<section class="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
								<h2 class="font-bold text-gray-900">Ringkasan operasional</h2>
								<div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
									{#each [{ label: 'Pembayaran berhasil', value: counts.paid ?? 0, target: 'payments' as Section }, { label: 'Undangan Pro', value: counts.proWeddings ?? 0, target: 'weddings' as Section }, { label: 'Afiliasi aktif', value: counts.activeAffiliates ?? 0, target: 'affiliates' as Section }] as metric (metric.target)}
										<button
											type="button"
											onclick={() => navigate(metric.target)}
											class="min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-violet-300"
											><span class="block text-sm font-medium text-gray-500">{metric.label}</span
											><span class="mt-3 block text-2xl font-bold text-gray-900"
												>{metric.value.toLocaleString('id-ID')}</span
											></button
										>
									{/each}
								</div>
							</section>
						{:else}<p class="py-8 text-sm text-gray-500">Ringkasan belum tersedia.</p>{/if}
					{:else}
						<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
							<div>
								<h2 class="text-xl font-semibold">Daftar {selectedLabel.toLowerCase()}</h2>
								<p class="mt-1 text-sm text-gray-500">
									{totalItems.toLocaleString('id-ID')} data ditemukan.
								</p>
							</div>
							<button
								type="button"
								onclick={refresh}
								disabled={loading}
								aria-label="Perbarui data"
								title="Perbarui data"
								class="group grid size-10 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-60"
							>
								<svg
									aria-hidden="true"
									class={loading
										? 'size-5 motion-safe:animate-spin'
										: 'size-5 transition-transform duration-500 motion-safe:group-hover:rotate-180'}
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" />
									<path d="M21 3v5h-5" />
									<path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" />
									<path d="M8 16H3v5" />
								</svg>
							</button>
						</div>
						<div class="mb-5 flex flex-wrap gap-3">
							<form onsubmit={submitSearch} class="flex min-w-64 flex-1 gap-2">
								<label for="search" class="sr-only">Cari data</label><input
									id="search"
									type="search"
									bind:value={search}
									placeholder="Cari {selectedLabel.toLowerCase()}…"
									class="admin-input min-w-0 flex-1 px-4 py-3 text-sm"
								/><button
									type="submit"
									class="rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-4 py-3 text-sm font-semibold text-white"
									>Cari</button
								>
							</form>
							{#if statusOptions[section]}
								{#key section}
									<StatusFilter
										value={status}
										options={statusOptions[section] ?? []}
										labels={statusLabels}
										onchange={changeStatus}
									/>
								{/key}
							{/if}
						</div>
						<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
							{#if loading}<p role="status" class="p-10 text-center text-sm text-gray-500">
									Memuat data…
								</p>
							{:else if currentItems.length === 0}<p class="p-10 text-center text-sm text-gray-500">
									Belum ada data untuk pilihan ini.
								</p>
							{:else}<div class="overflow-x-auto">
									<table class="w-full min-w-180 text-left text-sm">
										<thead
											class="border-b border-gray-100 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase"
											><tr>
												{#if section === 'users'}<th class="px-5 py-4">Pengguna</th><th
														class="px-5 py-4">Verifikasi</th
													><th class="px-5 py-4">Area</th>
												{:else if section === 'weddings'}<th class="px-5 py-4">Undangan</th><th
														class="px-5 py-4">Pemilik</th
													><th class="px-5 py-4">Paket</th>
												{:else if section === 'payments'}<th class="px-5 py-4">Transaksi</th><th
														class="px-5 py-4">Nominal</th
													><th class="px-5 py-4">Status</th>
												{:else if section === 'affiliates'}<th class="px-5 py-4">Afiliasi</th><th
														class="px-5 py-4">Status</th
													>
												{:else}<th class="px-5 py-4">Pencairan</th><th class="px-5 py-4"
														>Rekening</th
													>{/if}
												<th class="px-5 py-4">Dibuat</th>
												{#if section === 'affiliates' || section === 'payouts'}<th
														class="px-5 py-4 text-right">Tindakan</th
													>{/if}
											</tr></thead
										><tbody class="divide-y divide-gray-100">
											{#if section === 'users'}{#each users as item (item.id)}<tr
														><td class="px-5 py-4"
															><p class="font-medium">{item.name || 'Tanpa nama'}</p>
															<p class="mt-0.5 text-xs text-gray-500">{item.email}</p></td
														><td class="px-5 py-4"
															><span
																class:!bg-emerald-50={item.verified}
																class:!text-emerald-700={item.verified}
																class="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
																>{item.verified ? 'Terverifikasi' : 'Belum'}</span
															></td
														><td class="px-5 py-4 text-gray-600">{item.home_area || '—'}</td><td
															class="px-5 py-4 whitespace-nowrap text-gray-500"
															>{dateTime(item.created)}</td
														></tr
													>{/each}
											{:else if section === 'weddings'}{#each weddings as item (item.id)}<tr
														><td class="px-5 py-4"
															><p class="font-medium">
																{item.groom_name || 'Mempelai'} & {item.bride_name || 'Mempelai'}
															</p>
															{#if item.slug}<a
																	href={`https://${item.slug}.wedez.id`}
																	target="_blank"
																	rel="noopener noreferrer"
																	class="mt-0.5 inline-block text-xs text-violet-700 hover:underline"
																	>{item.slug}.wedez.id ↗</a
																>{:else}<p class="mt-0.5 text-xs text-gray-400">
																	Belum diterbitkan
																</p>{/if}</td
														><td class="px-5 py-4 text-gray-600"
															>{item.expand?.owner?.email || item.owner || '—'}</td
														><td class="px-5 py-4"
															><span
																class:!bg-emerald-50={item.plan_tier === 'pro'}
																class:!text-emerald-700={item.plan_tier === 'pro'}
																class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
																>{item.plan_tier?.toUpperCase() || 'FREE'}</span
															></td
														><td class="px-5 py-4 whitespace-nowrap text-gray-500"
															>{dateTime(item.created)}</td
														></tr
													>{/each}
											{:else if section === 'payments'}{#each payments as item (item.id)}<tr
														><td class="px-5 py-4"
															><p class="font-medium">
																{item.expand?.wedding?.slug || item.wedding}
															</p>
															<p class="mt-0.5 font-mono text-xs text-gray-500">
																{item.provider_transaction_id}
															</p></td
														><td class="px-5 py-4 font-medium">{rupiah(item.amount)}</td><td
															class="px-5 py-4"
															><span
																class:!bg-emerald-50={item.status === 'paid'}
																class:!text-emerald-700={item.status === 'paid'}
																class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
																>{statusLabels[item.status] || item.status}</span
															></td
														><td class="px-5 py-4 whitespace-nowrap text-gray-500"
															>{dateTime(item.created)}</td
														></tr
													>{/each}
											{:else if section === 'affiliates'}{#each affiliates as item (item.id)}<tr
														><td class="px-5 py-4"
															><p class="font-medium">
																{item.expand?.user?.name || item.expand?.user?.email || item.user}
															</p>
															<p class="mt-0.5 font-mono text-xs text-gray-500">{item.code}</p></td
														><td class="px-5 py-4"
															><span
																class:!bg-emerald-50={item.status === 'active'}
																class:!text-emerald-700={item.status === 'active'}
																class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
																>{statusLabels[item.status] || item.status}</span
															></td
														><td class="px-5 py-4 whitespace-nowrap text-gray-500"
															>{dateTime(item.created)}</td
														><td class="px-5 py-4"
															><div class="flex flex-wrap justify-end gap-2">
																{#if item.status === 'pending' || item.status === 'rejected' || item.status === 'suspended'}<button
																		type="button"
																		onclick={() => openAffiliate(item, 'active')}
																		disabled={actionBusy}
																		class="rounded-lg bg-linear-to-r from-[#9400ff] to-[#7200e8] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
																		>Aktifkan</button
																	>{/if}{#if item.status === 'pending'}<button
																		type="button"
																		onclick={() => openAffiliate(item, 'rejected')}
																		disabled={actionBusy}
																		class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
																		>Tolak</button
																	>{/if}{#if item.status === 'active'}<button
																		type="button"
																		onclick={() => openAffiliate(item, 'suspended')}
																		disabled={actionBusy}
																		class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
																		>Tangguhkan</button
																	>{/if}
															</div></td
														></tr
													>{/each}
											{:else}{#each payouts as item (item.id)}<tr
														><td class="px-5 py-4"
															><p class="font-medium">{rupiah(item.amount)}</p>
															<p class="mt-0.5 text-xs text-gray-500">
																{item.expand?.affiliate?.code || item.affiliate} · {statusLabels[
																	item.status
																] || item.status}
															</p></td
														><td class="px-5 py-4"
															><p>{item.bank_name} · {item.account_number}</p>
															<p class="mt-0.5 text-xs text-gray-500">{item.account_name}</p></td
														><td class="px-5 py-4 whitespace-nowrap text-gray-500"
															>{dateTime(item.created)}</td
														><td class="px-5 py-4"
															><div class="flex flex-wrap justify-end gap-2">
																{#if item.status === 'requested'}<button
																		type="button"
																		onclick={() => openPayout(item, 'processing')}
																		class="rounded-lg bg-linear-to-r from-[#9400ff] to-[#7200e8] px-3 py-1.5 text-xs font-semibold text-white"
																		>Proses</button
																	><button
																		type="button"
																		onclick={() => openPayout(item, 'rejected')}
																		class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium"
																		>Tolak</button
																	>{:else if item.status === 'processing'}<button
																		type="button"
																		onclick={() => openPayout(item, 'paid')}
																		class="rounded-lg bg-linear-to-r from-[#9400ff] to-[#7200e8] px-3 py-1.5 text-xs font-semibold text-white"
																		>Tandai dibayar</button
																	><button
																		type="button"
																		onclick={() => openPayout(item, 'failed')}
																		class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium"
																		>Gagal</button
																	>{:else}<span class="text-xs text-gray-400">Selesai</span>{/if}
															</div></td
														></tr
													>{/each}{/if}
										</tbody>
									</table>
								</div>{/if}
						</div>
						{#if !loading && totalPages > 1}<div
								class="mt-5 flex items-center justify-between gap-4 text-sm"
							>
								<p class="text-gray-500">Halaman {page} dari {totalPages}</p>
								<div class="flex gap-2">
									<button
										type="button"
										onclick={() => changePage(page - 1)}
										disabled={page <= 1}
										class="rounded-lg border border-gray-200 bg-white px-3 py-2 disabled:opacity-40"
										>Sebelumnya</button
									><button
										type="button"
										onclick={() => changePage(page + 1)}
										disabled={page >= totalPages}
										class="rounded-lg border border-gray-200 bg-white px-3 py-2 disabled:opacity-40"
										>Berikutnya</button
									>
								</div>
							</div>{/if}
					{/if}
				</div>
			</main>
		</div>
	</div>
{/if}

<dialog
	bind:this={affiliateDialog}
	onclick={(event) =>
		event.target === event.currentTarget && !actionBusy && affiliateDialog.close()}
	oncancel={(event) => actionBusy && event.preventDefault()}
	aria-labelledby="affiliate-dialog-title"
	aria-describedby="affiliate-dialog-description"
	class="admin-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 shadow-xl"
>
	{#if pendingAffiliate}
		<form onsubmit={updateAffiliate} class="p-6 sm:p-8">
			<h2 id="affiliate-dialog-title" class="text-lg font-bold text-gray-900">
				Ubah status afiliasi?
			</h2>
			<p id="affiliate-dialog-description" class="mt-3 text-sm leading-6 text-gray-600">
				Status afiliasi <strong class="font-semibold text-gray-900"
					>{pendingAffiliate.record.code}</strong
				>
				akan diubah menjadi
				<strong class="font-semibold text-gray-900">{statusLabels[pendingAffiliate.status]}</strong
				>.
			</p>
			{#if actionError}
				<p role="alert" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
					{actionError}
				</p>
			{/if}
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={() => affiliateDialog.close()}
					disabled={actionBusy}
					class="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
					>Batal</button
				>
				<button
					type="submit"
					disabled={actionBusy}
					class="rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
					>{actionBusy ? 'Menyimpan…' : 'Ubah status'}</button
				>
			</div>
		</form>
	{/if}
</dialog>

<dialog
	bind:this={actionDialog}
	onclick={(event) => event.target === event.currentTarget && !actionBusy && actionDialog.close()}
	oncancel={(event) => actionBusy && event.preventDefault()}
	aria-labelledby="payout-dialog-title"
	aria-describedby="payout-dialog-description"
	class="admin-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 shadow-xl"
>
	{#if pendingPayout}<form onsubmit={updatePayout} class="p-6 sm:p-8">
			<h2 id="payout-dialog-title" class="text-lg font-bold text-gray-900">Konfirmasi pencairan</h2>
			<p id="payout-dialog-description" class="mt-3 text-sm leading-6 text-gray-600">
				{rupiah(pendingPayout.record.amount)} ke {pendingPayout.record.bank_name}
				{pendingPayout.record.account_number}. Status baru: {statusLabels[pendingPayout.status]}.
			</p>
			{#if pendingPayout.status === 'paid' || pendingPayout.status === 'rejected' || pendingPayout.status === 'failed'}<label
					for="action-detail"
					class="mt-5 block text-sm font-medium text-gray-700"
					>{pendingPayout.status === 'paid' ? 'Referensi transfer' : 'Alasan'}</label
				><input
					id="action-detail"
					required
					bind:value={actionDetail}
					class="admin-input mt-2 w-full px-4 py-3 text-sm"
				/>{/if}
			{#if actionError}<p
					role="alert"
					class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
				>
					{actionError}
				</p>{/if}
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={() => actionDialog.close()}
					disabled={actionBusy}
					class="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
					>Batal</button
				><button
					type="submit"
					disabled={actionBusy}
					class="rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
					>{actionBusy ? 'Menyimpan…' : 'Simpan status'}</button
				>
			</div>
		</form>{/if}
</dialog>

<style>
	.admin-dialog {
		opacity: 0;
		transform: translateY(14px) scale(0.98);
		transition:
			opacity 200ms ease,
			transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
			display 260ms,
			overlay 260ms;
		transition-behavior: allow-discrete;
	}

	.admin-dialog[open] {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.admin-dialog::backdrop {
		background: rgb(17 24 39 / 45%);
		backdrop-filter: blur(2px);
		opacity: 0;
		transition:
			opacity 220ms ease,
			display 260ms,
			overlay 260ms;
		transition-behavior: allow-discrete;
	}

	.admin-dialog[open]::backdrop {
		opacity: 1;
	}

	@starting-style {
		.admin-dialog[open] {
			opacity: 0;
			transform: translateY(14px) scale(0.98);
		}

		.admin-dialog[open]::backdrop {
			opacity: 0;
		}
	}

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
		.admin-dialog,
		.admin-dialog::backdrop,
		.sidebar,
		.drawer-backdrop {
			transition: none;
		}
	}
</style>
