<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ToggleSwitch from '#lib/components/ui/ToggleSwitch.svelte';
	import {
		PaymentError,
		createProPaymentSession,
		getProPaymentStatus
	} from '#lib/features/payments/index.js';
	import { toast } from '#lib/features/toast/index.js';
	import {
		getCurrentWedding,
		resetWeddingState,
		type WeddingPlanTier
	} from '#lib/features/weddings/index.js';

	async function getActivePlan(): Promise<WeddingPlanTier | null> {
		try {
			return (await getCurrentWedding()).plan_tier;
		} catch {
			return null;
		}
	}

	let activePlan = $state<WeddingPlanTier | null>(null);
	let isPlanLoading = $state(true);
	let isUpgrading = $state(false);
	let paymentError = $state('');
	let upgradeDialog: HTMLDialogElement | undefined;

	function openUpgradeDialog() {
		if (isUpgrading || activePlan === 'pro') return;
		paymentError = '';
		upgradeDialog?.showModal();
	}

	function closeUpgradeDialog() {
		if (isUpgrading) return;
		upgradeDialog?.close();
	}

	function activatePro() {
		activePlan = 'pro';
		resetWeddingState();
		toast.success('Pembayaran berhasil. Paket Pro sudah aktif.');
	}

	async function handleUpgrade() {
		if (isUpgrading || activePlan === 'pro') {
			return;
		}

		isUpgrading = true;
		paymentError = '';

		try {
			const result = await createProPaymentSession();

			if (result.plan_tier === 'pro') {
				activatePro();
				return;
			}

			if (!result.payment.checkout_url) {
				throw new PaymentError('Tautan pembayaran tidak tersedia.');
			}

			window.location.assign(result.payment.checkout_url);
		} catch (error) {
			paymentError =
				error instanceof PaymentError ? error.message : 'Pembayaran tidak dapat dimulai.';
			toast.error(paymentError);
		} finally {
			isUpgrading = false;
		}
	}

	async function confirmUpgrade(event: SubmitEvent) {
		event.preventDefault();
		await handleUpgrade();

		if (activePlan === 'pro') {
			upgradeDialog?.close();
		}
	}

	async function initializePlan() {
		const paymentResult = page.url.searchParams.get('payment');

		if (paymentResult) {
			replaceState('/user/setting', page.state);
		}

		activePlan = await getActivePlan();
		isPlanLoading = false;

		if (paymentResult === 'cancel') {
			toast.info('Pembayaran dibatalkan. Paket Anda belum berubah.');
			return;
		}

		if (activePlan === 'pro') {
			if (paymentResult === 'success') {
				activatePro();
			}

			return;
		}

		const showPaymentProgress = paymentResult === 'success';
		isUpgrading = showPaymentProgress;

		try {
			const result = await getProPaymentStatus();

			if (result.plan_tier === 'pro' && result.payment.status === 'paid') {
				activatePro();
			} else if (paymentResult === 'success') {
				toast.info('Pembayaran masih diproses. Silakan muat ulang beberapa saat lagi.');
			}
		} catch (error) {
			if (paymentResult === 'success') {
				paymentError =
					error instanceof PaymentError ? error.message : 'Status pembayaran gagal diperiksa.';
				toast.error(paymentError);
			}
		} finally {
			if (showPaymentProgress) {
				isUpgrading = false;
			}
		}
	}

	onMount(() => {
		void initializePlan();
	});

	const notifications = $state([
		{
			id: 'rsvp',
			label: 'Notifikasi RSVP',
			description: 'Dapatkan pemberitahuan ketika tamu mengisi RSVP.',
			enabled: true
		},
		{
			id: 'email',
			label: 'Email informasi',
			description: 'Terima pembaruan akun dan informasi paket melalui email.',
			enabled: true
		}
	]);
</script>

<svelte:head>
	<title>Pengaturan — Wedez</title>
	<meta name="description" content="Kelola profil dan pengaturan akun Wedez." />
</svelte:head>

