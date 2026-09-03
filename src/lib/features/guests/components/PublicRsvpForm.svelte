<script lang="ts">
	import { onMount } from 'svelte';

	import {
		PublicRsvpError,
		getPublicGuestRsvp,
		getPublicRsvpMessages,
		submitPublicGuestRsvp
	} from '../api/public-rsvp.js';
	import type { PublicRsvpGuest, PublicRsvpMessage, PublicRsvpStatus } from '../model/guest.js';

	type Props = {
		slug: string;
		token: string;
	};

	const attendanceOptions: Array<{
		value: PublicRsvpStatus;
		title: string;
		description: string;
	}> = [
		{
			value: 'attending',
			title: 'Ya, saya hadir',
			description: 'Dengan senang hati datang merayakan.'
		},
		{
			value: 'not_attending',
			title: 'Maaf, belum bisa hadir',
			description: 'Tetap mengirimkan doa terbaik dari jauh.'
		}
	];

	let { slug, token }: Props = $props();
	let guest = $state<PublicRsvpGuest | null>(null);
	let attendance = $state<PublicRsvpStatus | ''>('');
	let message = $state('');
	let loading = $state(true);
	let submitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let messages = $state<PublicRsvpMessage[]>([]);
	let messagesPage = $state(1);
	let messagesHaveMore = $state(true);
	let messagesLoading = $state(false);
	let messagesError = $state('');

	const messageLength = $derived(message.length);

	onMount(() => {
		void loadGuest();
		void loadMessages();
	});

	async function loadMessages(): Promise<void> {
		if (messagesLoading || !messagesHaveMore) return;

		messagesLoading = true;
		messagesError = '';

		try {
			const result = await getPublicRsvpMessages(slug, messagesPage);
			messages = [...messages, ...result.items];
			messagesHaveMore = result.has_more;
			messagesPage += 1;
		} catch (error) {
			messagesError =
				error instanceof PublicRsvpError ? error.message : 'Ucapan tamu belum dapat dimuat.';
		} finally {
			messagesLoading = false;
		}
	}

	function refreshMessages(): void {
		messages = [];
		messagesPage = 1;
		messagesHaveMore = true;
		messagesError = '';
		void loadMessages();
	}

	function statusLabel(status: PublicRsvpMessage['rsvp_status']): string {
		if (status === 'attending') return 'Hadir';
		if (status === 'not_attending') return 'Tidak hadir';

		return 'Menunggu';
	}

	function statusClass(status: PublicRsvpMessage['rsvp_status']): string {
		if (status === 'attending') return 'bg-emerald-50 text-emerald-700';
		if (status === 'not_attending') return 'bg-rose-50 text-rose-700';

		return 'bg-gray-100 text-gray-600';
	}

	async function loadGuest(): Promise<void> {
		if (!token) {
			loading = false;
			return;
		}

		loading = true;
		errorMessage = '';

		try {
			guest = await getPublicGuestRsvp(slug, token);
			attendance =
				guest.rsvp_status === 'attending' || guest.rsvp_status === 'not_attending'
					? guest.rsvp_status
					: '';
			message = guest.message;
		} catch (error) {
			errorMessage =
				error instanceof PublicRsvpError ? error.message : 'Data RSVP belum dapat dimuat.';
		} finally {
			loading = false;
		}
	}

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		errorMessage = '';
		successMessage = '';

		if (!attendance) {
			errorMessage = 'Pilih konfirmasi kehadiran terlebih dahulu.';
			return;
		}

		submitting = true;

		try {
			guest = await submitPublicGuestRsvp({
				slug,
				token,
				rsvp_status: attendance,
				message
			});
			message = guest.message;
			successMessage = 'Terima kasih. Jawaban dan pesan Anda sudah tersimpan.';
			refreshMessages();
		} catch (error) {
			errorMessage =
				error instanceof PublicRsvpError ? error.message : 'Jawaban RSVP belum dapat dikirim.';
		} finally {
			submitting = false;
		}
	}
</script>

<section
	id="rsvp"
	class="relative isolate overflow-hidden bg-[#f2eee5] px-4 py-16 font-sans text-[#173b2c] sm:px-8 sm:py-20 lg:py-24"
