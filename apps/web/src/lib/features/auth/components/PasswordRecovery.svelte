<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import AuthField from '#lib/components/auth/AuthField.svelte';
	import AuthFrame from '#lib/components/auth/AuthFrame.svelte';
	import { confirmPasswordReset, PasswordError, requestPasswordReset } from '../api/password.js';

	let { mode }: { mode: 'request' | 'reset' } = $props();
	const isReset = $derived(mode === 'reset');
	// The fragment keeps the reset token out of HTTP requests and referrer URLs.
	const token = $derived(
		new URLSearchParams(page.url.hash.slice(1)).get('token') ||
			page.url.searchParams.get('token') ||
			''
	);
	let isSubmitting = $state(false);
	let isComplete = $state(false);
	let errorMessage = $state('');
	const title = $derived(isReset ? 'Atur ulang kata sandi' : 'Lupa kata sandi');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (isSubmitting || isComplete || !(event.currentTarget instanceof HTMLFormElement)) return;
		const form = event.currentTarget;
		const data = new FormData(form);
		isSubmitting = true;
		errorMessage = '';
		try {
			if (isReset) {
				await confirmPasswordReset(
					token,
					String(data.get('password') || ''),
					String(data.get('passwordConfirm') || '')
				);
				form.reset();
				await goto('/reset-password', { shallow: true, replace: true });
				isComplete = true;
			} else {
				await requestPasswordReset(String(data.get('email') || ''));
				isComplete = true;
			}
		} catch (error) {
			errorMessage =
				error instanceof PasswordError ? error.message : 'Permintaan gagal. Silakan coba lagi.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{title} — Wedez</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="referrer" content="no-referrer" />
</svelte:head>

<AuthFrame {title}>
	{#if isComplete}
		<p class="auth-notice auth-notice-success mt-6" role="status">
			{isReset
				? 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.'
				: 'Jika email terdaftar, link pemulihan akan dikirim. Periksa kotak masuk dan folder spam.'}
		</p>
	{:else if isReset && !token}
		<p class="auth-notice auth-notice-error mt-6" role="alert">
			Link pemulihan tidak valid. Silakan minta link baru.
		</p>
		<a href="/forgot-password" class="auth-link mt-5 block text-center text-sm"
			>Minta link pemulihan baru</a
		>
	{:else}
		<p class="mt-4 text-sm leading-6 text-[#57534e]">
			{isReset
				? 'Buat kata sandi baru minimal 8 karakter.'
				: 'Masukkan email akun untuk menerima link pemulihan kata sandi.'}
		</p>
		<form class="mt-6 space-y-5" onsubmit={submit}>
			{#if isReset}
				<AuthField
					id="password"
					name="password"
					label="Kata sandi baru"
					type="password"
					autocomplete="new-password"
					disabled={isSubmitting}
					required
				/>
				<AuthField
					id="passwordConfirm"
					name="passwordConfirm"
					label="Konfirmasi kata sandi baru"
					type="password"
					autocomplete="new-password"
					disabled={isSubmitting}
					required
				/>
			{:else}
				<AuthField
					id="email"
					name="email"
					label="Email"
					type="email"
					autocomplete="email"
					placeholder="nama@email.com"
					disabled={isSubmitting}
					required
				/>
			{/if}
			{#if errorMessage}
				<p class="auth-notice auth-notice-error" role="alert">
					{errorMessage}
				</p>
				{#if isReset}
					<a href="/forgot-password" class="auth-link block text-sm">Minta link pemulihan baru</a>
				{/if}
			{/if}
			<button
				type="submit"
				disabled={isSubmitting}
				aria-busy={isSubmitting}
				class="auth-button auth-button-pink w-full"
			>
				{isSubmitting
					? 'Memproses...'
					: isReset
						? 'Simpan kata sandi baru'
						: 'Kirim link pemulihan'}
			</button>
		</form>
	{/if}
	<a href="/login" class="auth-link mt-6 block text-center text-sm">Kembali ke halaman masuk</a>
</AuthFrame>