<section class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
	<dialog
		bind:this={upgradeDialog}
		onclick={(event) => event.target === event.currentTarget && closeUpgradeDialog()}
		oncancel={(event) => isUpgrading && event.preventDefault()}
		class="upgrade-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-3xl border border-gray-200 bg-white p-0 shadow-2xl"
	>
		<form onsubmit={confirmUpgrade}>
			<div class="relative overflow-hidden bg-gray-950 px-5 py-6 text-white sm:px-7 sm:py-7">
				<div
					class="absolute -top-16 -right-12 size-44 rounded-full bg-emerald-400/20 blur-3xl"
				></div>
				<div class="relative flex items-start justify-between gap-5">
					<div>
						<span
							class="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-300 uppercase"
						>
							Upgrade Pro
						</span>
						<h2 class="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
							Buka semua fitur Wedez
						</h2>
						<p class="mt-2 max-w-xl text-sm leading-6 text-gray-300">
							Bandingkan paketmu sebelum melanjutkan ke pembayaran aman melalui Xendit.
						</p>
					</div>
					<button
						type="button"
						onclick={closeUpgradeDialog}
						disabled={isUpgrading}
						aria-label="Tutup dialog upgrade"
						class="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-gray-300 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
					>
						<svg
							aria-hidden="true"
							class="size-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="m6 6 12 12M18 6 6 18"></path>
						</svg>
					</button>
				</div>
			</div>

			<div class="p-5 sm:p-7">
				<div class="grid gap-4 sm:grid-cols-2">
					<section class="rounded-2xl border border-gray-200 bg-gray-50 p-5">
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-xs font-semibold tracking-wider text-gray-500 uppercase">Saat ini</p>
								<h3 class="mt-1 text-xl font-bold text-gray-900">Free</h3>
							</div>
							<p class="text-xl font-bold text-gray-900">Rp0</p>
						</div>
						<ul class="mt-5 space-y-3 text-sm text-gray-600">
							{#each ['Tema Terbatas', 'Tamu Terbatas', 'Ada Watermark'] as feature (feature)}
								<li class="flex items-center gap-3">
									<span
										class="grid size-5 place-items-center rounded-full bg-gray-200 text-xs text-gray-500"
										aria-hidden="true">−</span
									>
									{feature}
								</li>
							{/each}
						</ul>
					</section>

					<section
						class="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-5 shadow-sm"
					>
						<span
							class="absolute top-0 right-0 rounded-bl-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold tracking-wide text-white uppercase"
							>Pilihan terbaik</span
						>
						<div>
							<p class="text-xs font-semibold tracking-wider text-emerald-700 uppercase">Upgrade</p>
							<h3 class="mt-1 text-xl font-bold text-gray-950">Pro</h3>
							<p class="mt-2 text-2xl font-bold tracking-tight text-gray-950">Rp50.000</p>
						</div>
						<ul class="mt-5 space-y-3 text-sm font-medium text-gray-800">
							{#each ['Semua Tema Premium', 'Unlimited Tamu', 'No Watermark'] as feature (feature)}
								<li class="flex items-center gap-3">
									<span
										class="grid size-5 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white"
										aria-hidden="true">✓</span
									>
									{feature}
								</li>
							{/each}
						</ul>
					</section>
				</div>

				{#if paymentError}
					<p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
						{paymentError}
					</p>
				{/if}

				<div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onclick={closeUpgradeDialog}
						disabled={isUpgrading}
						class="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isUpgrading}
						aria-busy={isUpgrading}
						class="rounded-xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isUpgrading ? 'Menyiapkan pembayaran...' : 'Lanjut Bayar Rp50.000'}
					</button>
				</div>
			</div>
		</form>
	</dialog>

	<div
		class="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]"
	>
		<div class="space-y-5">
			<section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
				<div
					class="flex flex-col gap-5 border-b border-gray-200 pb-6 min-[420px]:flex-row min-[420px]:items-center"
				>
					<div
						class="grid size-20 shrink-0 place-items-center rounded-full bg-gray-900 text-2xl font-bold text-white"
					>
						W
					</div>
					<div>
						<h1 class="text-xl font-bold text-gray-900">Profil akun</h1>
						<p class="mt-1 text-sm text-gray-500">
							Informasi yang digunakan untuk mengelola akun Wedez.
						</p>
						<button
							type="button"
							class="mt-3 text-sm font-semibold text-gray-900 hover:text-gray-600"
						>
							Ganti foto
						</button>
					</div>
				</div>

				<div class="mt-6 grid gap-5 sm:grid-cols-2">
					<label class="block text-sm font-medium text-gray-700">
						Nama lengkap
						<input
							autocomplete="name"
							class="field mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
							value="Nama Pengguna"
						/>
					</label>
					<label class="block text-sm font-medium text-gray-700">
						Nomor WhatsApp
						<input
							autocomplete="tel"
							class="field mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
							placeholder="08xx xxxx xxxx"
						/>
					</label>
					<label class="block text-sm font-medium text-gray-700 sm:col-span-2">
						Email
						<input
							type="email"
							autocomplete="email"
							class="field mt-2 w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-500"
							value="nama@email.com"
							readonly
						/>
					</label>
				</div>

				<div class="mt-6 flex justify-end">
					<button
						type="button"
						class="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
					>
						Simpan profil
					</button>
				</div>
			</section>

			<section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
				<div>
					<h2 class="text-lg font-bold text-gray-900">Notifikasi</h2>
					<p class="mt-1 text-sm text-gray-500">Pilih informasi yang ingin kamu terima.</p>
				</div>

				<div class="mt-5 divide-y divide-gray-200">
					{#each notifications as notification (notification.id)}
						<ToggleSwitch
							bind:checked={notification.enabled}
							label={notification.label}
							description={notification.description}
						/>
					{/each}
				</div>
			</section>
		</div>

		<div class="space-y-5">
			<section
				aria-busy={isPlanLoading}
				class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-sm font-medium text-gray-500">Paket aktif</p>
						{#if isPlanLoading}
							<div
								class="mt-2 h-8 w-20 animate-pulse rounded-lg bg-gray-200"
								aria-hidden="true"
							></div>
						{:else}
							<h2 class="mt-2 text-2xl font-bold tracking-tight text-gray-900">
								{activePlan === 'pro' ? 'Pro' : activePlan === 'free' ? 'Gratis' : 'Tidak tersedia'}
							</h2>
						{/if}
					</div>
					{#if isPlanLoading}
						<span class="h-6 w-14 animate-pulse rounded-full bg-gray-200" aria-hidden="true"></span>
					{:else}
						<span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
							>Aktif</span
						>
					{/if}
				</div>
				<ul class="mt-5 space-y-3 text-sm text-gray-600">
					{#if isPlanLoading}
						{#each ['w-36', 'w-28', 'w-32'] as width (width)}
							<li
								class={`h-5 animate-pulse rounded-md bg-gray-200 ${width}`}
								aria-hidden="true"
							></li>
						{/each}
					{:else if activePlan === 'pro'}
						<li>Semua Tema Premium</li>
						<li>Unlimited Tamu</li>
						<li>No Watermark</li>
					{:else}
						<li>Tema Terbatas</li>
						<li>Tamu Terbatas</li>
						<li>Ada Watermark</li>
					{/if}
				</ul>
				{#if isPlanLoading}
					<div
						class="mt-6 h-12 w-full animate-pulse rounded-xl bg-gray-200"
						aria-hidden="true"
					></div>
				{:else if activePlan === 'pro'}
					<div
						class="mt-6 w-full rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700"
					>
						Paket Pro aktif
					</div>
				{:else}
					<button
						type="button"
						disabled={isUpgrading}
						aria-busy={isUpgrading}
						onclick={openUpgradeDialog}
						class="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{isUpgrading ? 'Menyiapkan pembayaran...' : 'Upgrade Pro'}
					</button>
					{#if paymentError}
						<p class="mt-3 text-sm leading-6 text-red-600" role="alert">{paymentError}</p>
					{/if}
				{/if}
			</section>

			<section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
				<h2 class="text-lg font-bold text-gray-900">Keamanan</h2>
				<p class="mt-1 text-sm text-gray-500">Perbarui kata sandi akun secara berkala.</p>

				<div class="mt-5 space-y-4">
					<label class="block text-sm font-medium text-gray-700">
						Kata sandi saat ini
						<input
							type="password"
							autocomplete="current-password"
							class="field mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
						/>
					</label>
					<label class="block text-sm font-medium text-gray-700">
						Kata sandi baru
						<input
							type="password"
							autocomplete="new-password"
							class="field mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
						/>
					</label>
				</div>
				<button
					type="button"
					class="mt-5 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
				>
					Ubah kata sandi
				</button>
			</section>

			<section class="rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
				<h2 class="text-lg font-bold text-gray-900">Hapus akun</h2>
				<p class="mt-2 text-sm leading-6 text-gray-500">
					Semua undangan dan data tamu akan dihapus secara permanen.
				</p>
				<button
					type="button"
					class="mt-5 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
				>
					Hapus akun
				</button>
			</section>
		</div>
	</div>
</section>

<style>
	.upgrade-dialog {
		opacity: 0;
		transform: translateY(16px) scale(0.98);
		transition:
			opacity 200ms ease,
			transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
			display 260ms,
			overlay 260ms;
		transition-behavior: allow-discrete;
	}

	.upgrade-dialog[open] {
		opacity: 1;
		transform: translateY(0) scale(1);
	}

	.upgrade-dialog::backdrop {
		background: rgb(17 24 39 / 55%);
		backdrop-filter: blur(4px);
		opacity: 0;
		transition:
			opacity 220ms ease,
			display 260ms,
			overlay 260ms;
		transition-behavior: allow-discrete;
	}

	.upgrade-dialog[open]::backdrop {
		opacity: 1;
	}

	@starting-style {
		.upgrade-dialog[open] {
			opacity: 0;
			transform: translateY(16px) scale(0.98);
		}

		.upgrade-dialog[open]::backdrop {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.upgrade-dialog,
		.upgrade-dialog::backdrop {
			transition: none;
		}
	}
</style>
