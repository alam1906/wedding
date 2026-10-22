<script lang="ts">
	let {
		cause,
		onretry,
		area = 'user'
	}: {
		cause: unknown;
		onretry: () => void | Promise<void>;
		area?: 'user' | 'affiliate';
	} = $props();
	const unauthorized = $derived(
		Boolean(
			cause &&
			typeof cause === 'object' &&
			'status' in cause &&
			(cause.status === 401 || cause.status === 403)
		)
	);
</script>

<div class={area === 'user' ? 'px-4 py-8 sm:px-6 lg:px-10 lg:py-10' : ''}>
	<div class="ws-panel p-6" role="alert">
		<h2 class="text-lg font-extrabold">Halaman belum dapat dimuat</h2>
		<p class="mt-2 text-sm text-[#5c554e]">
			{unauthorized
				? 'Silakan masuk kembali untuk melanjutkan.'
				: 'Periksa koneksi internet, lalu coba lagi.'}
		</p>
		{#if unauthorized}
			<a href="/login" class="ws-button mt-5">Masuk</a>
		{:else}
			<button type="button" class="ws-button mt-5" onclick={onretry}>Coba lagi</button>
		{/if}
	</div>
</div>
