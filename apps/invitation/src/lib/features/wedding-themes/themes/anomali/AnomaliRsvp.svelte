<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getPublicGuestRsvp,
		getPublicRsvpMessages,
		submitPublicGuestRsvp,
		PublicRsvpError,
		type PublicRsvpGuest,
		type PublicRsvpMessage,
		type PublicRsvpStatus
	} from '#lib/features/guests/index.js';

	let {
		slug,
		token,
		onLayoutChange
	}: {
		slug: string;
		token: string;
		onLayoutChange: () => void;
	} = $props();

	let guest = $state<PublicRsvpGuest | null>(null);
	let attendance = $state<PublicRsvpStatus | ''>('');
	let message = $state('');
	let loading = $state(true);
	let sending = $state(false);
	let guestError = $state('');
	let feedback = $state('');
	let messages = $state<PublicRsvpMessage[]>([]);
	let messagesLoading = $state(false);
	let messagesError = $state('');
	let hasMore = $state(true);
	let messagePage = 1;
	let content = $state<HTMLDivElement>();
	let disposed = false;
	let messageRequest = 0;

	onMount(() => {
		void loadGuest();
		void loadMessages();
		const observer = new ResizeObserver(onLayoutChange);
		if (content) observer.observe(content);
		return () => {
			disposed = true;
			messageRequest += 1;
			observer.disconnect();
		};
	});

	async function loadGuest(): Promise<void> {
		if (!token) {
			loading = false;
			return;
		}
		loading = true;
		guestError = '';
		try {
			const result = await getPublicGuestRsvp(slug, token);
			if (disposed) return;
			guest = result;
			attendance = result.rsvp_status === 'pending' ? '' : result.rsvp_status;
			message = result.message;
		} catch (error) {
			if (!disposed)
				guestError =
					error instanceof PublicRsvpError ? error.message : 'Data RSVP belum dapat dimuat.';
		} finally {
			if (!disposed) loading = false;
		}
	}

	async function loadMessages(reset = false): Promise<void> {
		if (!reset && (messagesLoading || !hasMore)) return;
		const request = ++messageRequest;
		messagesLoading = true;
		messagesError = '';
		const requestedPage = reset ? 1 : messagePage;
		try {
			const result = await getPublicRsvpMessages(slug, requestedPage);
			if (disposed || request !== messageRequest) return;
			messages = reset ? result.items : [...messages, ...result.items];
			hasMore = result.has_more;
			messagePage = requestedPage + 1;
		} catch (error) {
			if (!disposed && request === messageRequest) {
				messagesError =
					error instanceof PublicRsvpError ? error.message : 'Ucapan belum dapat dimuat.';
			}
		} finally {
			if (!disposed && request === messageRequest) messagesLoading = false;
		}
	}

	async function submit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (sending) return;
		feedback = '';
		if (!attendance) {
			feedback = 'Pilih kehadiran terlebih dahulu.';
			return;
		}
		sending = true;
		try {
			const result = await submitPublicGuestRsvp({ slug, token, rsvp_status: attendance, message });
			if (disposed) return;
			guest = result;
			message = result.message;
			feedback = 'Jawaban dan ucapan Anda sudah tersimpan.';
			void loadMessages(true);
		} catch (error) {
			if (!disposed)
				feedback = error instanceof PublicRsvpError ? error.message : 'RSVP belum dapat dikirim.';
		} finally {
			if (!disposed) sending = false;
		}
	}
</script>

