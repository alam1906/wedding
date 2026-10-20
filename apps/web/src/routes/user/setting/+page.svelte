<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		ACCOUNT_DELETE_CONFIRMATION,
		DeleteAccountError,
		PasswordError,
		UpdateProfileError,
		changeAuthenticatedPassword,
		deleteCurrentAccount,
		getAuthenticatedEmail,
		getAuthenticatedName,
		getAuthenticatedAvatarUrl,
		logout,
		updateAuthenticatedAvatar,
		updateAuthenticatedName
	} from '#lib/features/auth/index.js';
	import { getGuestContext } from '#lib/features/guests/index.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	import { getWeddingContext } from '#lib/features/weddings/index.js';
	import { OPTIMIZABLE_IMAGE_ACCEPT } from '#lib/shared/image/optimize-image.js';

	const toast = getToastContext();
	const guests = getGuestContext();
	const wedding = getWeddingContext();
	let profileName = $state('');
	let profileEmail = $state('');
	let savedProfileName = $state('');
	let profileError = $state('');
	let isSavingProfile = $state(false);
	let avatarUrl = $state('');
	let isSavingAvatar = $state(false);
	let avatarInput: HTMLInputElement;
	let currentPassword = $state('');
	let newPassword = $state('');
	let passwordConfirm = $state('');
	let passwordError = $state('');
	let isChangingPassword = $state(false);
	let deleteConfirmation = $state('');
	let deleteAccountError = $state('');
	let isDeletingAccount = $state(false);
	let canDeleteAccount = $derived(deleteConfirmation === ACCOUNT_DELETE_CONFIRMATION);
	let canSaveProfile = $derived(
		!isSavingProfile && profileName.trim().length > 0 && profileName.trim() !== savedProfileName
	);

	function getDeleteAccountDialog(): HTMLDialogElement | null {
		const dialog = document.getElementById('delete-account-dialog');
		return dialog instanceof HTMLDialogElement ? dialog : null;
	}

	function openDeleteAccountDialog() {
		if (isDeletingAccount) return;
		deleteConfirmation = '';
		deleteAccountError = '';
		getDeleteAccountDialog()?.showModal();
	}

	function closeDeleteAccountDialog() {
		if (!isDeletingAccount) getDeleteAccountDialog()?.close();
	}

	function resetDeleteAccountDialog() {
		deleteConfirmation = '';
		deleteAccountError = '';
	}

	async function handleDeleteAccount(event: SubmitEvent) {
		event.preventDefault();
		if (isDeletingAccount || !canDeleteAccount) return;

		isDeletingAccount = true;
		deleteAccountError = '';

		try {
			await deleteCurrentAccount(deleteConfirmation);
			guests.reset();
			wedding.reset();
			logout();
			getDeleteAccountDialog()?.close();
			toast.success('Akun dan data undangan Anda berhasil dihapus.');
			await goto('/login', { replace: true });
		} catch (error) {
			deleteAccountError =
				error instanceof DeleteAccountError
					? error.message
					: 'Akun gagal dihapus. Tidak ada data yang diubah.';
			toast.error(deleteAccountError);
		} finally {
			isDeletingAccount = false;
		}
	}

	async function handleSaveProfile(event: SubmitEvent) {
		event.preventDefault();
		if (!canSaveProfile) return;

		isSavingProfile = true;
		profileError = '';

		try {
			profileName = await updateAuthenticatedName(profileName);
			savedProfileName = profileName;
			toast.success('Nama lengkap berhasil diperbarui.');
		} catch (error) {
			profileError =
				error instanceof UpdateProfileError
					? error.message
					: 'Nama lengkap gagal diperbarui. Silakan coba lagi.';
			toast.error(profileError);
		} finally {
			isSavingProfile = false;
		}
	}

	async function handleChangePassword(event: SubmitEvent) {
		event.preventDefault();
		if (isChangingPassword) return;
		isChangingPassword = true;
		passwordError = '';
		try {
			await changeAuthenticatedPassword(currentPassword, newPassword, passwordConfirm);
			currentPassword = '';
			newPassword = '';
			passwordConfirm = '';
			guests.reset();
			wedding.reset();
			toast.success('Kata sandi berhasil diperbarui. Silakan masuk kembali.');
			await goto('/login', { replace: true });
		} catch (error) {
			passwordError =
				error instanceof PasswordError
					? error.message
					: 'Kata sandi gagal diperbarui. Silakan coba lagi.';
			toast.error(passwordError);
		} finally {
			isChangingPassword = false;
		}
	}

	async function handleAvatar(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || isSavingAvatar) return;
		isSavingAvatar = true;
		profileError = '';
		try {
			avatarUrl = await updateAuthenticatedAvatar(file);
			toast.success('Foto profil berhasil diperbarui.');
		} catch (error) {
			profileError = error instanceof Error ? error.message : 'Foto profil gagal diperbarui.';
			toast.error(profileError);
		} finally {
			input.value = '';
			isSavingAvatar = false;
		}
	}

	onMount(() => {
		profileName = getAuthenticatedName();
		savedProfileName = profileName;
		profileEmail = getAuthenticatedEmail();
		avatarUrl = getAuthenticatedAvatarUrl();
	});
