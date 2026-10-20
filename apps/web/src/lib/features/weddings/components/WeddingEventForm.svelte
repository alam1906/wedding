<script lang="ts">
	import { untrack } from 'svelte';
	import type { WeddingData } from '../model/wedding.js';
	import { createEventDraft, eventDateTimeToISO } from '../model/wedding-events.js';

	let { wedding, disabled = false }: { wedding: WeddingData; disabled?: boolean } = $props();
	let draft = $state(untrack(() => createEventDraft(wedding)));

	function chooseLayout(separate: boolean) {
		if (separate) {
			draft.akadDate ||= draft.date;
			draft.receptionDate ||= draft.date;
			draft.receptionAddress ||= draft.address;
			draft.receptionMaps ||= draft.maps;
		} else {
			draft.date ||= draft.akadDate || draft.receptionDate;
		}
		draft.separate = separate;
	}
</script>

<fieldset {disabled} class="min-w-0 space-y-6">
	<legend class="sr-only">Detail acara</legend>
	<div class="flex min-h-11 items-center justify-between gap-5">
		<label
			id="same-event-location-label"
			for="same-event-location"
			class="form-label cursor-pointer">Akad dan resepsi di hari &amp; tempat yang sama</label
		>
		<button
			id="same-event-location"
			type="button"
			role="switch"
			aria-labelledby="same-event-location-label"
			aria-checked={!draft.separate}
			{disabled}
			onclick={() => chooseLayout(!draft.separate)}
			class="relative shrink-0 cursor-pointer before:absolute before:inset-x-0 before:-inset-y-2 focus-visible:shadow-none! focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#191919]! disabled:cursor-not-allowed disabled:opacity-50"
		>
			<span aria-hidden="true" class="absolute"></span>
		</button>
	</div>
	<input type="hidden" name="separate_events" value={String(draft.separate)} />
	<input
		type="hidden"
		name="akad"
		value={eventDateTimeToISO(draft.separate ? draft.akadDate : draft.date, draft.akadTime)}
	/>
	<input
		type="hidden"
		name="reception"
		value={eventDateTimeToISO(
			draft.separate ? draft.receptionDate : draft.date,
			draft.receptionTime
		)}
	/>
	<input
		type="hidden"
		name="reception_address"
		value={draft.separate ? draft.receptionAddress.trim() : ''}
	/>
	<input
		type="hidden"
		name="reception_maps"
		value={draft.separate ? draft.receptionMaps.trim() : ''}
	/>

	{#if draft.separate}
		<div class="grid gap-5 lg:grid-cols-2">
			<section class="min-w-0 border border-[#191919] p-4 sm:p-5">
				<h2 class="mb-5 flex items-center gap-3 font-extrabold text-[#191919]">
					<span class="grid size-8 place-items-center border border-[#191919] bg-[#e2d2ff] text-xs"
						>01</span
					>Akad nikah
				</h2>
				<div class="space-y-5">
					<label class="form-label block"
						>Tanggal akad<input
							type="date"
							bind:value={draft.akadDate}
							required
							class="form-control mt-2"
						/></label
					>
					<label class="form-label block"
						>Jam akad (WIB)<input
							type="time"
							bind:value={draft.akadTime}
							required
							class="form-control mt-2"
						/></label
					>
					<label class="form-label block"
						>Alamat akad<textarea
							name="address"
							bind:value={draft.address}
							required
							maxlength="2000"
							class="form-control mt-2 min-h-32"
							placeholder="Nama tempat dan alamat lengkap"></textarea></label
					>
					<label class="form-label block"
						>Link Google Maps akad<input
							name="maps"
							type="url"
							bind:value={draft.maps}
							class="form-control mt-2"
							placeholder="https://maps.app.goo.gl/..."
						/></label
					>
				</div>
			</section>
			<section class="min-w-0 border border-[#191919] p-4 sm:p-5">
				<h2 class="mb-5 flex items-center gap-3 font-extrabold text-[#191919]">
					<span class="grid size-8 place-items-center border border-[#191919] bg-[#ff70c5] text-xs"
						>02</span
					>Resepsi
				</h2>
				<div class="space-y-5">
					<label class="form-label block"
						>Tanggal resepsi<input
							type="date"
							bind:value={draft.receptionDate}
							required
							class="form-control mt-2"
						/></label
					>
					<label class="form-label block"
						>Jam resepsi (WIB)<input
							type="time"
							bind:value={draft.receptionTime}
							required
							class="form-control mt-2"
						/></label
					>
					<label class="form-label block"
						>Alamat resepsi<textarea
							bind:value={draft.receptionAddress}
							required
							maxlength="2000"
							class="form-control mt-2 min-h-32"
							placeholder="Nama tempat dan alamat lengkap"></textarea></label
					>
					<label class="form-label block"
						>Link Google Maps resepsi<input
							type="url"
							bind:value={draft.receptionMaps}
							class="form-control mt-2"
							placeholder="https://maps.app.goo.gl/..."
						/></label
					>
				</div>
			</section>
		</div>
	{:else}
		<div class="space-y-5 border border-[#191919] p-4 sm:p-5">
			<label class="form-label block"
				>Tanggal acara<input
					type="date"
					bind:value={draft.date}
					required
					class="form-control mt-2"
				/></label
			>
			<div class="grid gap-5 sm:grid-cols-2">
				<label class="form-label block"
					>Jam akad (WIB)<input
						type="time"
						bind:value={draft.akadTime}
						required
						class="form-control mt-2"
					/></label
				>
				<label class="form-label block"
					>Jam resepsi (WIB)<input
						type="time"
						bind:value={draft.receptionTime}
						required
						class="form-control mt-2"
					/></label
				>
			</div>
			<label class="form-label block"
				>Alamat acara<textarea
					name="address"
					bind:value={draft.address}
					required
					maxlength="2000"
					class="form-control mt-2 min-h-32"
					placeholder="Nama tempat dan alamat lengkap"></textarea></label
			>
			<label class="form-label block"
				>Link Google Maps<input
					name="maps"
					type="url"
					bind:value={draft.maps}
					class="form-control mt-2"
					placeholder="https://maps.app.goo.gl/..."
				/></label
			>
		</div>
	{/if}
	<p class="text-xs leading-5 text-[#5c554e]">
		Link Maps opsional. Salin link lokasi melalui menu Bagikan di Google Maps.
	</p>
</fieldset>
