<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		getPublicGuestRsvp,
		getPublicRsvpMessages,
		submitPublicGuestRsvp,
		PublicRsvpError,
		type PublicRsvpGuest,
		type PublicRsvpMessage,
		type PublicRsvpStatus
	} from '#lib/features/guests/index.js';

	let { slug, token, onLayoutChange }: { slug: string; token: string; onLayoutChange: () => void } =
		$props();
	let guest = $state<PublicRsvpGuest | null>(null);
	let attendance = $state<PublicRsvpStatus | ''>('');
	let message = $state('');
	let loading = $state(true);
	let sending = $state(false);
	let errorMessage = $state('');
	let feedback = $state('');
	let messages = $state<PublicRsvpMessage[]>([]);
	let messagesLoading = $state(false);
	let messagesError = $state('');
	let hasMore = $state(true);
	let messagePage = 1;
	let messageRequest = 0;
	let disposed = false;

	onMount(() => {
		void loadGuest();
		void loadMessages();
		return () => {
			disposed = true;
			messageRequest += 1;
		};
	});

	async function layoutChanged() {
		await tick();
		if (!disposed) onLayoutChange();
	}
	function errorText(error: unknown) {
		return error instanceof PublicRsvpError
			? error.message
			: 'Belum dapat diproses. Silakan coba kembali.';
	}
	async function loadGuest() {
		if (!token) {
			loading = false;
			return;
		}
		loading = true;
		errorMessage = '';
		try {
			const result = await getPublicGuestRsvp(slug, token);
			if (disposed) return;
			guest = result;
			attendance = result.rsvp_status === 'pending' ? '' : result.rsvp_status;
			message = result.message;
		} catch (error) {
			if (!disposed) errorMessage = errorText(error);
		} finally {
			if (!disposed) {
				loading = false;
				void layoutChanged();
			}
		}
	}
	async function loadMessages(reset = false) {
		if (!reset && (messagesLoading || !hasMore)) return;
		const request = ++messageRequest;
		if (reset) {
			messagePage = 1;
			hasMore = true;
		}
		messagesLoading = true;
		messagesError = '';
		try {
			const result = await getPublicRsvpMessages(slug, messagePage);
			if (disposed || request !== messageRequest) return;
			messages = reset ? result.items : [...messages, ...result.items];
			hasMore = result.has_more;
			messagePage += 1;
		} catch (error) {
			if (!disposed && request === messageRequest) messagesError = errorText(error);
		} finally {
			if (!disposed && request === messageRequest) {
				messagesLoading = false;
				void layoutChanged();
			}
		}
	}
	function messagesScrolled(event: Event) {
		const viewport = event.currentTarget as HTMLElement;
		const remaining = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
		if (remaining <= 80) void loadMessages();
	}
	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (sending || !guest) return;
		if (!attendance) {
			errorMessage = 'Pilih konfirmasi kehadiran terlebih dahulu.';
			return;
		}
		sending = true;
		errorMessage = '';
		feedback = '';
		try {
			const result = await submitPublicGuestRsvp({ slug, token, rsvp_status: attendance, message });
			if (disposed) return;
			guest = result;
			message = result.message;
			feedback = 'Jawaban dan ucapan Anda sudah tersimpan.';
			void loadMessages(true);
		} catch (error) {
			if (!disposed) errorMessage = errorText(error);
		} finally {
			if (!disposed) {
				sending = false;
				void layoutChanged();
			}
		}
	}
</script>

<section class="pramesti-section" aria-labelledby="pramesti-rsvp-title">
	<header class="pramesti-heading" data-pramesti-reveal>
		<h2 id="pramesti-rsvp-title">RSVP</h2>
	</header>
	<div class="pramesti-panel pramesti-response" data-pramesti-reveal>
		{#if loading}<p role="status">Memuat data tamu...</p>
		{:else if !token}<p>Gunakan tautan undangan pribadi Anda untuk mengisi RSVP.</p>
		{:else if !guest}
			<p role="alert">{errorMessage}</p>
			<button type="button" class="pramesti-outline" onclick={loadGuest}>Coba lagi</button>
		{:else}
			<form onsubmit={submit}>
				<label for="pramesti-guest-name">Nama tamu</label>
				<input id="pramesti-guest-name" value={guest.name} readonly />
				<fieldset disabled={sending}>
					<legend>Konfirmasi kehadiran</legend>
					<div class="pramesti-attendance">
						<label class:chosen={attendance === 'attending'}
							><input
								type="radio"
								name="pramesti-attendance"
								value="attending"
								bind:group={attendance}
								required
							/>Ya, saya hadir</label
						>
						<label class:chosen={attendance === 'not_attending'}
							><input
								type="radio"
								name="pramesti-attendance"
								value="not_attending"
								bind:group={attendance}
								required
							/>Maaf, tidak bisa hadir</label
						>
					</div>
				</fieldset>
				<div class="pramesti-field-label">
					<label for="pramesti-message">Ucapan &amp; Doa</label><span>{message.length}/1000</span>
				</div>
				<textarea
					id="pramesti-message"
					rows="4"
					maxlength="1000"
					bind:value={message}
					disabled={sending}></textarea>
				<button class="pramesti-button" type="submit" disabled={sending}
					>{sending ? 'Mengirim...' : 'Kirim RSVP'}</button
				>
				{#if errorMessage}<p class="pramesti-error" role="alert">{errorMessage}</p>{/if}
				{#if feedback}<p role="status">{feedback}</p>{/if}
			</form>
		{/if}
	</div>
</section>

<section class="pramesti-section" aria-labelledby="pramesti-wishes-title">
	<header class="pramesti-heading" data-pramesti-reveal>
		<h2 id="pramesti-wishes-title">Ucapan &amp; Doa</h2>
	</header>
	<div class="pramesti-panel pramesti-wishes-card" data-pramesti-reveal>
		<div
			class="pramesti-wishes"
			role="region"
			aria-label="Daftar ucapan dan doa"
			onscroll={messagesScrolled}
		>
			{#each messages as wish, index (index)}
				<article class="pramesti-wish">
					<div>
						<h3>{wish.name}</h3>
						<span class="pramesti-attendance-status"
							>{wish.rsvp_status === 'attending'
								? 'Hadir'
								: wish.rsvp_status === 'not_attending'
									? 'Tidak hadir'
									: 'Menunggu konfirmasi'}</span
						>
					</div>
					<p>{wish.message}</p>
				</article>
			{/each}
			<div class="pramesti-messages-state">
				{#if messagesLoading}<p role="status">Memuat ucapan...</p>{/if}
				{#if messagesError}<p class="pramesti-error" role="alert">{messagesError}</p>
					<button class="pramesti-outline" type="button" onclick={() => loadMessages()}
						>Coba lagi</button
					>
				{:else if !messagesLoading && !messages.length}<p>Belum ada ucapan.</p>{/if}
			</div>
		</div>
	</div>
</section>