>
	<div
		class="absolute -top-24 -left-24 -z-10 size-72 rounded-full bg-[#d9bb7b]/20 blur-3xl"
		aria-hidden="true"
	></div>
	<div
		class="absolute -right-24 -bottom-24 -z-10 size-80 rounded-full bg-[#9eb79f]/25 blur-3xl"
		aria-hidden="true"
	></div>

	<div class="mx-auto grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-2">
		<div
			data-reveal
			class="rounded-[1.75rem] border border-[#173b2c]/10 bg-white p-5 shadow-[0_24px_70px_rgba(23,59,44,0.10)] sm:rounded-4xl sm:p-8 lg:p-10"
		>
			<header class="mb-8 text-center sm:mb-10">
				<p class="text-xs font-bold tracking-[0.28em] text-[#8d6b2f] uppercase">
					Konfirmasi Kehadiran
				</p>
				<h2
					class="mt-4 text-3xl leading-tight font-semibold tracking-[-0.03em] text-[#173b2c] sm:text-4xl"
				>
					Ucapan & Doa
				</h2>
			</header>

			{#if !token}
				<div
					class="grid min-h-64 place-items-center rounded-3xl border border-dashed border-[#173b2c]/20 bg-[#faf8f3] p-6 text-center sm:p-8"
				>
					<div class="max-w-md">
						<span
							class="mx-auto grid size-14 place-items-center rounded-full bg-[#173b2c] text-white"
							aria-hidden="true"
						>
							<svg
								class="size-6"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
							>
								<rect x="5" y="10" width="14" height="10" rx="2"></rect>
								<path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
							</svg>
						</span>
						<h3 class="mt-5 text-xl font-semibold text-[#173b2c]">
							Tautan undangan pribadi diperlukan
						</h3>
						<p class="mt-3 leading-7 text-[#68786e]">
							Buka kembali tautan yang dikirimkan oleh mempelai agar form RSVP dapat mengenali
							undangan Anda.
						</p>
					</div>
				</div>
			{:else if loading}
				<div class="space-y-5" aria-label="Memuat form RSVP" aria-busy="true">
					<div class="h-7 w-2/5 animate-pulse rounded-full bg-[#173b2c]/10"></div>
					<div class="h-12 w-4/5 animate-pulse rounded-2xl bg-[#173b2c]/10"></div>
					<div class="grid gap-3 sm:grid-cols-2">
						<div class="h-28 animate-pulse rounded-2xl bg-[#173b2c]/10"></div>
						<div class="h-28 animate-pulse rounded-2xl bg-[#173b2c]/10"></div>
					</div>
					<div class="h-36 animate-pulse rounded-2xl bg-[#173b2c]/10"></div>
				</div>
			{:else if guest}
				<div>
					<p class="text-sm font-medium text-[#718077]">Undangan untuk</p>
					<h3 class="mt-1 text-3xl font-semibold tracking-[-0.02em] text-[#173b2c]">
						{guest.name}
					</h3>

					<form class="mt-8" onsubmit={handleSubmit}>
						<fieldset>
							<legend class="text-sm font-semibold text-[#294d3b]">Apakah Anda akan hadir?</legend>
							<div class="mt-3 grid gap-3 sm:grid-cols-2">
								{#each attendanceOptions as option (option.value)}
									<label
										class={`relative cursor-pointer rounded-2xl border p-4 transition-colors ${attendance === option.value ? 'border-[#173b2c] bg-[#edf3ed]' : 'border-[#173b2c]/15 bg-white hover:bg-[#faf8f3]'}`}
									>
										<input
											class="sr-only"
											type="radio"
											name="rsvp_status"
											value={option.value}
											bind:group={attendance}
										/>
										<span class="flex items-start gap-3">
											<span
												class={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${attendance === option.value ? 'border-[#173b2c] bg-[#173b2c]' : 'border-[#173b2c]/30'}`}
											>
												{#if attendance === option.value}<span
														class="size-1.5 rounded-full bg-white"
													></span>{/if}
											</span>
											<span>
												<span class="block text-sm font-semibold text-[#173b2c]"
													>{option.title}</span
												>
												<span class="mt-1 block text-xs leading-5 text-[#718077]"
													>{option.description}</span
												>
											</span>
										</span>
									</label>
								{/each}
							</div>
						</fieldset>

						<label class="mt-6 block" for="rsvp-message">
							<span
								class="flex items-center justify-between gap-4 text-sm font-semibold text-[#294d3b]"
							>
								<span>Doa dan pesan</span>
								<span class="font-normal text-[#819087]">{messageLength}/1000</span>
							</span>
							<textarea
								id="rsvp-message"
								class="mt-3 min-h-36 w-full resize-y rounded-2xl border border-[#173b2c]/15 bg-[#faf8f3] px-4 py-3 leading-7 text-[#173b2c] transition outline-none focus:border-[#173b2c] focus:ring-2 focus:ring-[#d9bb7b]/40"
								maxlength={1000}
								placeholder="Tuliskan doa terbaik untuk kedua mempelai..."
								bind:value={message}></textarea>
						</label>

						{#if errorMessage || successMessage}
							<div class="mt-4" aria-live="polite">
								{#if errorMessage}
									<p class="flex items-start gap-2 text-sm leading-6 text-red-700" role="alert">
										<span aria-hidden="true">●</span>{errorMessage}
									</p>
								{:else}
									<p
										class="flex items-start gap-2 text-sm leading-6 font-medium text-[#2f6d4a]"
										role="status"
									>
										<span aria-hidden="true">✓</span>{successMessage}
									</p>
								{/if}
							</div>
						{/if}

						<button
							class="mt-5 inline-flex min-h-13 w-full items-center justify-center rounded-full bg-[#173b2c] px-6 text-sm font-semibold text-white transition hover:bg-[#24523d] disabled:cursor-not-allowed disabled:opacity-60"
							type="submit"
							disabled={submitting}
						>
							{submitting ? 'Menyimpan jawaban...' : 'Kirim konfirmasi'}
						</button>
					</form>
				</div>
			{:else}
				<div
					class="grid min-h-64 place-items-center rounded-3xl bg-[#faf8f3] p-6 text-center sm:p-8"
				>
					<div class="max-w-md">
						<h3 class="text-xl font-semibold text-[#173b2c]">Form RSVP belum tersedia</h3>
						<p class="mt-3 leading-7 text-[#68786e]">
							{errorMessage || 'Silakan muat ulang halaman dan coba kembali.'}
						</p>
						<button
							class="mt-6 rounded-full border border-[#173b2c]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#173b2c] hover:bg-[#edf3ed]"
							type="button"
							onclick={loadGuest}>Coba lagi</button
						>
					</div>
				</div>
			{/if}
		</div>

		<aside data-reveal class="relative min-h-0">
			<div
				class="flex min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-[#173b2c]/10 bg-white shadow-[0_24px_70px_rgba(23,59,44,0.10)] sm:rounded-[2rem]"
			>
				<div
					class="min-h-72 flex-1 px-4 py-4 sm:px-6 sm:py-5"
					aria-label="Daftar ucapan tamu"
					aria-busy={messagesLoading}
				>
					{#if messages.length === 0 && messagesLoading}
						<div class="space-y-3">
							{#each [1, 2, 3] as item (item)}
								<div class="animate-pulse rounded-2xl bg-[#faf8f3] p-4">
									<div class="h-4 w-1/3 rounded-full bg-[#173b2c]/10"></div>
									<div class="mt-4 h-3 w-full rounded-full bg-[#173b2c]/10"></div>
									<div class="mt-2 h-3 w-4/5 rounded-full bg-[#173b2c]/10"></div>
								</div>
							{/each}
						</div>
					{:else if messages.length === 0 && messagesError}
						<div class="grid min-h-64 place-items-center px-4 text-center">
							<div>
								<p class="text-sm leading-6 text-rose-700">{messagesError}</p>
								<button
									class="mt-4 rounded-full border border-[#173b2c]/20 px-4 py-2 text-sm font-semibold text-[#173b2c] hover:bg-[#edf3ed]"
									type="button"
									onclick={loadMessages}>Coba lagi</button
								>
							</div>
						</div>
					{:else if messages.length === 0}
						<div class="grid min-h-64 place-items-center px-4 text-center">
							<div class="max-w-sm">
								<p class="font-semibold text-[#173b2c]">Belum ada ucapan</p>
								<p class="mt-2 text-sm leading-6 text-[#718077]">
									Jadilah yang pertama meninggalkan doa untuk kedua mempelai.
								</p>
							</div>
						</div>
					{:else}
						<div class="space-y-3">
							{#each messages as item (item)}
								<article class="rounded-2xl border border-[#173b2c]/8 bg-[#faf8f3] p-4 sm:p-5">
									<div class="flex items-center justify-between gap-3">
										<div class="flex min-w-0 items-center gap-3">
											<span
												class="grid size-9 shrink-0 place-items-center rounded-full bg-[#173b2c] text-sm font-semibold text-white"
												aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</span
											>
											<h3 class="truncate text-sm font-semibold text-[#173b2c]">{item.name}</h3>
										</div>
										<span
											class={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(item.rsvp_status)}`}
											>{statusLabel(item.rsvp_status)}</span
										>
									</div>
									<p class="mt-3 text-sm leading-6 whitespace-pre-wrap text-[#5f7065]">
										{item.message}
									</p>
								</article>
							{/each}
						</div>

						<div class="grid min-h-14 place-items-center" aria-live="polite">
							{#if messagesLoading}
								<p class="text-xs text-[#718077]">Memuat ucapan lainnya...</p>
							{:else if messagesError}
								<button
									class="rounded-full px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
									type="button"
									onclick={loadMessages}>Gagal memuat, coba lagi</button
								>
							{:else if messagesHaveMore}
								<button
									class="rounded-full border border-[#173b2c]/20 px-4 py-2 text-xs font-semibold text-[#173b2c] hover:bg-[#edf3ed]"
									type="button"
									onclick={loadMessages}>Muat lebih banyak</button
								>
							{:else if !messagesHaveMore}
								<p class="text-xs text-[#8a968e]">Semua ucapan sudah ditampilkan</p>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</aside>
	</div>
</section>
