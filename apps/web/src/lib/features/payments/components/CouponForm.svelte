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
		class="min-w-0 rounded-xl border-2 border-violet-600 bg-white px-4 py-3 text-sm text-gray-900 uppercase outline-none focus:border-violet-700 disabled:opacity-50"
	/>
	<button
		type="submit"
		disabled={busy || locked || !code.trim() || applied}
		class="cursor-pointer rounded-xl border border-violet-600 bg-white px-4 py-3 text-sm font-semibold text-violet-700 disabled:opacity-50"
		>{busy ? 'Memeriksa...' : applied ? 'Terpasang' : 'Tambahkan'}</button
	>
	{#if error}<p id={`${id}-error`} role="alert" class="col-span-2 text-xs text-red-600">
			{error}
		</p>{/if}
	{#if applied}<div class="col-span-2 flex justify-between gap-3 text-xs text-green-700">
			<span>Diskon 10% berhasil diterapkan.</span><button
				type="button"
				disabled={locked}
				onclick={() => oninput('')}
				class="cursor-pointer font-semibold text-gray-500">Hapus</button
			>
		</div>{/if}
</form>
