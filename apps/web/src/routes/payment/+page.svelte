<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { getWeddingContext } from '#lib/features/weddings/index.js';
	import {
		createProPaymentSession,
		getPaymentMethods,
		getProPaymentStatus,
		PaymentError
	} from '#lib/features/payments/api/payment.js';
	import type {
		PaymentMethod,
		PaymentQuote,
		ProPayment,
		ProPaymentState
	} from '#lib/features/payments/model/payment.js';
	import PaymentIcon from '#lib/features/payments/components/PaymentIcon.svelte';
	import PaymentQr from '#lib/features/payments/components/PaymentQr.svelte';
	import CouponForm from '#lib/features/payments/components/CouponForm.svelte';

	const wedding = getWeddingContext();
	let payment = $state<ProPayment | null>(null);
	let quote = $state<PaymentQuote | null>(null);
	let methods = $state<PaymentMethod[]>([]);
	let selectedCode = $state('');
	let environment = $state('');
	let loading = $state(true);
	let creating = $state(false);
	let checking = $state(false);
	let ready = $state(false);
	let paid = $state(false);
	let redirectSeconds = $state(5);
	let redirectFailed = $state(false);
	let error = $state('');
	let statusMessage = $state('');
	let copied = $state('');
	let couponCode = $state('');
	let couponOpen = $state(false);
	let checkoutBarHeight = $state(0);
	let couponBusy = $state(false);
	let couponError = $state('');
	let couponDialog = $state<HTMLDialogElement>();
	let now = $state(Date.now());
	let clockOffset = 0;
	let alive = false;
	let copyTimeout: ReturnType<typeof setTimeout>;
	const selected = $derived(methods.find((method) => method.code === selectedCode));
	const pending = $derived(payment?.status === 'pending' && !paid);
	const ended = $derived(!paid && (payment?.status === 'expired' || payment?.status === 'failed'));
	const secondsLeft = $derived(
		payment?.expires_at ? Math.max(0, Math.ceil((Date.parse(payment.expires_at) - now) / 1000)) : 0
	);
	const countdown = $derived(
		`${Math.floor(secondsLeft / 60)
			.toString()
			.padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`
	);
	const amount = $derived(pending || paid ? payment?.amount : quote?.amount);
	const fee = $derived(pending || paid ? (payment?.fee ?? 0) : (selected?.fee ?? 0));
	const total = $derived(amount === undefined ? undefined : amount + fee);
	const discount = $derived(
		pending || paid ? (payment?.discount_amount ?? 0) : (quote?.discount_amount ?? 0)
	);
	const coupon = $derived(pending || paid ? payment?.coupon_code : quote?.coupon_code);
	const hasDetails = $derived(Boolean(payment?.qr_string || payment?.va_number));
	const couponApplied = $derived(
		Boolean(quote?.coupon_code && quote.coupon_code === couponCode.trim().toUpperCase())
	);
	const couponDirty = $derived(couponCode.trim().toUpperCase() !== (quote?.coupon_code ?? ''));
	const checkoutDisabled = $derived(
		!ready ||
			!quote ||
			!selected ||
			pending ||
			paid ||
			creating ||
			loading ||
			checking ||
			couponBusy ||
			couponDirty
	);
	const dialogBusy = $derived(creating || couponBusy);
	const showCheckoutAction = $derived(
		Boolean(!pending && !paid && !loading && methods.length && quote && ready)
	);

	$effect(() => {
		if (!paid) return;
		redirectSeconds = 5;
		redirectFailed = false;
		const deadline = Date.now() + 5000;
		const countdownTimer = setInterval(() => {
			redirectSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
		}, 1000);
		const redirectTimer = setTimeout(() => {
			clearInterval(countdownTimer);
			redirectSeconds = 0;
			void goto('/user/dashboard', { replaceState: true, invalidateAll: true }).catch(() => {
				redirectFailed = true;
			});
		}, 5000);
		return () => {
			clearInterval(countdownTimer);
			clearTimeout(redirectTimer);
		};
	});

	function rupiah(value: number | undefined) {
		return value === undefined
			? '—'
			: new Intl.NumberFormat('id-ID', {
					style: 'currency',
					currency: 'IDR',
					maximumFractionDigits: 0
				}).format(value);
	}
	function errorText(value: unknown) {
		return value instanceof PaymentError
			? value.message
			: 'Layanan pembayaran belum dapat dihubungi. Silakan coba lagi.';
	}
	function applyStatus(result: ProPaymentState) {
		if (!alive) return;
		environment = result.environment;
		clockOffset = Date.parse(result.server_time) - Date.now();
		now = Date.now() + clockOffset;
		paid = result.plan_tier === 'pro' && result.payment.status === 'paid';
		// Keep the receipt amount when the backend returns an already-upgraded account.
		if (result.payment.id || !payment) payment = result.payment;
		if (result.payment.status === 'pending') couponCode = result.payment.coupon_code;
		if (paid) {
			wedding.reset();
			error = '';
			statusMessage = '';
		}
		ready = true;
	}
	async function loadMethods(code: string) {
		const result = await getPaymentMethods(code);
		if (!alive) return result;
		quote = result.quote;
		environment = result.environment;
		methods = result.methods;
		if (!methods.some((method) => method.code === selectedCode)) selectedCode = '';
		return result;
	}
	async function loadCheckout() {
		const code = couponCode.trim().toUpperCase();
		try {
			const result = await loadMethods(code);
			if (alive) couponCode = result.quote.coupon_code;
		} catch (cause) {
			if (!alive || !code) throw cause;
			// An invalid or retired coupon must not prevent changing it on this page.
			couponError = errorText(cause);
			couponOpen = true;
			await loadMethods('');
		}
	}
	function editCoupon(value: string) {
		couponCode = value.toUpperCase();
		couponError = '';
		if (!couponCode.trim() && quote?.coupon_code) void applyCoupon();
	}
	async function applyCoupon() {
		if (creating || loading || checking || couponBusy || pending || paid) return;
		couponBusy = true;
		couponError = '';
		try {
			const result = await loadMethods(couponCode.trim().toUpperCase());
			if (!alive) return;
			couponCode = result.quote.coupon_code;
			if (ready) error = '';
			const url = new URL(page.url.href);
			if (couponCode) url.searchParams.set('coupon', couponCode);
			else url.searchParams.delete('coupon');
			replaceState(url, page.state);
		} catch (cause) {
			if (alive) couponError = errorText(cause);
		} finally {
			if (alive) couponBusy = false;
		}
	}
	async function showCouponForm() {
		couponOpen = true;
		await tick();
		document.getElementById('payment-coupon-form-code')?.focus();
	}
	function closeCouponDialog() {
		if (!dialogBusy) couponDialog?.close();
	}
	function continueToPayment() {
		if (checkoutDisabled) return;
		if (couponApplied) void startPayment();
		else couponDialog?.showModal();
	}
	async function initialize() {
		if (creating || checking || couponBusy || (loading && ready)) return;
		loading = true;
		ready = false;
		methods = [];
		quote = null;
		error = '';
		try {
			applyStatus(await getProPaymentStatus());
			if (alive && !pending && !paid) await loadCheckout();
		} catch (cause) {
			if (alive) error = errorText(cause);
		} finally {
			if (alive) loading = false;
		}
	}
	async function checkStatus(manual = false) {
		if (!alive || checking || creating || loading || paid) return;
		checking = true;
		try {
			applyStatus(await getProPaymentStatus());
			if (!alive) return;
			error = '';
			if (manual && pending)
				statusMessage = 'Pembayaran belum terkonfirmasi. Status akan diperbarui otomatis.';
			if (!pending && !paid && !methods.length) await loadCheckout();
		} catch (cause) {
			if (alive) error = errorText(cause);
		} finally {
			if (alive) checking = false;
		}
	}
	async function startPayment() {
		if (checkoutDisabled || !quote || !selected || (!couponApplied && !couponDialog?.open)) return;
		creating = true;
		error = '';
		statusMessage = '';
		try {
			applyStatus(
				await createProPaymentSession(quote.coupon_code, selected.code, quote.amount, selected.fee)
			);
		} catch (cause) {
			if (!alive) return;
			error = errorText(cause);
			// A network timeout is not proof that no invoice was created. Reconcile first.
			ready = false;
			try {
				applyStatus(await getProPaymentStatus());
				if (alive && !pending && !paid) await loadCheckout();
			} catch {
				/* Keep retry disabled until status is known. */
			}
		} finally {
			if (alive) {
				creating = false;
				couponDialog?.close();
			}
		}
	}
	async function copy(value: string, label: string) {
		try {
			await navigator.clipboard.writeText(value);
			copied = label;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copied = '';
			}, 2500);
		} catch {
			statusMessage = 'Tidak bisa menyalin otomatis. Tekan dan tahan nomor untuk menyalinnya.';
		}
	}
	onMount(() => {
		alive = true;
		couponCode = (page.url.searchParams.get('coupon') ?? '').trim().toUpperCase();
		couponOpen = Boolean(couponCode);
		void initialize();
		const clock = setInterval(() => {
			now = Date.now() + clockOffset;
		}, 1000);
		const poll = setInterval(() => {
			if (pending && !document.hidden) void checkStatus();
		}, 6000);
		const visible = () => {
			if (!document.hidden && pending) void checkStatus();
		};
		document.addEventListener('visibilitychange', visible);
		return () => {
			alive = false;
			clearInterval(clock);
			clearInterval(poll);
			clearTimeout(copyTimeout);
			document.removeEventListener('visibilitychange', visible);
		};
	});
