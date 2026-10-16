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
	import AuthFrame from './AuthFrame.svelte';
	import {
		postLoginDestination,
		safeDestination,
		verificationUrl
	} from '#lib/features/auth/model/navigation.js';

	type Props = {
		mode: 'login' | 'register';
	};

	const toast = getToastContext();
	let { mode }: Props = $props();
	const destination = $derived(safeDestination(page.url.searchParams.get('next')));
	let isSubmitting = $state(false);
	let loginFieldErrors = $state<LoginFieldErrors>({});
	let registerFieldErrors = $state<RegisterFieldErrors>({});

	const isLogin = $derived(mode === 'login');
	const content = $derived(
		isLogin
			? {
					title: 'Masuk',
					submitLabel: 'Masuk',
					metaTitle: 'Masuk - Wedez',
					metaDescription: 'Masuk ke akun Wedez untuk mengelola undangan atau affiliate.'
				}
			: {
					title: 'Daftar',
					submitLabel: 'Daftar',
					metaTitle: 'Daftar - Wedez',
					metaDescription: 'Buat akun Wedez untuk undangan pernikahan atau program affiliate.'
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
				await goto('/login?next=%2Fstart');
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

				await goto(verificationUrl(postLoginDestination(page.url.searchParams.get('next'))));
				return;
			}

			await goto(postLoginDestination(page.url.searchParams.get('next')));
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

<AuthFrame title={content.title}>
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
					<a href="/forgot-password" class="auth-link text-xs sm:text-sm"> Lupa kata sandi? </a>
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
			class="auth-button auth-button-pink w-full"
		>
			{isSubmitting ? (isLogin ? 'Sedang masuk...' : 'Sedang mendaftar...') : content.submitLabel}
		</button>
	</form>

	{#if isLogin}
		<div class="my-6 flex items-center gap-3" aria-hidden="true">
			<div class="h-px flex-1 bg-[#191919]"></div>
			<span class="text-xs font-bold text-[#57534e]">atau</span>
			<div class="h-px flex-1 bg-[#191919]"></div>
		</div>

		<button
			type="button"
			disabled
			title="Masuk dengan Google belum tersedia"
			class="auth-button auth-button-neutral w-full"
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

	<p class="mt-6 text-center text-sm leading-6 text-[#57534e]">
		{isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
		<a
			href={`${isLogin ? '/register' : '/login'}?next=${encodeURIComponent(destination)}`}
			class="auth-link"
		>
			{isLogin ? 'Daftar' : 'Masuk'}
		</a>
	</p>
</AuthFrame>
