<script lang="ts">
	let {
		id,
		code,
		busy,
		locked,
		applied,
		error,
		oninput,
		onapply
	}: {
		id: string;
		code: string;
		busy: boolean;
		locked: boolean;
		applied: boolean;
		error: string;
		oninput: (value: string) => void;
		onapply: () => Promise<void>;
	} = $props();
</script>

<form
	{id}
	onsubmit={(event) => {
		event.preventDefault();
		void onapply();
	}}
	class="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3"
>
	<label for={`${id}-code`} class="sr-only">Kode kupon</label>
	<input
		id={`${id}-code`}
		value={code}
		oninput={(event) => oninput(event.currentTarget.value)}
		type="text"
		maxlength="6"
		autocomplete="off"
		autocapitalize="characters"
		spellcheck="false"
		disabled={busy || locked}
		aria-invalid={Boolean(error)}
		aria-describedby={error ? `${id}-error` : undefined}
		placeholder="6 karakter"
		class="form-control min-w-0 uppercase disabled:opacity-50"
	/>
	<button
		type="submit"
		disabled={busy || locked || !code.trim() || applied}
		class="coupon-apply min-w-0 px-3 py-3 text-sm font-extrabold"
		class:applied>{busy ? 'Memeriksa...' : applied ? 'Terpasang' : 'Tambahkan'}</button
	>
	{#if error}<p id={`${id}-error`} role="alert" class="col-span-2 text-xs text-red-600">
			{error}
		</p>{/if}
	{#if applied}<div class="col-span-2 flex justify-between gap-3 text-xs text-green-700">
			<span>Diskon 10% berhasil diterapkan.</span><button
				type="button"
				disabled={locked}
				onclick={() => oninput('')}
				class="coupon-remove cursor-pointer font-bold text-[#191919] underline underline-offset-4"
				>Hapus</button
			>
		</div>{/if}
</form>

<style>
	.form-control:focus,
	.form-control:focus-visible {
		border-color: #191919;
		outline: none;
		box-shadow: none;
	}
	.coupon-apply {
		border: 1px solid #191919;
		background: #e5bafa;
		color: #191919;
		box-shadow: 3px 3px 0 #191919;
		cursor: pointer;
	}
	.coupon-apply.applied {
		background: #d5ff86;
	}
	.coupon-apply:disabled {
		cursor: not-allowed;
	}
	.coupon-apply:disabled:not(.applied) {
		opacity: 0.5;
		box-shadow: none;
	}
	.coupon-apply:not(:disabled):active {
		transform: translate(3px, 3px);
		box-shadow: none;
	}
	.coupon-apply:focus-visible,
	.coupon-remove:focus-visible {
		outline: 2px solid #191919;
		outline-offset: 4px;
	}
</style>
