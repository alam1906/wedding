<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
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
	import { toast } from '#lib/features/toast/index.js';

	type VerificationStatus = 'waiting' | 'confirming' | 'confirmed' | 'failed';

	const token = page.url.searchParams.get('token');
	const email = getAuthenticatedEmail();

	let status = $state<VerificationStatus>(token ? 'confirming' : 'waiting');
	let isResending = $state(false);
	let resendCountdown = $state(token ? 0 : 60);
	let isHandlingRealtimeVerification = false;

	async function handleRealtimeVerification() {
		if (isHandlingRealtimeVerification || status === 'confirming') {
			return;
		}

		isHandlingRealtimeVerification = true;

		try {
			await refreshAuthenticatedUser();

			if (isEmailVerified()) {
				toast.success('Email berhasil diverifikasi.');
				await goto('/user/dashboard', { replaceState: true });
			}
		} catch (error) {
			toast.error(
				error instanceof VerificationError
					? error.message
					: 'Status verifikasi gagal diperbarui. Silakan muat ulang halaman.'
			);
		} finally {
			isHandlingRealtimeVerification = false;
		}
	}

	async function confirmToken(verificationToken: string) {
		status = 'confirming';

		try {
			await confirmEmailVerification(verificationToken);

			if (isAuthenticated()) {
				await refreshAuthenticatedUser();

				if (isEmailVerified()) {
					await goto('/user/dashboard', { replaceState: true });
					return;
				}
			}

			status = 'confirmed';
		} catch (error) {
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
			resendCountdown = 60;
			toast.success('Email verifikasi berhasil dikirim ulang.');
		} catch (error) {
			toast.error(
				error instanceof VerificationError ? error.message : 'Email verifikasi gagal dikirim ulang.'
			);
		} finally {
			isResending = false;
		}
	}

	onMount(() => {
		let isMounted = true;
		let unsubscribeRealtime: (() => Promise<void>) | undefined;

		if (token) {
			void confirmToken(token);
		}

		if (isAuthenticated() && !isEmailVerified()) {
			void subscribeToEmailVerification(() => {
				void handleRealtimeVerification();
			})
				.then((unsubscribe) => {
					if (isMounted) {
						unsubscribeRealtime = unsubscribe;
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
			clearInterval(countdownTimer);
			void unsubscribeRealtime?.();
		};
	});
</script>

<svelte:head>
	<title>Verifikasi Email - Wedez</title>
	<meta name="description" content="Verifikasi alamat email akun Wedez Anda." />
</svelte:head>

<main class="relative grid min-h-screen place-items-center overflow-hidden bg-stone-50 px-4 py-12">
	<div
		class="pointer-events-none absolute -right-20 bottom-8 size-80 rounded-full bg-yellow-100/80 blur-3xl"
	></div>

	<section
		class="relative w-full max-w-md rounded-3xl border border-stone-200 bg-white/90 p-7 text-center shadow-xl shadow-stone-200/50 backdrop-blur sm:p-10"
	>
		<div class="mx-auto grid size-14 place-items-center rounded-2xl bg-yellow-100 text-yellow-900">
			<svg viewBox="0 0 24 24" class="size-7" fill="none" stroke="currentColor" aria-hidden="true">
				<rect x="3" y="5" width="18" height="14" rx="2" stroke-width="1.8"></rect>
				<path d="m4 7 8 6 8-6" stroke-width="1.8"></path>
			</svg>
		</div>

		{#if status === 'confirming'}
			<p class="mt-6 text-sm font-bold tracking-[0.18em] text-stone-500">WEDEZ</p>
			<h1 class="mt-3 text-2xl font-bold tracking-tight text-stone-900">Memverifikasi email</h1>
			<p class="mt-3 text-sm leading-6 text-stone-500">Mohon tunggu sebentar.</p>
			<div
				class="mx-auto mt-6 size-7 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900"
				aria-label="Memuat"
			></div>
		{:else if status === 'confirmed'}
			<p class="mt-6 text-sm font-bold tracking-[0.18em] text-emerald-700">BERHASIL</p>
			<h1 class="mt-3 text-2xl font-bold tracking-tight text-stone-900">
				Email telah diverifikasi
			</h1>
			<p class="mt-3 text-sm leading-6 text-stone-500">
				Silakan masuk untuk membuka dashboard undanganmu.
			</p>
			<a
				href="/login?next=/user/dashboard"
				class="mt-7 inline-flex w-full justify-center rounded-xl bg-stone-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-700"
			>
				Masuk dan lanjutkan
			</a>
		{:else}
			<p class="mt-6 text-sm font-bold tracking-[0.18em] text-stone-500">WEDEZ</p>
			<h1 class="mt-3 text-2xl font-bold tracking-tight text-stone-900">
				{status === 'failed' ? 'Verifikasi gagal' : 'Cek email Anda'}
			</h1>
			<p class="mt-3 text-sm leading-6 text-stone-500">
				{#if status === 'failed'}
					Link mungkin sudah kedaluwarsa. Kirim ulang email verifikasi untuk mendapatkan link baru.
				{:else}
					Kami telah mengirim link verifikasi{email ? ` ke ${email}` : ''}. Buka link tersebut untuk
					melanjutkan.
				{/if}
			</p>

			{#if email}
				<button
					type="button"
					disabled={isResending || resendCountdown > 0}
					aria-busy={isResending}
					onclick={resendVerification}
					class="mt-7 w-full rounded-xl border border-stone-300 bg-white px-4 py-3.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isResending
						? 'Sedang mengirim...'
						: resendCountdown > 0
							? `Kirim ulang dalam ${resendCountdown} detik`
							: 'Kirim ulang email'}
				</button>
			{/if}
		{/if}
	</section>
</main>
