<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		isEmailVerified,
		LoginError,
		loginWithPassword,
		RegisterError,
		registerWithPassword,
		requestEmailVerification,
		validateLogin,
		validateRegister,
		VerificationError,
		type LoginFieldErrors,
		type LoginInput,
		type RegisterFieldErrors,
		type RegisterInput
	} from '#lib/features/auth/index.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	import AuthField from './AuthField.svelte';

	type Props = {
		mode: 'login' | 'register';
	};

	const toast = getToastContext();
	let { mode }: Props = $props();
	let isSubmitting = $state(false);
	let loginFieldErrors = $state<LoginFieldErrors>({});
	let registerFieldErrors = $state<RegisterFieldErrors>({});

	const isLogin = $derived(mode === 'login');
	const content = $derived(
		isLogin
			? {
					title: 'Selamat datang',
					description: 'Masuk untuk mengelola undangan pernikahanmu.',
					submitLabel: 'Masuk',
					metaTitle: 'Masuk - Wedez',
					metaDescription: 'Masuk ke akun Wedez untuk mengelola undangan pernikahan.'
				}
			: {
					title: 'Buat akun',
					description: 'Daftar untuk mulai membuat undangan pernikahanmu.',
					submitLabel: 'Daftar',
					metaTitle: 'Daftar - Wedez',
					metaDescription: 'Buat akun Wedez untuk mulai menyiapkan undangan pernikahan.'
				}
	);

	async function submitAuth(event: SubmitEvent) {
		event.preventDefault();

		const form = event.currentTarget;

		if (!(form instanceof HTMLFormElement)) {
			return;
		}

		if (!isLogin) {
			if (isSubmitting) {
				return;
			}

			registerFieldErrors = {};
			const formData = new FormData(form);
			const validation = validateRegister({
				name: formData.get('name'),
				email: formData.get('email'),
				password: formData.get('password'),
				passwordConfirm: formData.get('passwordConfirm')
			});

			if (!validation.success) {
				registerFieldErrors = validation.errors;
				return;
			}

			isSubmitting = true;

			try {
				await registerWithPassword(validation.data);
				toast.success('Akun berhasil dibuat. Silakan masuk untuk melanjutkan verifikasi.');
				await goto('/login?next=/verification');
			} catch (error) {
				toast.error(
					error instanceof RegisterError
						? error.message
						: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.'
				);
			} finally {
				isSubmitting = false;
			}

			return;
		}

		if (isSubmitting) {
			return;
		}

		loginFieldErrors = {};

		const formData = new FormData(form);
		const validation = validateLogin({
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (!validation.success) {
			loginFieldErrors = validation.errors;
			return;
		}

		isSubmitting = true;

		try {
			await loginWithPassword(validation.data);

			if (!isEmailVerified()) {
				try {
					await requestEmailVerification(validation.data.email);
					toast.success('Email verifikasi berhasil dikirim.');
				} catch (error) {
					toast.error(
						error instanceof VerificationError
							? error.message
							: 'Email verifikasi gagal dikirim. Silakan kirim ulang.'
					);
				}

				const requestedPage = page.url.searchParams.get('next');
				const verificationPage = requestedPage?.startsWith('/verification?')
					? requestedPage
					: '/verification';
				await goto(verificationPage);
				return;
			}

			await goto('/user/dashboard');
		} catch (error) {
			toast.error(
				error instanceof LoginError
					? error.message
					: 'Terjadi kesalahan saat masuk. Silakan coba lagi.'
			);
		} finally {
			isSubmitting = false;
		}
	}

	function clearLoginFeedback(field: keyof LoginInput) {
		if (loginFieldErrors[field]) {
			loginFieldErrors = { ...loginFieldErrors, [field]: undefined };
		}
	}

	function clearRegisterFeedback(field: keyof RegisterInput) {
		if (registerFieldErrors[field]) {
			registerFieldErrors = { ...registerFieldErrors, [field]: undefined };
		}
	}
</script>

<svelte:head>
	<title>{content.metaTitle}</title>
	<meta name="description" content={content.metaDescription} />
</svelte:head>

<main class="grid min-h-screen place-items-center bg-gray-100 px-4 py-12">
	<section class="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
		<div class="text-center">
			<p class="text-sm font-semibold tracking-wide text-gray-500">WEDEZ</p>
			<h1 class="mt-3 text-2xl font-bold tracking-tight text-gray-900">{content.title}</h1>
			<p class="mt-2 text-sm text-gray-500">{content.description}</p>
		</div>

		<form class="mt-8 space-y-5" onsubmit={submitAuth}>
			{#if !isLogin}
				<AuthField
					id="name"
					name="name"
					label="Nama"
					autocomplete="name"
					placeholder="Nama lengkap"
					disabled={isSubmitting}
					error={registerFieldErrors.name}
					oninput={() => clearRegisterFeedback('name')}
					required
				/>
			{/if}

			<AuthField
				id="email"
				name="email"
				label="Email"
				type="email"
				autocomplete="email"
				placeholder="nama@email.com"
				disabled={isSubmitting}
				error={isLogin ? loginFieldErrors.email : registerFieldErrors.email}
				oninput={isLogin ? () => clearLoginFeedback('email') : () => clearRegisterFeedback('email')}
				required
			/>

			<AuthField
				id="password"
				name="password"
				label="Kata sandi"
				type="password"
				autocomplete={isLogin ? 'current-password' : 'new-password'}
				placeholder={isLogin ? 'Masukkan kata sandi' : 'Buat kata sandi'}
				disabled={isSubmitting}
				error={isLogin ? loginFieldErrors.password : registerFieldErrors.password}
				oninput={isLogin
					? () => clearLoginFeedback('password')
					: () => clearRegisterFeedback('password')}
				required
			>
				{#snippet labelAction()}
					{#if isLogin}
						<a
							href="/forgot-password"
							class="auth-focus text-sm font-medium text-gray-600 hover:text-gray-900"
						>
							Lupa kata sandi?
						</a>
					{/if}
				{/snippet}
			</AuthField>

			{#if !isLogin}
				<AuthField
					id="passwordConfirm"
					name="passwordConfirm"
					label="Konfirmasi kata sandi"
					type="password"
					autocomplete="new-password"
					placeholder="Ulangi kata sandi"
					disabled={isSubmitting}
					error={registerFieldErrors.passwordConfirm}
					oninput={() => clearRegisterFeedback('passwordConfirm')}
					required
				/>
			{/if}

			<button
				type="submit"
				disabled={isSubmitting}
				aria-busy={isSubmitting}
				class="auth-focus w-full cursor-pointer rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isSubmitting ? (isLogin ? 'Sedang masuk...' : 'Sedang mendaftar...') : content.submitLabel}
			</button>
		</form>

		{#if isLogin}
			<div class="my-6 flex items-center gap-3" aria-hidden="true">
				<div class="h-px flex-1 bg-gray-200"></div>
				<span class="text-xs font-medium text-gray-400">atau</span>
				<div class="h-px flex-1 bg-gray-200"></div>
			</div>

			<button
				type="button"
				disabled
				title="Login Google belum tersedia"
				class="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-500 opacity-60"
			>
				<span
					aria-hidden="true"
					class="grid size-5 place-items-center rounded-full bg-white text-sm font-bold text-blue-600"
				>
					G
				</span>
				Masuk dengan Google
			</button>
		{/if}

		<p class="mt-6 text-center text-sm text-gray-500">
			{isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
			<a
				href={isLogin ? '/register' : '/login'}
				class="auth-focus font-semibold text-gray-900 hover:text-gray-600"
			>
				{isLogin ? 'Daftar' : 'Masuk'}
			</a>
		</p>
	</section>
</main>

<style>
	.auth-focus:focus-visible {
		outline: 2px solid #9400ff;
		outline-offset: 3px;
	}
</style>
