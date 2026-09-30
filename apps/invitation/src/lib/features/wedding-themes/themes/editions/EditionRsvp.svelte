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
	let wishesViewport = $state<HTMLDivElement>();
	let wishesList = $state<HTMLDivElement>();
	let wishesMaxHeight = $state<number>();
	let resizeObserver: ResizeObserver | undefined;

	function measureWishes() {
		if (!wishesList || disposed) return;
		const visible = Array.from(wishesList.querySelectorAll<HTMLElement>('.edition-wish')).slice(
			0,
			5
		);
		wishesMaxHeight =
			visible.length === 5
				? Math.ceil(visible.reduce((sum, row) => sum + row.offsetHeight, 0))
				: undefined;
	}

	onMount(() => {
		void loadGuest();
		void loadMessages();
		resizeObserver = new ResizeObserver(measureWishes);
		if (wishesList) resizeObserver.observe(wishesList);
		void document.fonts.ready.then(measureWishes);
		return () => {
			disposed = true;
			resizeObserver?.disconnect();
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
			hasMore = result.has_more && result.items.length > 0;
			messagePage += 1;
		} catch (error) {
			if (!disposed && request === messageRequest) messagesError = errorText(error);
		} finally {
			if (!disposed && request === messageRequest) {
				messagesLoading = false;
				await layoutChanged();
				if (!disposed && request === messageRequest) {
					measureWishes();
					if (
						!messagesError &&
						hasMore &&
						(messages.length < 6 ||
							(wishesViewport && wishesViewport.scrollHeight <= wishesViewport.clientHeight + 1))
					)
						void loadMessages();
				}
			}
		}
	}
	function messagesScrolled(event: Event) {
		const viewport = event.currentTarget as HTMLElement;
		const remaining = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
		if (remaining <= 80 && !messagesError) void loadMessages();
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

<section class="edition-section edition-rsvp-section" aria-labelledby="edition-rsvp-title">
	<header class="edition-heading" data-edition-reveal>
		<h2 id="edition-rsvp-title">RSVP</h2>
	</header>
	<div class="edition-response edition-panel" data-edition-reveal>
		{#if loading}<p role="status">Memuat data tamu...</p>
		{:else if !token}<p>Gunakan tautan undangan pribadi Anda untuk mengisi RSVP.</p>
		{:else if !guest}
			<p role="alert">{errorMessage}</p>
			<button type="button" class="edition-outline" onclick={loadGuest}>Coba lagi</button>
		{:else}
			<form onsubmit={submit}>
				<label for="edition-guest-name">Nama tamu</label>
				<input id="edition-guest-name" value={guest.name} readonly />
				<fieldset disabled={sending}>
					<legend>Konfirmasi kehadiran</legend>
					<div class="edition-attendance">
						<label class:chosen={attendance === 'attending'}
							><input
								type="radio"
								name="edition-attendance"
								value="attending"
								bind:group={attendance}
								required
							/>Ya, saya hadir</label
						>
						<label class:chosen={attendance === 'not_attending'}
							><input
								type="radio"
								name="edition-attendance"
								value="not_attending"
								bind:group={attendance}
								required
							/>Maaf, tidak bisa hadir</label
						>
					</div>
				</fieldset>
				<div class="edition-field-label">
					<label for="edition-message">Ucapan &amp; Doa</label><span>{message.length}/1000</span>
				</div>
				<textarea
					id="edition-message"
					rows="4"
					maxlength="1000"
					bind:value={message}
					disabled={sending}></textarea>
				<button class="edition-button" type="submit" disabled={sending}
					>{sending ? 'Mengirim...' : 'Kirim RSVP'}</button
				>
				{#if errorMessage}<p class="edition-error" role="alert">{errorMessage}</p>{/if}
				{#if feedback}<p role="status">{feedback}</p>{/if}
			</form>
		{/if}
	</div>
</section>

<section class="edition-section edition-wishes-section" aria-labelledby="edition-wishes-title">
	<header class="edition-heading" data-edition-reveal>
		<h2 id="edition-wishes-title">Ucapan &amp; Doa</h2>
	</header>
	<div class="edition-panel edition-wishes-card" data-edition-reveal>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users must be able to scroll this region.) -->
		<div
			class="edition-wishes"
			tabindex="0"
			bind:this={wishesViewport}
			style:max-height={wishesMaxHeight ? `${wishesMaxHeight}px` : undefined}
			role="region"
			aria-label="Daftar ucapan dan doa"
			onscroll={messagesScrolled}
		>
			<div class="edition-wishes-list" bind:this={wishesList}>
				{#each messages as wish, index (index)}
					<article class="edition-wish">
						<div>
							<h3>{wish.name}</h3>
							<span class="edition-attendance-status"
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
			</div>
			<div class="edition-messages-state">
				{#if messagesLoading}<p role="status">Memuat ucapan...</p>{/if}
				{#if messagesError}<p class="edition-error" role="alert">{messagesError}</p>
					<button class="edition-outline" type="button" onclick={() => loadMessages()}
						>Coba lagi</button
					>
				{:else if !messagesLoading && !messages.length}<p>Belum ada ucapan.</p>{/if}
			</div>
		</div>
	</div>
</section>
