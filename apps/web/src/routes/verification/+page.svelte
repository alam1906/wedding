<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import AuthFrame from '#lib/components/auth/AuthFrame.svelte';
	import {
		confirmEmailVerification,
		getAuthenticatedEmail,
		isAuthenticated,
		isEmailVerified,
		refreshAuthenticatedUser,
		requestEmailVerification,
		subscribeToEmailVerification,
		VerificationError
	} from '#lib/features/auth/index.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	import { postLoginDestination, safeDestination } from '#lib/features/auth/model/navigation.js';

	type VerificationStatus = 'waiting' | 'confirming' | 'confirmed' | 'failed';

	const toast = getToastContext();
	const token = page.url.searchParams.get('token');
	const email = getAuthenticatedEmail();

	let status = $state<VerificationStatus>(token ? 'confirming' : 'waiting');
	let isResending = $state(false);
	let resendCountdown = $state(token ? 0 : 60);
	let isMounted = false;
	let refreshController: AbortController | undefined;
	let isRefreshingVerification = false;
	let refreshQueued = false;

	async function refreshVerification() {
		if (
			!isMounted ||
			!isAuthenticated() ||
			getAuthenticatedEmail() !== email ||
			status === 'confirming'
		) {
			return;
		}

		if (isRefreshingVerification) {
			refreshQueued = true;
			return;
		}

		isRefreshingVerification = true;

		try {
			await refreshAuthenticatedUser(refreshController?.signal);

			if (isMounted && getAuthenticatedEmail() === email && isEmailVerified()) {
				toast.success('Email berhasil diverifikasi.');
				await goto(postLoginDestination(page.url.searchParams.get('next')), { replaceState: true });
			}
		} catch (error) {
			if (isMounted) {
				toast.error(
					error instanceof VerificationError
						? error.message
						: 'Status verifikasi gagal diperbarui. Silakan muat ulang halaman.'
				);
			}
		} finally {
			isRefreshingVerification = false;
			if (refreshQueued) {
				refreshQueued = false;
				if (isMounted && !isEmailVerified()) void refreshVerification();
			}
		}
	}

	async function confirmToken(verificationToken: string) {
		status = 'confirming';

		try {
			await confirmEmailVerification(verificationToken);
			if (!isMounted) return;

			if (isAuthenticated() && getAuthenticatedEmail() === email) {
				await refreshAuthenticatedUser(refreshController?.signal);
				if (!isMounted) return;

				if (isEmailVerified()) {
					await goto(postLoginDestination(page.url.searchParams.get('next')), {
						replaceState: true
					});
					return;
				}
			}

			status = 'confirmed';
		} catch (error) {
			if (!isMounted) return;
			status = 'failed';
			toast.error(
				error instanceof VerificationError
					? error.message
					: 'Email gagal diverifikasi. Silakan coba lagi.'
			);
		}
	}

	async function resendVerification() {
		if (!email || isResending || resendCountdown > 0) {
			return;
		}

		isResending = true;

		try {
			await requestEmailVerification(email);
			if (!isMounted) return;
			resendCountdown = 60;
			toast.success('Email verifikasi berhasil dikirim ulang.');
		} catch (error) {
			if (!isMounted) return;
			toast.error(
				error instanceof VerificationError ? error.message : 'Email verifikasi gagal dikirim ulang.'
			);
		} finally {
			isResending = false;
		}
	}

	onMount(() => {
		isMounted = true;
		refreshController = new AbortController();
		let unsubscribeRealtime: (() => Promise<void>) | undefined;
		const refreshWhenVisible = () => {
			if (document.visibilityState === 'visible') void refreshVerification();
		};

		if (token) {
			void confirmToken(token);
		} else {
			void refreshVerification();
		}
		window.addEventListener('focus', refreshWhenVisible);
		window.addEventListener('online', refreshWhenVisible);
		document.addEventListener('visibilitychange', refreshWhenVisible);

		if (isAuthenticated() && !isEmailVerified()) {
			void subscribeToEmailVerification(() => {
				void refreshVerification();
			})
				.then((unsubscribe) => {
					if (isMounted) {
						unsubscribeRealtime = unsubscribe;
						// Cover verification between the initial request and subscription setup.
						void refreshVerification();
					} else {
						void unsubscribe();
					}
				})
				.catch((error) => {
					if (isMounted) {
						toast.error(
							error instanceof VerificationError
								? error.message
								: 'Pemantauan status verifikasi gagal dimulai.'
						);
					}
				});
		}

		const countdownTimer = setInterval(() => {
			if (resendCountdown > 0) {
				resendCountdown -= 1;
			}
		}, 1_000);

		return () => {
			isMounted = false;
			refreshController?.abort();
			window.removeEventListener('focus', refreshWhenVisible);
			window.removeEventListener('online', refreshWhenVisible);
			document.removeEventListener('visibilitychange', refreshWhenVisible);
			clearInterval(countdownTimer);
			void unsubscribeRealtime?.();
		};
	});
</script>

<svelte:head>
	<title>Verifikasi Email - Wedez</title>
	<meta name="description" content="Verifikasi alamat email akun Wedez Anda." />
</svelte:head>

<AuthFrame
	title={status === 'confirming'
		? 'Memverifikasi email'
		: status === 'confirmed'
			? 'Email telah diverifikasi'
			: status === 'failed'
				? 'Verifikasi gagal'
				: 'Cek email Anda'}
>
	{#if status === 'confirming'}
		<p class="mt-4 text-center text-sm leading-6 text-[#57534e]" role="status">
			Mohon tunggu sebentar.
		</p>
		<div
			class="mx-auto mt-6 size-7 animate-spin rounded-full border-[3px] border-[#ffd1e6] border-t-[#191919]"
			aria-label="Memuat"
		></div>
	{:else if status === 'confirmed'}
		<p class="auth-notice auth-notice-success mt-6 text-center" role="status">
			Silakan masuk untuk melanjutkan ke akun Wedez.
		</p>
		<a
			href={`/login?next=${encodeURIComponent(safeDestination(page.url.searchParams.get('next')))}`}
			class="auth-button mt-7 w-full"
		>
			Masuk dan lanjutkan
		</a>
	{:else}
		<p class="mt-4 text-center text-sm leading-6 break-words text-[#57534e]">
			{#if status === 'failed'}
				Link mungkin sudah kedaluwarsa. Kirim ulang email verifikasi untuk mendapatkan link baru.
			{:else}
				Kami telah mengirim link verifikasi{email ? ` ke ${email}` : ''}.
			{/if}
		</p>

		{#if status === 'waiting'}
			<p class="auth-notice auth-notice-info mt-5 text-center">
				Link verifikasi mungkin masuk ke folder <strong class="font-semibold">Spam</strong>
			</p>
		{/if}

		{#if email}
			<button
				type="button"
				disabled={isResending || resendCountdown > 0}
				aria-busy={isResending}
				onclick={resendVerification}
				class="auth-button auth-button-pink mt-7 w-full"
			>
				{isResending
					? 'Sedang mengirim...'
					: resendCountdown > 0
						? `Kirim ulang dalam ${resendCountdown} detik`
						: 'Kirim ulang email'}
			</button>
		{/if}
	{/if}
</AuthFrame>