</script>

<svelte:head>
	<title>Pengaturan — Wedez</title>
	<meta name="description" content="Kelola profil dan pengaturan akun Wedez." />
</svelte:head>

<section class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
	<dialog
		id="delete-account-dialog"
		aria-labelledby="delete-account-title"
		aria-describedby="delete-account-description"
		onclick={(event) => event.target === event.currentTarget && closeDeleteAccountDialog()}
		oncancel={(event) => isDeletingAccount && event.preventDefault()}
		onclose={resetDeleteAccountDialog}
		class="ws-dialog account-dialog m-auto w-[calc(100%-2rem)] max-w-md p-0"
	>
		<form onsubmit={handleDeleteAccount}>
			<div class="border-b border-red-100 bg-red-50 px-5 py-6 sm:px-6">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs font-semibold tracking-wider text-red-600 uppercase">
							Zona berbahaya
						</p>
						<h2 id="delete-account-title" class="mt-2 text-2xl font-extrabold text-[#191919]">
							Hapus akun?
						</h2>
					</div>
					<button
						type="button"
						onclick={closeDeleteAccountDialog}
						disabled={isDeletingAccount}
						aria-label="Tutup dialog hapus akun"
						class="ws-button ws-button--icon grid size-10 shrink-0 cursor-pointer place-items-center disabled:opacity-50"
					>
						<svg
							aria-hidden="true"
							class="size-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="m6 6 12 12M18 6 6 18"></path>
						</svg>
					</button>
				</div>
			</div>

			<div class="p-5 sm:p-6">
				<p id="delete-account-description" class="text-sm leading-6 text-[#5c554e]">
					Tindakan ini permanen. Akun, undangan pernikahan, cerita, daftar tamu, RSVP, dan file akan
					dihapus. Catatan pembayaran dan affiliate tetap disimpan untuk rekonsiliasi. Pembayaran,
					komisi, atau pencairan yang belum selesai harus diselesaikan terlebih dahulu.
				</p>
				<label class="form-label mt-5 block">
					Ketik <strong>{ACCOUNT_DELETE_CONFIRMATION}</strong> untuk melanjutkan
					<input
						bind:value={deleteConfirmation}
						name="delete-confirmation"
						autocomplete="off"
						spellcheck="false"
						disabled={isDeletingAccount}
						placeholder={ACCOUNT_DELETE_CONFIRMATION}
						class="form-control mt-2"
					/>
				</label>
				{#if deleteAccountError}
					<p class="ws-alert ws-alert--error mt-4 px-4 py-3 text-sm text-red-700" role="alert">
						{deleteAccountError}
					</p>
				{/if}
				<div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onclick={closeDeleteAccountDialog}
						disabled={isDeletingAccount}
						class="ws-button cursor-pointer px-5 py-3 text-sm disabled:opacity-50">Batal</button
					>
					<button
						type="submit"
						disabled={!canDeleteAccount || isDeletingAccount}
						aria-busy={isDeletingAccount}
						class="ws-button ws-button--danger cursor-pointer px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isDeletingAccount ? 'Menghapus akun...' : 'Hapus akun permanen'}
					</button>
				</div>
			</div>
		</form>
	</dialog>

	<div class="flex w-full flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
		<div class="contents lg:block lg:space-y-5">
			<section class="ws-panel order-1 p-5 sm:p-6">
				<form onsubmit={handleSaveProfile}>
					<div
						class="flex flex-col gap-5 border-b border-[#191919] pb-6 min-[420px]:flex-row min-[420px]:items-center"
					>
						<div
							class="grid size-20 shrink-0 place-items-center rounded-full bg-gray-900 text-2xl font-bold text-white"
						>
							{#if avatarUrl}
								<img src={avatarUrl} alt="Foto profil" class="size-20 rounded-full object-cover" />
							{:else}
								W
							{/if}
						</div>
						<div>
							<h1 class="text-xl font-extrabold text-[#191919]">Profil akun</h1>
							<input
								bind:this={avatarInput}
								type="file"
								accept={OPTIMIZABLE_IMAGE_ACCEPT}
								onchange={handleAvatar}
								aria-label="Pilih foto profil"
								class="ws-input hidden"
								disabled={isSavingAvatar}
							/>
							<button
								type="button"
								onclick={() => avatarInput.click()}
								disabled={isSavingAvatar}
								class="ws-link mt-3 cursor-pointer text-sm font-semibold text-[#191919] disabled:opacity-50"
								>{isSavingAvatar ? 'Menyimpan foto...' : 'Ganti foto'}</button
							>
						</div>
					</div>
					<div class="mt-6 grid gap-5">
						<label class="form-label block">
							Nama lengkap
							<input
								bind:value={profileName}
								autocomplete="name"
								maxlength="255"
								disabled={isSavingProfile}
								aria-invalid={profileError ? 'true' : undefined}
								aria-describedby={profileError ? 'profile-name-error' : undefined}
								class="form-control mt-2"
							/>
						</label>
						<label class="form-label block">
							Email
							<input
								type="email"
								autocomplete="email"
								value={profileEmail}
								readonly
								class="form-control mt-2"
							/>
						</label>
					</div>
					{#if profileError}<p
							id="profile-name-error"
							class="mt-4 text-sm text-red-600"
							role="alert"
						>
							{profileError}
						</p>{/if}
					<div class="mt-6 flex justify-end">
						<button
							type="submit"
							disabled={isSavingProfile}
							aria-busy={isSavingProfile}
							class="ws-button ws-button--primary cursor-pointer px-5 py-3 text-sm"
						>
							{isSavingProfile ? 'Menyimpan...' : 'Simpan profil'}
						</button>
					</div>
				</form>
			</section>

			<section class="ws-panel order-3 p-5 sm:p-6">
				<h2 class="text-lg font-extrabold text-[#191919]">Hapus akun</h2>
				<p class="mt-2 text-sm leading-6 text-[#5c554e]">
					Semua undangan dan data tamu akan dihapus secara permanen.
				</p>
				<button
					type="button"
					onclick={openDeleteAccountDialog}
					class="ws-button ws-button--danger mt-5 w-full cursor-pointer px-4 py-3 text-sm"
					>Hapus akun</button
				>
			</section>
		</div>

		<div class="contents lg:block">
			<section class="ws-panel order-2 p-5 sm:p-6">
				<h2 class="text-lg font-extrabold text-[#191919]">Keamanan</h2>
				<p class="mt-1 text-sm text-[#5c554e]">Perbarui kata sandi akun secara berkala.</p>
				<form class="mt-5 space-y-5" onsubmit={handleChangePassword}>
					<label class="form-label block"
						>Kata sandi saat ini<input
							bind:value={currentPassword}
							name="oldPassword"
							type="password"
							autocomplete="current-password"
							required
							disabled={isChangingPassword}
							class="form-control mt-2"
						/></label
					>
					<label class="form-label block"
						>Kata sandi baru<input
							bind:value={newPassword}
							name="password"
							type="password"
							autocomplete="new-password"
							required
							disabled={isChangingPassword}
							class="form-control mt-2"
						/></label
					>
					<label class="form-label block"
						>Konfirmasi kata sandi baru<input
							bind:value={passwordConfirm}
							name="passwordConfirm"
							type="password"
							autocomplete="new-password"
							required
							disabled={isChangingPassword}
							class="form-control mt-2"
						/></label
					>
					{#if passwordError}
						<p class="ws-alert ws-alert--error px-4 py-3 text-sm text-red-700" role="alert">
							{passwordError}
						</p>
					{/if}
					<button
						type="submit"
						disabled={isChangingPassword}
						aria-busy={isChangingPassword}
						class="ws-button ws-button--primary mt-5 w-full cursor-pointer px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
						>{isChangingPassword ? 'Mengubah kata sandi...' : 'Ubah kata sandi'}</button
					>
				</form>
			</section>
		</div>
	</div>
</section>

<style>
	.account-dialog {
		opacity: 0;
		transform: translateY(16px) scale(0.98);
		transition:
			opacity 200ms ease,
			transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
			display 260ms,
			overlay 260ms;
		transition-behavior: allow-discrete;
	}
	.account-dialog[open] {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
	.account-dialog::backdrop {
		background: rgb(17 24 39 / 55%);
		backdrop-filter: blur(4px);
		opacity: 0;
		transition:
			opacity 220ms ease,
			display 260ms,
			overlay 260ms;
		transition-behavior: allow-discrete;
	}
	.account-dialog[open]::backdrop {
		opacity: 1;
	}
	@starting-style {
		.account-dialog[open] {
			opacity: 0;
			transform: translateY(16px) scale(0.98);
		}
		.account-dialog[open]::backdrop {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.account-dialog,
		.account-dialog::backdrop {
			transition: none;
		}
	}
</style>