</script>

<svelte:head>
	<title>Pembayaran — Wedez</title>
	<meta
		name="description"
		content="Selesaikan pembayaran Wedez Pro dengan QRIS atau virtual account, langsung di Wedez."
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="checkout">
	<dialog
		bind:this={couponDialog}
		id="coupon-checkout-dialog"
		class="coupon-dialog"
		aria-labelledby="coupon-checkout-title"
		onclick={(event) => event.target === event.currentTarget && closeCouponDialog()}
		oncancel={(event) => dialogBusy && event.preventDefault()}
	>
		<div class="coupon-dialog-heading">
			<h2 id="coupon-checkout-title">Punya kode kupon?</h2>
			<button
				type="button"
				class="close-dialog"
				aria-label="Tutup dialog kupon"
				disabled={dialogBusy}
				onclick={closeCouponDialog}>×</button
			>
		</div>
		<div class="coupon-dialog-form">
			<span class="eyebrow">KODE KUPON</span><CouponForm
				id="checkout-coupon-form"
				code={couponCode}
				busy={couponBusy}
				locked={creating}
				applied={couponApplied}
				error={couponError}
				oninput={editCoupon}
				onapply={applyCoupon}
			/>
		</div>
		<div class="dialog-total"><span>Total pembayaran</span><strong>{rupiah(total)}</strong></div>
		<div class="dialog-actions">
			<button
				type="button"
				class="action pink full"
				disabled={checkoutDisabled}
				onclick={startPayment}
				>{creating
					? 'Membuat tagihan…'
					: couponApplied
						? 'Lanjutkan dengan kupon'
						: 'Lanjut tanpa kupon'}<PaymentIcon name="arrow" size={18} /></button
			><button
				type="button"
				class="action white full"
				disabled={dialogBusy}
				onclick={closeCouponDialog}>Kembali</button
			>
		</div>
	</dialog>
	<header class="site-header">
		<div class="header-inner">
			<a class="brand" href="/user/dashboard" aria-label="Wedez, kembali ke dashboard"
				>WEDEZ<span class="brand-dot">✳</span></a
			><span class="secure-label"><PaymentIcon name="lock" size={15} /> Pembayaran aman</span>
		</div>
	</header>
	<main
		class:has-checkout-action={showCheckoutAction}
		style:--checkout-bar-height={`${checkoutBarHeight || 150}px`}
	>
		<div class="topline">
			<a class="back" href="/user/dashboard">← Kembali ke dashboard</a>
		</div>
		{#if environment === 'sandbox'}<p class="sandbox" role="status">
				MODE SANDBOX · Pembayaran uji coba, bukan transaksi nyata.
			</p>{/if}
		<h1>Pembayaran</h1>
		<ol class="steps" aria-label="Tahapan upgrade">
			<li
				class:current={!pending && !paid}
				class:done={pending || paid}
				aria-current={!pending && !paid ? 'step' : undefined}
			>
				<span>{pending || paid ? '✓' : '01'}</span> Paket & metode
			</li>
			<li class:current={pending} class:done={paid} aria-current={pending ? 'step' : undefined}>
				<span>{paid ? '✓' : '02'}</span> Pembayaran
			</li>
			<li class:current={paid} aria-current={paid ? 'step' : undefined}>
				<span>03</span> Pro aktif
			</li>
		</ol>
		<div class="checkout-grid" class:has-invoice={pending || paid}>
			<section
				class="payment-panel panel"
				aria-label="Pembayaran Wedez Pro"
				aria-busy={loading || creating}
			>
				{#if loading}
					<div class="state-panel" role="status">
						<div class="loading-mark">✳</div>
						<h2>Menyiapkan pembayaran</h2>
						<p>Sedang memeriksa tagihan dan metode yang tersedia.</p>
					</div>
				{:else if paid}
					<div class="state-panel success">
						<div class="success-icon"><PaymentIcon name="check" size={48} /></div>
						<span class="eyebrow">PAYMENT COMPLETE</span>
						<h2>Yeay, Pro sudah aktif!</h2>
						<p>Undanganmu siap tampil maksimal.<br />Saatnya lanjut merangkai cerita bahagiamu.</p>
						<a class="action pink" href="/user/dashboard"
							>Lanjut ke dashboard <PaymentIcon name="arrow" size={18} /></a
						>
						<p role="status">
							{redirectFailed
								? 'Klik Lanjut ke dashboard untuk melanjutkan.'
								: redirectSeconds > 0
									? `Otomatis ke dashboard dalam ${redirectSeconds} detik.`
									: 'Membuka dashboard…'}
						</p>
					</div>
				{:else if pending && payment}
					<div class="panel-heading">
						<div>
							<span class="eyebrow">TINGGAL SELESAIKAN</span>
							<h2>
								{hasDetails
									? payment.kind === 'qris'
										? 'Scan. Bayar. Selesai.'
										: 'Transfer virtual account'
									: 'Tagihan sedang aktif'}
							</h2>
						</div>
						<span class="status-pill"><span class="status-dot"></span> Menunggu</span>
					</div>
					<div class="payment-body">
						<div class="deadline">
							<div>
								<PaymentIcon name="clock" size={19} /><span
									>{secondsLeft > 0 ? 'Selesaikan dalam' : 'Memeriksa batas waktu'}</span
								>
							</div>
							<strong>{countdown}</strong>
						</div>
						{#if secondsLeft <= 0}
							<div class="notice">
								<strong>Waktu pembayaran telah habis.</strong>
								<p>
									Kami memeriksa status terakhir. Jangan transfer menggunakan detail tagihan ini.
								</p>
							</div>
						{:else if payment.kind === 'qris' && payment.qr_string}
							<div class="qr-card">
								<div class="qr-heading"><strong>QRIS</strong><span>SCAN UNTUK BAYAR</span></div>
								<PaymentQr value={payment.qr_string} orderId={payment.order_id} />
								<p>Gunakan aplikasi bank atau e-wallet<br />yang mendukung QRIS.</p>
							</div>
						{:else if payment.kind === 'va' && payment.va_number}
							<div class="va-card">
								<span class="method-icon"><PaymentIcon name="bank" size={28} /></span>
								<h3>{payment.method_name}</h3>
								<span class="eyebrow">NOMOR VIRTUAL ACCOUNT</span><strong class="va-number"
									>{payment.va_number}</strong
								><button
									class="action lavender"
									type="button"
									onclick={() => copy(payment!.va_number, 'Nomor VA')}
									><PaymentIcon name="copy" size={17} />{copied === 'Nomor VA'
										? 'Nomor tersalin!'
										: 'Salin nomor VA'}</button
								>
							</div>
						{:else}
							<div class="notice">
								<strong
									>{payment.kind
										? 'Detail pembayaran belum diterima.'
										: 'Tagihan dari checkout sebelumnya.'}</strong
								>
								<p>
									{payment.kind
										? 'Tagihan sedang direkonsiliasi dengan Duitku. Jangan membuat pembayaran lain; periksa status atau tunggu sampai tagihan berakhir.'
										: 'Jika sudah membayar, tunggu konfirmasi otomatis. Untuk menggunakan halaman pembayaran baru, tunggu tagihan sebelumnya berakhir.'}
								</p>
							</div>
						{/if}
						<div class="pay-total">
							<span>Total pembayaran</span><strong>{rupiah(payment.total)}</strong><button
								class="icon-button"
								aria-label="Salin total pembayaran"
								type="button"
								onclick={() => copy(String(payment!.total), 'Total')}
								><PaymentIcon name="copy" size={17} /></button
							>
						</div>
						{#if hasDetails && secondsLeft > 0}<div class="instructions">
								<h3>Cara membayar</h3>
								<ol>
									{#if payment.kind === 'qris'}<li>
											Buka menu scan QRIS di aplikasi bank atau e-wallet.
										</li>
										<li>
											Scan kode di atas. Jika di HP yang sama, unduh QRIS lalu pilih gambarnya di
											aplikasi yang mendukung.
										</li>
										<li>
											Periksa nama merchant dan nominal, lalu selesaikan pembayaran.
										</li>{:else}<li>
											Buka aplikasi bank, ATM, atau internet banking yang mendukung bank tujuan.
										</li>
										<li>Pilih pembayaran virtual account, lalu masukkan nomor di atas.</li>
										<li>Periksa nama merchant dan bayar sesuai total tagihan.</li>{/if}
								</ol>
							</div>{/if}
						<button
							type="button"
							class="action white full"
							disabled={checking}
							onclick={() => checkStatus(true)}
							>{checking ? 'Memeriksa pembayaran…' : 'Saya sudah bayar, cek status'}<PaymentIcon
								name="arrow"
								size={18}
							/></button
						>
						<p class="auto-note">
							Status diperbarui otomatis. Tidak perlu mengirim bukti transfer.
						</p>
					</div>
				{:else}
					<div class="panel-heading">
						<div>
							<span class="eyebrow">PILIH YANG PALING NYAMAN</span>
							<h2>Metode pembayaran</h2>
						</div>
						<span class="small-number">01</span>
					</div>
					<div class="payment-body">
						{#if ended}<div class="notice">
								<strong
									>{payment?.status === 'expired'
										? 'Tagihan sebelumnya kedaluwarsa.'
										: 'Tagihan sebelumnya dibatalkan.'}</strong
								>
								<p>Jangan bayar tagihan lama. Pilih metode untuk membuat tagihan baru.</p>
							</div>{/if}
						{#if methods.length && quote && ready}
							<fieldset disabled={creating || couponBusy || checking}>
								<legend class="sr-only">Pilih metode pembayaran</legend
								>{#each ['qris', 'va'] as kind (kind)}{@const group = methods.filter(
										(method) => method.kind === kind
									)}{#if group.length}<div class="method-group">
											<h3>
												{kind === 'qris' ? 'QRIS' : 'Virtual account'}<span
													>{kind === 'qris'
														? 'Satu QR, banyak aplikasi'
														: 'Transfer dari bank pilihanmu'}</span
												>
											</h3>
											<div class="method-list" class:bank-list={kind === 'va'}>
												{#each group as method (method.code)}<label
														class="method-option"
														class:selected={selectedCode === method.code}
														><input
															type="radio"
															name="payment-method"
															value={method.code}
															bind:group={selectedCode}
														/><span class="method-icon" class:qr={method.kind === 'qris'}
															><PaymentIcon
																name={method.kind === 'qris' ? 'qr' : 'bank'}
																size={23}
															/></span
														><span class="method-info"
															><strong>{method.name}</strong><small
																>{method.fee
																	? `Biaya layanan ${rupiah(method.fee)}`
																	: 'Tanpa biaya tambahan'}</small
															></span
														><span class="radio-indicator" aria-hidden="true"
															>{#if selectedCode === method.code}<PaymentIcon
																	name="check"
																	size={13}
																/>{/if}</span
														></label
													>{/each}
											</div>
										</div>{/if}{/each}
							</fieldset>
						{:else if !error}<div class="empty-state">
								<PaymentIcon name="bank" size={40} />
								<h3>Belum ada metode yang tersedia</h3>
								<p>
									QRIS atau virtual account belum tersedia untuk transaksi ini. Coba lagi nanti atau
									hubungi pengelola Wedez.
								</p>
								<button class="action white" type="button" onclick={initialize}
									>Muat ulang metode</button
								>
							</div>{/if}
					</div>
				{/if}
				{#if error}<div class="error-message" role="alert">
						<strong
							>{pending
								? 'Status pembayaran belum dapat diperbarui'
								: 'Pembayaran belum dapat dilanjutkan'}</strong
						>
						<p>{error}</p>
						<div class="error-actions">
							<button
								type="button"
								disabled={loading || creating || checking || couponBusy}
								onclick={() => (pending ? checkStatus(true) : initialize())}>Coba lagi</button
							>{#if !pending}<button type="button" onclick={showCouponForm}>Ubah kode kupon</button
								>{/if}
						</div>
					</div>{/if}
				<p class="sr-only" role="status">{copied ? `${copied} berhasil disalin.` : ''}</p>
				{#if statusMessage && !paid}<p class="inline-status" role="status">{statusMessage}</p>{/if}
			</section>
			{#if !pending && !paid}
				<aside class="order-column" aria-label="Ringkasan pesanan">
					<div class="order-panel panel">
						<div class="order-heading">
							<h2>Wedez <span>PRO</span></h2>
						</div>
						<div class="order-body">
							<div class="receipt">
								<div>
									<span>Paket Pro</span><strong
										>{rupiah(amount === undefined ? undefined : amount + discount)}</strong
									>
								</div>
								{#if discount}<div class="discount">
										<span>Kupon {coupon}</span><strong>−{rupiah(discount)}</strong>
									</div>{/if}
								<div>
									<span>Biaya layanan</span><strong
										>{pending || paid || selected ? rupiah(fee) : 'Pilih metode'}</strong
									>
								</div>
							</div>
							<div
								class="checkout-summary"
								class:is-actionable={showCheckoutAction}
								bind:clientHeight={checkoutBarHeight}
							>
								{#if !pending && !paid && !loading}
									<div class="coupon-section">
										<button
											type="button"
											class="coupon-toggle"
											disabled={creating || couponBusy}
											aria-expanded={couponOpen}
											aria-controls="payment-coupon-form"
											onclick={() => (couponOpen = !couponOpen)}
											>{couponApplied ? 'Ubah kode kupon' : 'Punya kode kupon?'}<span
												aria-hidden="true">{couponOpen ? '−' : '+'}</span
											></button
										>
										{#if couponOpen}<CouponForm
												id="payment-coupon-form"
												code={couponCode}
												busy={couponBusy}
												locked={creating || loading || checking}
												applied={couponApplied}
												error={couponError}
												oninput={editCoupon}
												onapply={applyCoupon}
											/>{/if}
										{#if couponDirty && !couponError && !couponBusy}<p class="coupon-hint">
												Terapkan kode kupon atau kosongkan kode untuk melanjutkan.
											</p>{:else if couponApplied && !couponOpen}<p class="coupon-success">
												Kupon {quote?.coupon_code} terpasang.
											</p>{/if}
									</div>
								{/if}
								<div class="checkout-row">
									<div class="receipt-total">
										<span>Total</span><strong>{rupiah(total)}</strong>
									</div>
									{#if showCheckoutAction}
										<button
											class="action pink full checkout-action"
											type="button"
											disabled={checkoutDisabled}
											aria-haspopup={couponApplied ? undefined : 'dialog'}
											aria-controls={couponApplied ? undefined : 'coupon-checkout-dialog'}
											onclick={continueToPayment}
											><span class="desktop-pay-label"
												>{creating
													? 'Membuat tagihan…'
													: selected
														? `Bayar ${rupiah(total)}`
														: 'Pilih metode pembayaran'}</span
											><span class="mobile-pay-label">{creating ? 'Memproses…' : 'Bayar'}</span
											><span class="pay-arrow"><PaymentIcon name="arrow" size={18} /></span></button
										>
									{/if}
								</div>
							</div>
							{#if payment?.order_id && (pending || paid)}<div class="order-id">
									<span>ID TRANSAKSI</span><code>{payment.order_id}</code>
								</div>{/if}
						</div>
						<div class="order-footer">
							<PaymentIcon name="lock" size={16} /><span
								>Diproses aman oleh <strong>Duitku</strong></span
							>
						</div>
					</div>
				</aside>
			{/if}
		</div>
		<footer class="page-footer">
			<span>WEDEZ © {new Date().getFullYear()}</span><span>Dibuat untuk cerita bahagiamu.</span>
		</footer>
	</main>
</div>

<style>
	.checkout {
		--ink: #191919;
		--cream: #fffaf0;
		--pink: #ff6bc6;
		--lime: #d5ff86;
		--lavender: #e5bafa;
		min-height: 100dvh;
		background: var(--cream);
		color: var(--ink);
	}
	.site-header {
		border-bottom: 2px solid var(--ink);
	}
	.header-inner {
		max-width: 1140px;
		margin: auto;
		padding: 0 28px;
		min-height: 76px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 25px;
		font-weight: 950;
		letter-spacing: -1.5px;
	}
	.brand-dot {
		color: #b34c99;
		font-size: 30px;
	}
	.secure-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		font-weight: 650;
	}
	main {
		max-width: 1140px;
		margin: auto;
		padding: 28px 28px 0;
	}
	.topline {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}
	.back {
		font-size: 13px;
		font-weight: 750;
	}
	.back:hover {
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.eyebrow {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 1.8px;
	}
	h1 {
		margin: 24px 0 20px;
		font-size: 30px;
		letter-spacing: -1px;
		font-weight: 850;
		line-height: 1.2;
	}
	.steps {
		display: flex;
		list-style: none;
		margin-bottom: 28px;
		border-block: 1px solid var(--ink);
		padding: 16px 0;
		gap: 30px;
	}
	.steps li {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
		font-weight: 700;
		color: #77716b;
	}
	.steps li > span {
		width: 24px;
		height: 24px;
		border: 1px solid currentColor;
		display: grid;
		place-items: center;
		font-size: 10px;
	}
	.steps .done,
	.steps .current {
		color: var(--ink);
	}
	.steps .done > span {
		background: var(--lime);
	}
	.steps .current > span {
		background: var(--pink);
		box-shadow: 2px 2px 0 var(--ink);
	}
	.checkout-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 350px;
		align-items: start;
		gap: 28px;
	}
	.checkout-grid.has-invoice {
		grid-template-columns: minmax(0, 1fr);
		width: 100%;
		max-width: 720px;
		margin-inline: auto;
	}
	.panel {
		background: white;
		border: 2px solid var(--ink);
		box-shadow: 6px 6px 0 var(--ink);
		min-width: 0;
	}
	.panel-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 24px;
		border-bottom: 1px solid var(--ink);
	}
	h2 {
		font-size: 23px;
		font-weight: 850;
		letter-spacing: -0.8px;
		line-height: 1.3;
	}
	.panel-heading h2 {
		margin-top: 6px;
	}
	.small-number {
		font-size: 35px;
		font-weight: 800;
		color: #a69ba7;
	}
	.payment-body {
		padding: 24px;
	}
	fieldset {
		min-width: 0;
		border: 0;
		padding: 0;
	}
	.method-group + .method-group {
		margin-top: 26px;
	}
	.method-group h3 {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 5px 12px;
		font-size: 14px;
		font-weight: 800;
		margin-bottom: 12px;
	}
	.method-group h3 > span {
		font-size: 11px;
		color: #655e58;
		font-weight: 400;
	}
	.method-list {
		display: grid;
		gap: 10px;
	}
	.method-option {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		border: 1px solid var(--ink);
		padding: 14px;
		cursor: pointer;
		transition: background 0.12s;
	}
	.method-option:hover {
		background: #fffaf0;
	}
	.method-option.selected {
		background: #f4ffe4;
		box-shadow: 3px 3px 0 var(--ink);
	}
	.method-option:focus-within {
		outline: 2px solid var(--ink);
		outline-offset: 3px;
	}
	.method-option input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}
	.method-icon {
		flex-shrink: 0;
		height: 44px;
		width: 44px;
		display: grid;
		place-items: center;
		border: 1px solid var(--ink);
		background: #f5edfb;
	}
	.method-icon.qr {
		background: var(--lavender);
	}
	.method-info {
		flex: 1;
		min-width: 0;
	}
	.method-info strong {
		display: block;
		font-size: 13px;
		font-weight: 800;
		overflow-wrap: anywhere;
	}
	.method-info small {
		display: block;
		font-size: 11px;
		color: #5c554e;
		margin-top: 3px;
	}
	.radio-indicator {
		height: 18px;
		width: 18px;
		display: grid;
		place-items: center;
		border: 1px solid var(--ink);
		background: white;
		flex-shrink: 0;
	}
	.selected .radio-indicator {
		background: var(--lime);
	}
	fieldset:disabled {
		opacity: 0.6;
	}
	.checkout-action {
		margin-top: 24px;
	}
	.auto-note {
		text-align: center;
		font-size: 11px;
		color: #655e58;
		line-height: 1.7;
		margin-top: 16px;
	}
	.action {
		display: inline-flex;
		justify-content: center;
		align-items: center;
		gap: 12px;
		min-height: 46px;
		border: 1px solid var(--ink);
		padding: 12px 18px;
		font-size: 13px;
		font-weight: 800;
		box-shadow: 3px 3px 0 var(--ink);
		cursor: pointer;
		text-align: center;
	}
	.action:not(:disabled):active {
		transform: translate(3px, 3px);
		box-shadow: none;
	}
	.action:disabled {
		opacity: 0.45;
		cursor: not-allowed;
		box-shadow: none;
	}
	.full {
		width: 100%;
	}
	.pink {
		background: var(--pink);
	}
	.white {
		background: white;
	}
	.lavender {
		background: var(--lavender);
	}
	.order-column {
		position: sticky;
		top: 24px;
	}
	.order-heading {
		padding: 24px;
		border-bottom: 1px solid var(--ink);
		background: var(--lavender);
	}
	.order-heading h2 {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0;
		font-size: 35px;
		font-weight: 900;
		letter-spacing: -1.6px;
	}
	.order-heading h2 > span {
		background: white;
		border: 1px solid var(--ink);
		padding: 4px 7px;
		font-size: 13px;
		letter-spacing: 0;
		transform: rotate(-6deg);
		box-shadow: 2px 2px 0 var(--ink);
	}
	.order-body {
		display: flex;
		flex-direction: column;
		padding: 24px;
	}
	.checkout-summary {
		display: contents;
	}
	.checkout-row {
		order: 3;
	}
	.mobile-pay-label {
		display: none;
	}
	.receipt {
		order: 2;
	}
	.receipt > div {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 12px;
		margin-bottom: 14px;
	}
	.receipt strong {
		font-weight: 750;
		white-space: nowrap;
	}
	.receipt .discount {
		color: #36641a;
	}
	.receipt-total {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		border-top: 1px solid var(--ink);
		padding-top: 18px;
		margin-top: 18px;
		margin-bottom: 0;
		align-items: center;
		font-weight: 800;
		font-size: 14px;
	}
	.receipt-total strong {
		font-size: 25px;
		font-weight: 900;
		letter-spacing: -1px;
	}
	.order-footer {
		border-top: 1px solid var(--ink);
		padding: 15px 24px;
		display: flex;
		gap: 9px;
		align-items: center;
		font-size: 11px;
		background: #fafafa;
	}
	.order-id {
		order: 4;
		margin-top: 22px;
		display: grid;
		gap: 7px;
		font-size: 10px;
		color: #655e58;
	}
	.order-id code {
		color: var(--ink);
		font-size: 11px;
		overflow-wrap: anywhere;
	}
	.deadline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 14px;
		background: #fff4d7;
		border: 1px solid var(--ink);
		margin-bottom: 22px;
	}
	.deadline > div {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
	}
	.deadline strong {
		font-size: 23px;
		font-variant-numeric: tabular-nums;
		letter-spacing: 1px;
	}
	.status-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 10px;
		font-weight: 700;
		padding: 5px 8px;
		border: 1px solid var(--ink);
		background: #fff4d7;
		white-space: nowrap;
	}
	.status-dot {
		width: 6px;
		height: 6px;
		background: #a46212;
		border-radius: 50%;
	}
	.qr-card {
		max-width: 340px;
		margin: 0 auto 22px;
		border: 1px solid var(--ink);
		padding: 16px;
		background: white;
	}
	.qr-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--ink);
		padding-bottom: 12px;
	}
	.qr-heading strong {
		font-size: 22px;
		font-weight: 900;
		letter-spacing: -1px;
	}
	.qr-heading span {
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 1px;
	}
	.qr-card p {
		text-align: center;
		font-size: 11px;
		color: #655e58;
		line-height: 1.7;
		margin-top: 14px;
	}
	.va-card {
		text-align: center;
		display: grid;
		justify-items: center;
		gap: 14px;
		border: 1px dashed var(--ink);
		padding: 24px 16px;
		margin-bottom: 22px;
	}
	.va-card h3 {
		font-size: 17px;
		font-weight: 800;
	}
	.va-number {
		font-size: clamp(20px, 3vw, 30px);
		letter-spacing: 1px;
		overflow-wrap: anywhere;
		max-width: 100%;
		user-select: all;
	}
	.pay-total {
		display: flex;
		align-items: center;
		gap: 10px;
		border-block: 1px solid var(--ink);
		padding: 18px 0;
	}
	.pay-total > span {
		font-size: 12px;
	}
	.pay-total strong {
		margin-left: auto;
		font-size: 25px;
		font-weight: 900;
		letter-spacing: -1px;
	}
	.icon-button {
		width: 32px;
		height: 32px;
		display: grid;
		place-items: center;
		cursor: pointer;
		flex-shrink: 0;
	}
	.instructions {
		padding: 24px 0;
	}
	.instructions h3 {
		font-size: 14px;
		font-weight: 800;
		margin-bottom: 14px;
	}
	.instructions ol {
		list-style: decimal;
		padding-left: 18px;
		display: grid;
		gap: 9px;
		color: #5c554e;
		font-size: 12px;
		line-height: 1.8;
	}
	.instructions + .action,
	.pay-total + .action {
		margin-top: 20px;
	}
	.notice {
		border: 1px solid var(--ink);
		background: #fff4d7;
		padding: 16px;
		margin-bottom: 22px;
		font-size: 13px;
		line-height: 1.7;
	}
	.notice p {
		margin-top: 5px;
	}
	.error-message {
		margin: 0 24px 24px;
		padding: 16px;
		border: 1px solid #8b2828;
		background: #fff0ee;
		color: #842727;
		font-size: 13px;
		line-height: 1.7;
		overflow-wrap: anywhere;
	}
	.error-message p {
		margin-top: 5px;
	}
	.error-actions {
		margin-top: 10px;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.error-actions button {
		text-decoration: underline;
		text-underline-offset: 3px;
		font-weight: 800;
		cursor: pointer;
	}
	.inline-status {
		margin: 0 24px 24px;
		padding: 12px;
		background: #f5edfb;
		font-size: 12px;
		line-height: 1.7;
	}
	.state-panel {
		display: grid;
		justify-items: center;
		gap: 16px;
		text-align: center;
		padding: 64px 28px;
	}
	.state-panel p {
		color: #655e58;
		font-size: 13px;
		line-height: 1.8;
	}
	.state-panel .action {
		margin-top: 10px;
	}
	.success-icon {
		width: 88px;
		height: 88px;
		display: grid;
		place-items: center;
		background: var(--lime);
		border: 2px solid var(--ink);
		box-shadow: 5px 5px 0 var(--ink);
		margin-bottom: 18px;
		transform: rotate(-5deg);
	}
	.success h2 {
		font-size: 31px;
	}
	.loading-mark {
		font-size: 48px;
	}
	.empty-state {
		display: grid;
		justify-items: center;
		gap: 16px;
		text-align: center;
		padding: 28px 8px;
	}
	.empty-state h3 {
		font-weight: 800;
	}
	.empty-state p {
		font-size: 13px;
		color: #655e58;
		line-height: 1.8;
	}
	.sandbox {
		font-size: 11px;
		font-weight: 750;
		padding: 10px 14px;
		background: #fff4d7;
		border: 1px dashed var(--ink);
		margin-top: 22px;
	}
	.page-footer {
		display: flex;
		justify-content: space-between;
		gap: 18px;
		border-top: 1px solid var(--ink);
		margin-top: 48px;
		padding: 22px 0;
		color: #655e58;
		font-size: 10px;
	}
	.checkout :is(a, button):focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 4px;
	}
	.coupon-section {
		order: 1;
		border: 1px solid var(--ink);
		background: var(--cream);
		padding: 16px;
		margin-top: 20px;
		margin-bottom: 20px;
	}
	.coupon-toggle {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		font-size: 13px;
		font-weight: 800;
	}
	.coupon-toggle > span {
		font-size: 20px;
		line-height: 1;
	}
	.coupon-hint,
	.coupon-success {
		font-size: 11px;
		line-height: 1.7;
		margin-top: 12px;
	}
	.coupon-success {
		color: #36641a;
	}
	.coupon-dialog {
		margin: auto;
		width: min(440px, calc(100% - 32px));
		max-height: calc(100dvh - 32px);
		overflow-y: auto;
		border: 2px solid var(--ink);
		background: white;
		color: var(--ink);
		padding: 24px;
		box-shadow: 6px 6px 0 var(--ink);
	}
	.coupon-dialog::backdrop {
		background: rgb(17 24 39 / 50%);
	}
	.coupon-dialog-heading {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 12px;
	}
	.close-dialog {
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		flex-shrink: 0;
		background: var(--lavender);
		border: 1px solid var(--ink);
		box-shadow: 2px 2px 0 var(--ink);
		cursor: pointer;
		font-size: 24px;
		line-height: 1;
	}
	.coupon-dialog-form {
		margin-top: 24px;
		border: 1px solid var(--ink);
		background: var(--cream);
		padding: 16px;
	}
	.dialog-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		margin-block: 24px;
		padding-top: 20px;
		border-top: 1px solid var(--ink);
		font-size: 13px;
	}
	.dialog-total strong {
		font-size: 23px;
		font-weight: 850;
	}
	.dialog-actions {
		display: grid;
		gap: 14px;
	}
	@media (min-width: 1024px) {
		.bank-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 850px) {
		.checkout-grid {
			grid-template-columns: minmax(0, 1fr) 300px;
			gap: 20px;
		}
		.order-heading,
		.order-body,
		.panel-heading,
		.payment-body {
			padding: 20px;
		}
		.panel-heading {
			flex-wrap: wrap;
		}
	}
	@media (max-width: 700px) {
		main.has-checkout-action {
			padding-bottom: calc(var(--checkout-bar-height) + 24px);
		}
		.checkout-summary.is-actionable {
			display: block;
			position: fixed;
			inset: auto 0 0;
			z-index: 20;
			border-top: 2px solid var(--ink);
			background: white;
			max-height: 65dvh;
			overflow-y: auto;
			padding: 14px 20px calc(18px + env(safe-area-inset-bottom, 0px));
		}
		.checkout-summary.is-actionable .coupon-section {
			margin: 0 0 14px;
			padding: 12px;
		}
		.checkout-summary.is-actionable .checkout-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
		}
		.checkout-summary.is-actionable .receipt-total {
			flex-direction: column;
			align-items: flex-start;
			gap: 2px;
			border: 0;
			padding: 0;
			margin: 0;
		}
		.checkout-summary.is-actionable .checkout-action {
			width: auto;
			min-width: 112px;
			margin: 0 3px 3px 0;
		}
		.checkout-summary.is-actionable .desktop-pay-label,
		.checkout-summary.is-actionable .pay-arrow {
			display: none;
		}
		.checkout-summary.is-actionable .mobile-pay-label {
			display: inline;
		}
		.header-inner {
			padding: 0 20px;
			min-height: 64px;
		}
		main {
			padding: 22px 20px 0;
		}
		h1 {
			font-size: 26px;
		}
		.steps {
			gap: 16px;
			justify-content: space-between;
		}
		.steps li {
			gap: 7px;
			font-size: 10px;
		}
		.checkout-grid {
			grid-template-columns: minmax(0, 1fr);
			gap: 28px;
		}
		.order-column {
			position: static;
		}
		.checkout-grid:not(.has-invoice) .order-column {
			grid-row: 1;
		}
		.panel {
			box-shadow: 4px 4px 0 var(--ink);
		}
		.panel-heading h2 {
			font-size: 21px;
		}
		.page-footer {
			margin-top: 30px;
		}
		.error-message {
			margin: 0 20px 20px;
		}
	}
	@media (max-width: 380px) {
		.panel-heading,
		.payment-body,
		.order-body {
			padding: 16px;
		}
		.method-option {
			padding: 11px;
			gap: 9px;
		}
		.method-icon {
			height: 36px;
			width: 36px;
		}
		.pay-total strong {
			font-size: 22px;
		}
		.steps {
			gap: 8px;
		}
	}
</style>
