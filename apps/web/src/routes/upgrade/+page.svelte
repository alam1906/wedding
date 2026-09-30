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
	import CouponForm from '#lib/features/payments/components/CouponForm.svelte';
	import { getPaymentQuote } from '#lib/features/payments/api/payment.js';
	import type { PaymentQuote, ProPayment } from '#lib/features/payments/model/payment.js';

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
	let couponDialog = $state<HTMLDialogElement>();
	let couponCode = $state('');
	let paymentError = $state('');
	let proPrice = $state(DEFAULT_PRO_PRICE);
	let quote = $state<PaymentQuote | null>(null);
	let couponError = $state('');
	let isCouponValidating = $state(false);
	let isCheckingPayment = $state(false);
	let hasPrice = $state(false);
	let pendingPayment = $state<ProPayment | null>(null);
	let couponApplied = $derived(
		Boolean(quote && quote.coupon_code === couponCode.trim().toUpperCase())
	);
	let pendingDiffers = $derived(
		pendingPayment !== null &&
			(pendingPayment.coupon_code !== (couponApplied && quote ? quote.coupon_code : '') ||
				pendingPayment.amount !== (couponApplied && quote ? quote.amount : proPrice))
	);
	let pendingExpiry = $derived(
		pendingPayment && Number.isFinite(Date.parse(pendingPayment.expires_at))
			? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
					new Date(pendingPayment.expires_at)
				)
			: ''
	);
	let formattedProPrice = $derived(formatRupiah(couponApplied && quote ? quote.amount : proPrice));
	let checkoutLabel = $derived(
		isPlanLoading
			? 'Memuat paket...'
			: isUpgrading
				? 'Menyiapkan pembayaran...'
				: activePlan === 'pro'
					? 'Paket Pro sudah aktif'
					: pendingDiffers
						? 'Tagihan sebelumnya masih aktif'
						: 'Lanjutkan pembayaran'
	);
	let checkoutDisabled = $derived(
		isPlanLoading ||
			!hasPrice ||
			isUpgrading ||
			isCouponValidating ||
			isCheckingPayment ||
			pendingDiffers ||
			activePlan === 'pro' ||
			Boolean(couponCode.trim() && !couponApplied)
	);
	let couponDialogBusy = $derived(isUpgrading || isCouponValidating);

	function editCoupon(value: string) {
		couponCode = value.toUpperCase();
		quote = null;
		couponError = '';
	}

	async function applyCoupon() {
		if (isCouponValidating || isUpgrading) return;
		isCouponValidating = true;
		couponError = '';
		quote = null;
		try {
			const result = await getPaymentQuote(couponCode);
			couponCode = result.coupon_code;
			proPrice = result.original_amount;
			quote = result;
			hasPrice = true;
		} catch (error) {
			couponError = error instanceof PaymentError ? error.message : 'Kupon gagal diperiksa.';
		} finally {
			isCouponValidating = false;
		}
	}

	function toggleCouponForm() {
		if (isUpgrading || isCouponValidating) return;
		isCouponOpen = !isCouponOpen;
	}

	function openCouponDialog() {
		if (
			isPlanLoading ||
			isUpgrading ||
			isCouponValidating ||
			isCheckingPayment ||
			activePlan === 'pro'
		) {
			return;
		}
		couponDialog?.showModal();
	}

	function continueToPayment() {
		if (checkoutDisabled) return;
		if (couponApplied) {
			void handleUpgrade();
			return;
		}
		openCouponDialog();
	}

	function closeCouponDialog() {
		if (!couponDialogBusy) couponDialog?.close();
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
		if (checkoutDisabled || (!couponApplied && !couponDialog?.open)) return;
		isUpgrading = true;
		paymentError = '';

		let redirecting = false;
		try {
			const result = await createProPaymentSession(couponApplied && quote ? quote.coupon_code : '');
			proPrice = result.payment.original_amount;

			if (result.plan_tier === 'pro') {
				await finishUpgrade(false);
				return;
			}

			if (!result.payment.checkout_url) {
				throw new PaymentError('Tautan pembayaran tidak tersedia.');
			}

			redirecting = true;
			window.location.assign(result.payment.checkout_url);
		} catch (error) {
			redirecting = false;
			paymentError =
				error instanceof PaymentError ? error.message : 'Pembayaran tidak dapat dimulai.';
			toast.error(paymentError);
		} finally {
			if (!redirecting) isUpgrading = false;
		}
	}

	async function checkPendingPayment() {
		if (isCheckingPayment) return;
		isCheckingPayment = true;
		try {
			const result = await getProPaymentStatus();
			pendingPayment = result.payment.status === 'pending' ? result.payment : null;
			if (result.plan_tier === 'pro') {
				await finishUpgrade();
			} else if (pendingPayment) {
				toast.info('Tagihan sebelumnya masih aktif. Periksa lagi setelah tagihan berakhir.');
			} else {
				toast.success('Tagihan sebelumnya sudah berakhir. Kamu bisa melanjutkan dengan kupon.');
			}
		} catch (error) {
			toast.error(
				error instanceof PaymentError ? error.message : 'Status pembayaran gagal diperiksa.'
			);
		} finally {
			isCheckingPayment = false;
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

		if (activePlan === 'pro') {
			await finishUpgrade(paymentSucceeded);
			return;
		}

		const showPaymentProgress = returnedFromPayment;
		isUpgrading = showPaymentProgress;

		try {
			const result = await getProPaymentStatus();
			pendingPayment = result.payment.status === 'pending' ? result.payment : null;
			proPrice = result.payment.original_amount;
			hasPrice = true;
			if (result.payment.status === 'pending' && result.payment.coupon_code) {
				couponCode = result.payment.coupon_code;
				quote = {
					original_amount: proPrice,
					amount: result.payment.amount,
					discount_amount: result.payment.discount_amount,
					discount_percent: 10,
					coupon_code: couponCode
				};
				isCouponOpen = true;
			}

			if (result.plan_tier === 'pro' && result.payment.status === 'paid') {
				await finishUpgrade();
			} else if (returnedFromPayment && paymentCanceled && !pendingPayment) {
				toast.info('Tagihan sebelumnya sudah berakhir. Kamu bisa memakai kupon sekarang.');
			} else if (returnedFromPayment && paymentCanceled) {
				toast.info('Kamu sudah kembali dari Duitku, tetapi tagihan sebelumnya masih aktif.');
			} else if (returnedFromPayment) {
				toast.info('Pembayaran masih diproses. Silakan muat ulang beberapa saat lagi.');
			}
		} catch (error) {
			paymentError =
				error instanceof PaymentError
					? error.message
					: 'Harga dan status pembayaran gagal dimuat. Muat ulang halaman untuk mencoba lagi.';
			toast.error(paymentError);
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

<dialog
	id="coupon-checkout-dialog"
	bind:this={couponDialog}
	aria-labelledby="coupon-checkout-title"
	onclick={(event) => event.target === event.currentTarget && closeCouponDialog()}
	oncancel={(event) => couponDialogBusy && event.preventDefault()}
	class="coupon-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl"
>
	<div class="p-5 sm:p-6">
		<div class="flex items-start justify-between gap-4">
			<div>
				<h2 id="coupon-checkout-title" class="text-xl font-bold text-gray-950">
					Punya kode kupon?
				</h2>
			</div>
			<button
				type="button"
				onclick={closeCouponDialog}
				disabled={couponDialogBusy}
				aria-label="Tutup dialog kupon"
				class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-gray-100 text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<svg
					aria-hidden="true"
					class="size-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<path d="m6 6 12 12M18 6 6 18"></path>
				</svg>
			</button>
		</div>

		<div class="mt-5 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
			<p class="text-sm font-semibold text-gray-900">Kode kupon</p>
			<CouponForm
				id="checkout-coupon-form"
				code={couponCode}
				busy={isCouponValidating}
				locked={isUpgrading}
				applied={couponApplied}
				error={couponError}
				oninput={editCoupon}
				onapply={applyCoupon}
			/>
		</div>
		{#if couponCode.trim() && !couponApplied}
			<p class="mt-3 text-xs leading-5 text-gray-500">
				Klik Tambahkan untuk memeriksa kupon, atau kosongkan kode jika ingin lanjut tanpa kupon.
			</p>
		{/if}
		{#if pendingDiffers}
			<p
				class="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
				role="status"
			>
				Tagihan sebelumnya masih aktif. Kupon ini bisa digunakan setelah tagihan tersebut berakhir.
			</p>
		{/if}
		{#if paymentError}
			<p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
				{paymentError}
			</p>
		{/if}
		<div class="mt-5 flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
			<span class="text-sm font-semibold text-gray-700">Total pembayaran</span>
			<strong class="text-xl text-gray-950">{formattedProPrice}</strong>
		</div>
		<div class="mt-5 flex flex-col gap-3">
			<button
				type="button"
				disabled={checkoutDisabled}
				aria-busy={isUpgrading}
				onclick={handleUpgrade}
				class="w-full cursor-pointer rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
			>
				{isUpgrading
					? 'Menyiapkan pembayaran...'
					: couponApplied
						? 'Lanjutkan dengan kupon'
						: 'Lanjut tanpa kupon'}
			</button>
			<button
				type="button"
				disabled={couponDialogBusy}
				onclick={closeCouponDialog}
				class="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
				>Kembali</button
			>
		</div>
	</div>
</dialog>

<main class="min-h-screen bg-gray-100">
	<header class="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white px-4 sm:px-6">
		<div class="mx-auto flex h-18 w-full max-w-6xl items-center">
			<a href="/user/dashboard" class="text-xl font-bold tracking-tight text-gray-950">Wedez</a>
		</div>
	</header>
	<div class="h-18" aria-hidden="true"></div>

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

					{#if pendingPayment}
						<section
							class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 sm:p-6"
							aria-label="Tagihan aktif"
						>
							<h2 class="font-bold">Tagihan sebelumnya masih aktif</h2>
							<p class="mt-2 leading-6">
								{formatRupiah(pendingPayment.amount)}
								{pendingPayment.coupon_code
									? `dengan kupon ${pendingPayment.coupon_code}`
									: 'tanpa kupon'}.
								{#if pendingExpiry}Berlaku hingga {pendingExpiry}.{/if}
							</p>
							{#if pendingDiffers}
								<p class="mt-2 leading-6">
									Kupon pilihanmu bisa digunakan setelah tagihan ini dipastikan gagal atau berakhir.
								</p>
							{/if}
							<button
								type="button"
								disabled={isCheckingPayment}
								onclick={checkPendingPayment}
								class="mt-3 cursor-pointer font-semibold text-amber-900 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
								>{isCheckingPayment ? 'Memeriksa status...' : 'Periksa status tagihan'}</button
							>
						</section>
					{/if}

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
									>{formatRupiah(proPrice)}</span
								>{/if}
						</div>
						<div class="mt-4 flex items-center justify-between gap-4 text-sm">
							<span class="text-gray-500">Biaya layanan</span><span
								class="font-semibold text-gray-900">Rp0</span
							>
						</div>
						{#if couponApplied && quote}<div
								class="mt-3 flex justify-between text-sm text-green-700"
							>
								<span>Diskon kupon 10%</span><span>−{formatRupiah(quote.discount_amount)}</span>
							</div>{/if}
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
						{couponApplied ? 'Ubah kode kupon' : 'Punya kode kupon?'}
					</button>
					{#if isCouponOpen}
						<CouponForm
							id="desktop-coupon-form"
							code={couponCode}
							busy={isCouponValidating}
							locked={isUpgrading}
							applied={couponApplied}
							error={couponError}
							oninput={editCoupon}
							onapply={applyCoupon}
						/>
					{:else if couponApplied && quote}
						<p class="mt-2 text-xs text-green-700">Kupon {quote.coupon_code} terpasang.</p>
					{/if}
					<button
						type="button"
						disabled={checkoutDisabled}
						aria-busy={isUpgrading}
						aria-haspopup={couponApplied ? undefined : 'dialog'}
						aria-controls={couponApplied ? undefined : 'coupon-checkout-dialog'}
						onclick={continueToPayment}
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
				{couponApplied ? 'Ubah kode kupon' : 'Punya kode kupon?'}
			</button>
			{#if isCouponOpen}
				<CouponForm
					id="mobile-coupon-form"
					code={couponCode}
					busy={isCouponValidating}
					locked={isUpgrading}
					applied={couponApplied}
					error={couponError}
					oninput={editCoupon}
					onapply={applyCoupon}
				/>
			{:else if couponApplied && quote}
				<p class="mt-2 text-xs text-green-700">
					Kupon {quote.coupon_code} terpasang · Hemat {formatRupiah(quote.discount_amount)}
				</p>
			{/if}
		</div>
		<button
			type="button"
			disabled={checkoutDisabled}
			aria-busy={isUpgrading}
			aria-haspopup={couponApplied ? undefined : 'dialog'}
			aria-controls={couponApplied ? undefined : 'coupon-checkout-dialog'}
			onclick={continueToPayment}
			class="w-full cursor-pointer rounded-xl bg-violet-700 px-5 py-3.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
			>{checkoutLabel}</button
		>
	</div>
</div>

<style>
	.coupon-dialog::backdrop {
		background: rgb(17 24 39 / 50%);
		backdrop-filter: blur(3px);
	}
</style>