<div class="rsvp-layout" bind:this={content}>
	<div class="response-paper">
		<h3>Konfirmasi Kehadiran</h3>
		{#if loading}
			<p class="notice" role="status">Memuat RSVP…</p>
		{:else if !token}
			<p class="notice">
				Gunakan tautan undangan pribadi yang dikirimkan mempelai untuk mengisi RSVP.
			</p>
		{:else if !guest}
			<p class="notice" role="status">{guestError}</p>
			<button type="button" class="text-button" onclick={loadGuest}>Coba lagi</button>
		{:else}
			<form onsubmit={submit}>
				<p class="guest-name">{guest.name}</p>
				<fieldset>
					<legend>Apakah Anda akan hadir?</legend>
					<label class:chosen={attendance === 'attending'}>
						<input
							type="radio"
							name="anomali-attendance"
							value="attending"
							bind:group={attendance}
						/>
						<span>Ya, saya hadir</span>
					</label>
					<label class:chosen={attendance === 'not_attending'}>
						<input
							type="radio"
							name="anomali-attendance"
							value="not_attending"
							bind:group={attendance}
						/>
						<span>Maaf, tidak bisa hadir</span>
					</label>
				</fieldset>
				<label class="message-field">
					<span>Ucapan &amp; Doa <small>{message.length}/1000</small></span>
					<textarea
						bind:value={message}
						maxlength={1000}
						rows="4"
						placeholder="Tulis ucapan untuk mempelai"></textarea>
				</label>
				<button class="submit-button" type="submit" disabled={sending}
					>{sending ? 'Mengirim…' : 'Kirim RSVP'}</button
				>
				<p class="feedback" role="status">{feedback}</p>
			</form>
		{/if}
	</div>
	<div class="wishes-paper">
		<h3>Ucapan Tamu</h3>
		<div class="wishes-list" aria-busy={messagesLoading}>
			{#each messages as item, index (index)}
				<article class="wish">
					<div class="wish-heading">
						<h4>{item.name}</h4>
						{#if item.rsvp_status !== 'pending'}
							<span>{item.rsvp_status === 'attending' ? 'Hadir' : 'Tidak hadir'}</span>
						{/if}
					</div>
					<p>{item.message}</p>
				</article>
			{:else}
				<p class="notice">
					{messagesLoading ? 'Memuat ucapan…' : messagesError || 'Belum ada ucapan.'}
				</p>
			{/each}
		</div>
		{#if messagesError && messages.length}
			<p class="feedback" role="status">{messagesError}</p>
		{/if}
		{#if hasMore || messagesError}
			<button
				class="text-button"
				type="button"
				disabled={messagesLoading}
				onclick={() => loadMessages()}
			>
				{messagesLoading ? 'Memuat…' : messagesError ? 'Coba lagi' : 'Muat ucapan lain'}
			</button>
		{/if}
	</div>
</div>

<style>
	.rsvp-layout {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.5rem;
		align-items: start;
		color: var(--a-ink);
	}
	h3,
	h4,
	p {
		margin: 0;
	}
	h3 {
		font:
			400 clamp(1.6rem, 2.6vw, 2.25rem)/1.2 Georgia,
			serif;
		letter-spacing: -0.025em;
	}
	.response-paper,
	.wishes-paper {
		padding: clamp(1.5rem, 3.5vw, 3rem);
		min-width: 0;
		background: var(--a-surface);
		border: 1px solid var(--a-line);
	}
	form {
		margin-top: 2rem;
	}
	.guest-name {
		font:
			400 1.7rem/1.25 Georgia,
			serif;
		overflow-wrap: anywhere;
		margin-bottom: 1.6rem;
	}
	fieldset {
		margin: 0 0 1.6rem;
		padding: 0;
		border: 0;
	}
	legend {
		font-size: 0.82rem;
		margin-bottom: 0.85rem;
		color: var(--a-muted);
	}
	fieldset label {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 1rem;
		border: 1px solid var(--a-line);
		font-size: 0.83rem;
		cursor: pointer;
		margin-top: 0.6rem;
		transition:
			background 0.2s,
			border-color 0.2s;
	}
	label.chosen {
		background: var(--a-soft);
		border-color: #6b8070;
	}
	input[type='radio'] {
		width: 1rem;
		height: 1rem;
		color: var(--a-ink);
		accent-color: var(--a-ink);
		flex: none;
	}
	.message-field {
		display: grid;
		gap: 0.7rem;
	}
	.message-field > span {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.82rem;
		color: var(--a-muted);
	}
	small {
		font-size: 0.65rem;
	}
	textarea {
		box-sizing: border-box;
		width: 100%;
		min-height: 8rem;
		border: 1px solid var(--a-line);
		border-radius: 0;
		padding: 1rem;
		resize: vertical;
		background: transparent;
		color: var(--a-ink);
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.65;
	}
	textarea::placeholder {
		color: #798178;
		font-size: 0.8rem;
	}
	textarea:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--a-accent);
		outline-offset: 3px;
	}
	button {
		font: inherit;
		cursor: pointer;
	}
	button:disabled {
		cursor: wait;
		opacity: 0.55;
	}
	.submit-button {
		margin-top: 1.25rem;
		border: 1px solid var(--a-ink);
		padding: 1rem 1.3rem;
		width: 100%;
		background: var(--a-ink);
		color: var(--a-paper);
		font-size: 0.78rem;
		font-weight: 500;
		letter-spacing: 0.05em;
		transition: background 0.25s;
	}
	.submit-button:hover {
		background: #365446;
	}
	.feedback,
	.notice {
		font-size: 0.82rem;
		line-height: 1.75;
		overflow-wrap: anywhere;
		color: var(--a-muted);
	}
	.feedback {
		min-height: 1.5em;
		margin-top: 0.75rem;
	}
	.notice {
		margin-top: 1.5rem;
	}
	.wishes-list {
		margin-top: 1.75rem;
	}
	.wish {
		border-top: 1px solid var(--a-line);
		padding: 1.4rem 0;
	}
	.wish-heading {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	.wish h4 {
		font:
			400 1.45rem/1.25 Georgia,
			serif;
		overflow-wrap: anywhere;
	}
	.wish-heading > span {
		font-size: 0.63rem;
		white-space: nowrap;
		color: var(--a-muted);
	}
	.wish p {
		margin-top: 0.8rem;
		font-size: 0.85rem;
		line-height: 1.85;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		color: var(--a-muted);
	}
	.text-button {
		padding: 0.7rem 0;
		border: 0;
		border-bottom: 1px solid var(--a-accent);
		background: transparent;
		color: inherit;
		font-size: 0.78rem;
	}
	@media (max-width: 760px) {
		.rsvp-layout {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.25rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		label,
		button {
			transition: none;
		}
	}
</style>
