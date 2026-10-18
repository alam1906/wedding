<script lang="ts">
	import { toDataURL } from 'qrcode';
	import PaymentIcon from './PaymentIcon.svelte';
	let { value, orderId }: { value: string; orderId: string } = $props();
	let image = $state('');
	let error = $state(false);
	let retry = $state(0);
	$effect(() => {
		void retry;
		let cancelled = false;
		image = '';
		error = false;
		void toDataURL(value, {
			width: 768,
			margin: 4,
			errorCorrectionLevel: 'M',
			color: { dark: '#000000', light: '#ffffff' }
		})
			.then((url) => {
				if (!cancelled) image = url;
			})
			.catch(() => {
				if (!cancelled) error = true;
			});
		return () => {
			cancelled = true;
		};
	});
</script>

<div class="qr-wrap">
	{#if image}
		<img src={image} alt="Kode QRIS untuk pembayaran Wedez Pro" width="280" height="280" />
		<a class="download" href={image} download={`QRIS-Wedez-${orderId}.png`}
			><PaymentIcon name="download" size={16} /> Unduh QRIS</a
		>
	{:else if error}
		<p role="alert">Kode QR belum dapat ditampilkan.</p>
		<button type="button" onclick={() => retry++}>Coba tampilkan lagi</button>
	{:else}
		<div class="placeholder" role="status">Menyiapkan kode QR…</div>
	{/if}
</div>

<style>
	.qr-wrap {
		display: grid;
		justify-items: center;
		gap: 12px;
	}
	img {
		width: min(280px, 100%);
		height: auto;
		image-rendering: pixelated;
	}
	.placeholder {
		min-height: 280px;
		display: grid;
		place-items: center;
	}
	.download,
	button {
		display: inline-flex;
		gap: 8px;
		align-items: center;
		font-size: 13px;
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 4px;
		cursor: pointer;
	}
</style>
