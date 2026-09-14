<script lang="ts">
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		PaymentError,
		createProPaymentSession,
		getProPaymentStatus
	} from '#lib/features/payments/index.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	import { getWeddingContext, type WeddingPlanTier } from '#lib/features/weddings/index.js';

	const DEFAULT_PRO_PRICE = 50_000;
	const proFeatures = ['Semua Tema Premium', 'Unlimited Tamu', 'No Watermark'];
	const toast = getToastContext();
	const wedding = getWeddingContext();

	function formatRupiah(amount: number): string {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(amount);
	}

	async function getActivePlan(): Promise<WeddingPlanTier | null> {
		try {
			return (await wedding.getCurrentWedding()).plan_tier;
		} catch {
			return null;
		}
	}

	let activePlan = $state<WeddingPlanTier | null>(null);
	let isPlanLoading = $state(true);
	let isUpgrading = $state(false);
	let isCouponOpen = $state(false);
	let couponCode = $state('');
	let paymentError = $state('');
	let proPrice = $state(DEFAULT_PRO_PRICE);
	let formattedProPrice = $derived(formatRupiah(proPrice));
	let checkoutLabel = $derived(
		isPlanLoading
			? 'Memuat paket...'
			: isUpgrading
				? 'Menyiapkan pembayaran...'
				: activePlan === 'pro'
					? 'Paket Pro sudah aktif'
					: 'Lanjutkan pembayaran'
	);
	let checkoutDisabled = $derived(isPlanLoading || isUpgrading || activePlan === 'pro');

	function toggleCouponForm() {
		isCouponOpen = !isCouponOpen;
	}

	async function finishUpgrade(showSuccessToast = true) {
		activePlan = 'pro';
		wedding.reset();

		if (showSuccessToast) {
			toast.success('Pembayaran berhasil. Paket Pro sudah aktif.');
		}

		await goto('/user/dashboard', { replaceState: true, invalidateAll: true });
	}

	async function handleUpgrade() {
		if (checkoutDisabled) return;
		isUpgrading = true;
		paymentError = '';

		try {
			const result = await createProPaymentSession();
			proPrice = result.payment.amount || DEFAULT_PRO_PRICE;

			if (result.plan_tier === 'pro') {
				await finishUpgrade(false);
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

	async function initializePlan() {
		const paymentResult = page.url.searchParams.get('payment');
		const duitkuResultCode = page.url.searchParams.get('resultCode');
		const returnedFromPayment = paymentResult !== null || duitkuResultCode !== null;
		const paymentSucceeded =
			duitkuResultCode !== null ? duitkuResultCode === '00' : paymentResult === 'success';
		const paymentCanceled =
			duitkuResultCode === '02' || paymentResult === 'cancelled' || paymentResult === 'canceled';

		if (returnedFromPayment) replaceState('/upgrade', page.state);

		activePlan = await getActivePlan();
		isPlanLoading = false;

		if (returnedFromPayment && paymentCanceled) {
			toast.info('Pembayaran dibatalkan. Paket Anda belum berubah.');
			return;
		}

		if (activePlan === 'pro') {
			await finishUpgrade(paymentSucceeded);
			return;
		}

		const showPaymentProgress = returnedFromPayment && !paymentCanceled;
		isUpgrading = showPaymentProgress;

		try {
			const result = await getProPaymentStatus();
			proPrice = result.payment.amount || DEFAULT_PRO_PRICE;

			if (result.plan_tier === 'pro' && result.payment.status === 'paid') {
				await finishUpgrade();
			} else if (returnedFromPayment) {
				toast.info('Pembayaran masih diproses. Silakan muat ulang beberapa saat lagi.');
			}
		} catch (error) {
			if (returnedFromPayment) {
				paymentError =
					error instanceof PaymentError ? error.message : 'Status pembayaran gagal diperiksa.';
				toast.error(paymentError);
			}
		} finally {
			if (showPaymentProgress) isUpgrading = false;
		}
	}

	onMount(() => {
		void initializePlan();
	});
</script>

<svelte:head>
	<title>Upgrade Pro — Wedez</title>
	<meta
		name="description"
		content="Upgrade undangan digital Wedez ke paket Pro melalui pembayaran aman Duitku."
	/>
</svelte:head>

<main class="min-h-screen bg-gray-100">
	<header class="border-b border-gray-200 bg-white px-4 sm:px-6">
		<div class="mx-auto flex h-18 w-full max-w-6xl items-center">
			<a href="/user/dashboard" class="text-xl font-bold tracking-tight text-gray-950">Wedez</a>
		</div>
	</header>

	<section class="px-4 pt-7 pb-44 sm:px-6 sm:pt-8 lg:px-10 lg:py-10">
		<div class="mx-auto w-full max-w-6xl">
			<div class="mb-5 lg:mb-6">
				<a
					href="/user/dashboard"
					class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 transition hover:text-gray-950"
				>
					<svg
						aria-hidden="true"
						class="size-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m15 18-6-6 6-6"></path>
					</svg>
					Kembali ke dashboard
				</a>
			</div>

			<div
				class="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)] lg:gap-6"
			>
				<div class="space-y-5">
					<section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
						<div class="p-5 sm:p-6">
							<div class="flex items-center gap-4">
								<span
									class="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"
								>
									<svg
										aria-hidden="true"
										class="size-5.5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="m4 15 4-7 4 5 4-8 4 10"></path><path d="M5 19h14"></path>
									</svg>
								</span>
								<div>
									<h2 class="font-bold text-gray-950">Paket Wedez Pro</h2>
									<p class="mt-0.5 text-sm text-gray-500">Upgrade undangan digital</p>
								</div>
							</div>

							<div class="mt-6">
								<p class="text-sm font-semibold text-gray-800">Akses paket</p>
								<div
									class="mt-2 flex min-h-13 items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3"
								>
									<span class="text-sm font-medium text-gray-800">Selamanya</span>
									<span
										class="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700"
									>
										<svg
											aria-hidden="true"
											class="size-4"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"><path d="m5 12 4 4L19 6"></path></svg
										>
										Sekali bayar
									</span>
								</div>
							</div>

							<div class="mt-5 flex flex-wrap items-center justify-between gap-3">
								<div>
									<p class="text-sm text-gray-500">Total harga</p>
									<p class="mt-1 text-xs text-gray-500">Tidak ada biaya langganan bulanan.</p>
								</div>
								{#if isPlanLoading}
									<span class="h-8 w-28 animate-pulse rounded-lg bg-gray-200" aria-hidden="true"
									></span>
								{:else}
									<strong class="text-2xl tracking-tight text-gray-950">{formattedProPrice}</strong>
								{/if}
							</div>
						</div>

						<div class="border-t border-gray-200 px-5 py-5 sm:px-6">
							<p class="text-sm font-semibold text-gray-900">Yang Anda dapatkan</p>
							<ul class="mt-4 grid gap-3 sm:grid-cols-3">
								{#each proFeatures as feature (feature)}
									<li class="flex items-center gap-2.5 text-sm font-medium text-gray-700">
										<span
											class="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"
											aria-hidden="true"
										>
											<svg
												class="size-3"
												viewBox="0 0 12 12"
												fill="none"
												stroke="currentColor"
												stroke-width="2"><path d="m2 6 2.5 2.5L10 3"></path></svg
											>
										</span>
										{feature}
									</li>
								{/each}
							</ul>
						</div>
					</section>

					<section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
						<div class="flex items-start gap-3">
							<span
								class="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-600"
							>
								<svg
									aria-hidden="true"
									class="size-4.5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path
										d="m9 12 2 2 4-4"
									></path>
								</svg>
							</span>
							<div>
								<h2 class="text-sm font-bold text-gray-900">Pembayaran aman</h2>
								<p class="mt-1 text-sm leading-6 text-gray-500">
									Anda akan diarahkan ke halaman pembayaran Duitku. Paket Pro aktif otomatis setelah
									pembayaran terverifikasi.
								</p>
							</div>
						</div>
					</section>

					{#if paymentError}
						<p
							class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
							role="alert"
						>
							{paymentError}
						</p>
					{/if}
				</div>

				<aside
					class="sticky top-22 hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:block"
				>
					<h2 class="text-lg font-bold text-gray-950">Daftar pesanan</h2>
					<div class="mt-5 border-b border-gray-200 pb-5">
						<div class="flex items-start justify-between gap-4">
							<div>
								<p class="text-sm font-bold text-gray-900">Paket Wedez Pro</p>
								<p class="mt-1 text-sm text-gray-500">Akses selamanya</p>
							</div>
							{#if isPlanLoading}<span
									class="h-5 w-20 animate-pulse rounded bg-gray-200"
									aria-hidden="true"
								></span>{:else}<span class="text-sm font-semibold text-gray-900"
									>{formattedProPrice}</span
								>{/if}
						</div>
						<div class="mt-4 flex items-center justify-between gap-4 text-sm">
							<span class="text-gray-500">Biaya layanan</span><span
								class="font-semibold text-gray-900">Rp0</span
							>
						</div>
					</div>
					<div class="flex items-center justify-between gap-4 py-5">
						<span class="font-bold text-gray-950">Total</span>
						{#if isPlanLoading}<span
								class="h-7 w-28 animate-pulse rounded bg-gray-200"
								aria-hidden="true"
							></span>{:else}<strong class="text-xl text-gray-950">{formattedProPrice}</strong>{/if}
					</div>
					<button
						type="button"
						aria-expanded={isCouponOpen}
						aria-controls="desktop-coupon-form"
						onclick={toggleCouponForm}
						class="cursor-pointer text-left text-sm font-semibold text-violet-700"
					>
						Punya kode kupon?
					</button>
					{#if isCouponOpen}
						<form
							id="desktop-coupon-form"
							onsubmit={(event) => event.preventDefault()}
							class="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3"
						>
							<label for="desktop-coupon-code" class="sr-only">Kode kupon</label>
							<input
								id="desktop-coupon-code"
								bind:value={couponCode}
								type="text"
								autocomplete="off"
								spellcheck="false"
								class="min-w-0 rounded-xl border-2 border-violet-600 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-700"
							/>
							<button
								type="submit"
								class="cursor-pointer rounded-xl border border-violet-600 bg-white px-4 py-3 text-sm font-semibold text-violet-700"
							>
								Tambahkan
							</button>
						</form>
					{/if}
					<button
						type="button"
						disabled={checkoutDisabled}
						aria-busy={isUpgrading}
						onclick={handleUpgrade}
						class="mt-5 w-full cursor-pointer rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
						>{checkoutLabel}</button
					>
					<p class="mt-4 text-center text-xs leading-5 text-gray-500">
						Dengan melanjutkan, Anda menyetujui pembayaran satu kali untuk paket Pro.
					</p>
				</aside>
			</div>
		</div>
	</section>
</main>

<div
	class="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border border-b-0 border-gray-300 bg-white p-4 shadow-[0_-10px_35px_rgba(17,24,39,0.12)] lg:hidden"
>
	<div class="mx-auto max-w-lg">
		<div class="mb-4 flex items-center justify-between gap-4">
			<span class="font-bold text-gray-950">Total</span>
			{#if isPlanLoading}<span class="h-6 w-28 animate-pulse rounded bg-gray-200" aria-hidden="true"
				></span>{:else}<strong class="text-lg text-gray-950">{formattedProPrice}</strong>{/if}
		</div>
		<div class="mb-4">
			<button
				type="button"
				aria-expanded={isCouponOpen}
				aria-controls="mobile-coupon-form"
				onclick={toggleCouponForm}
				class="cursor-pointer text-left text-sm font-semibold text-violet-700"
			>
				Punya kode kupon?
			</button>
			{#if isCouponOpen}
				<form
					id="mobile-coupon-form"
					onsubmit={(event) => event.preventDefault()}
					class="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3"
				>
					<label for="mobile-coupon-code" class="sr-only">Kode kupon</label>
					<input
						id="mobile-coupon-code"
						bind:value={couponCode}
						type="text"
						autocomplete="off"
						spellcheck="false"
						class="min-w-0 rounded-xl border-2 border-violet-600 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-violet-700"
					/>
					<button
						type="submit"
						class="cursor-pointer rounded-xl border border-violet-600 bg-white px-4 py-3 text-sm font-semibold text-violet-700"
					>
						Tambahkan
					</button>
				</form>
			{/if}
		</div>
		<button
			type="button"
			disabled={checkoutDisabled}
			aria-busy={isUpgrading}
			onclick={handleUpgrade}
			class="w-full cursor-pointer rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
			>{checkoutLabel}</button
		>
	</div>
</div>
