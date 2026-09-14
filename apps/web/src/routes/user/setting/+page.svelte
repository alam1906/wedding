<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		ACCOUNT_DELETE_CONFIRMATION,
		DeleteAccountError,
		UpdateProfileError,
		deleteCurrentAccount,
		getAuthenticatedEmail,
		getAuthenticatedName,
		logout,
		updateAuthenticatedName
	} from '#lib/features/auth/index.js';
	import { getGuestContext } from '#lib/features/guests/index.js';
	import { getToastContext } from '#lib/features/toast/index.js';
	import { getWeddingContext } from '#lib/features/weddings/index.js';

	const toast = getToastContext();
	const guests = getGuestContext();
	const wedding = getWeddingContext();
	let profileName = $state('');
	let profileEmail = $state('');
	let savedProfileName = $state('');
	let profileError = $state('');
	let isSavingProfile = $state(false);
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
			toast.success('Akun dan seluruh data Anda berhasil dihapus.');
			await goto('/login', { replaceState: true });
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

	onMount(() => {
		profileName = getAuthenticatedName();
		savedProfileName = profileName;
		profileEmail = getAuthenticatedEmail();
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
		class="account-dialog m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-red-200 bg-white p-0 shadow-2xl"
	>
		<form onsubmit={handleDeleteAccount}>
			<div class="border-b border-red-100 bg-red-50 px-5 py-6 sm:px-6">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs font-semibold tracking-wider text-red-600 uppercase">
							Zona berbahaya
						</p>
						<h2 id="delete-account-title" class="mt-2 text-2xl font-bold text-gray-950">
							Hapus akun?
						</h2>
					</div>
					<button
						type="button"
						onclick={closeDeleteAccountDialog}
						disabled={isDeletingAccount}
						aria-label="Tutup dialog hapus akun"
						class="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-white text-gray-500 shadow-sm disabled:opacity-50"
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
				<p id="delete-account-description" class="text-sm leading-6 text-gray-600">
					Tindakan ini permanen. Akun, undangan pernikahan, cerita, daftar tamu, RSVP, file, dan
					riwayat pembayaran lokal akan dihapus.
				</p>
				<label class="mt-5 block text-sm font-medium text-gray-800">
					Ketik <strong>{ACCOUNT_DELETE_CONFIRMATION}</strong> untuk melanjutkan
					<input
						bind:value={deleteConfirmation}
						name="delete-confirmation"
						autocomplete="off"
						spellcheck="false"
						disabled={isDeletingAccount}
						placeholder={ACCOUNT_DELETE_CONFIRMATION}
						class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
					/>
				</label>
				{#if deleteAccountError}
					<p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
						{deleteAccountError}
					</p>
				{/if}
				<div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<button
						type="button"
						onclick={closeDeleteAccountDialog}
						disabled={isDeletingAccount}
						class="cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 disabled:opacity-50"
						>Batal</button
					>
					<button
						type="submit"
						disabled={!canDeleteAccount || isDeletingAccount}
						aria-busy={isDeletingAccount}
						class="cursor-pointer rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isDeletingAccount ? 'Menghapus akun...' : 'Hapus akun permanen'}
					</button>
				</div>
			</div>
		</form>
	</dialog>

	<div class="mx-auto flex w-full max-w-6xl flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
		<div class="contents lg:block lg:space-y-5">
			<section class="order-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
				<form onsubmit={handleSaveProfile}>
					<div
						class="flex flex-col gap-5 border-b border-gray-200 pb-6 min-[420px]:flex-row min-[420px]:items-center"
					>
						<div
							class="grid size-20 shrink-0 place-items-center rounded-full bg-gray-900 text-2xl font-bold text-white"
						>
							W
						</div>
						<div>
							<h1 class="text-xl font-bold text-gray-900">Profil akun</h1>
							<button type="button" class="mt-3 cursor-pointer text-sm font-semibold text-gray-900"
								>Ganti foto</button
							>
						</div>
					</div>
					<div class="mt-6 grid gap-5">
						<label class="block text-sm font-medium text-gray-700">
							Nama lengkap
							<input
								bind:value={profileName}
								autocomplete="name"
								maxlength="255"
								disabled={isSavingProfile}
								aria-invalid={profileError ? 'true' : undefined}
								aria-describedby={profileError ? 'profile-name-error' : undefined}
								class="field mt-2 w-full rounded-xl border border-gray-700 bg-white px-4 py-3 text-sm"
							/>
						</label>
						<label class="block text-sm font-medium text-gray-700">
							Email
							<input
								type="email"
								autocomplete="email"
								value={profileEmail}
								readonly
								class="field mt-2 w-full rounded-xl border border-gray-700 bg-gray-100 px-4 py-3 text-sm text-gray-500"
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
							disabled={!canSaveProfile}
							aria-busy={isSavingProfile}
							class="cursor-pointer rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSavingProfile ? 'Menyimpan...' : 'Simpan profil'}
						</button>
					</div>
				</form>
			</section>

			<section class="order-3 rounded-2xl border border-red-200 bg-red-50/30 p-5 shadow-sm sm:p-6">
				<h2 class="text-lg font-bold text-gray-900">Hapus akun</h2>
				<p class="mt-2 text-sm leading-6 text-gray-500">
					Semua undangan dan data tamu akan dihapus secara permanen.
				</p>
				<button
					type="button"
					onclick={openDeleteAccountDialog}
					class="mt-5 w-full cursor-pointer rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
					>Hapus akun</button
				>
			</section>
		</div>

		<div class="contents lg:block">
			<section class="order-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
				<h2 class="text-lg font-bold text-gray-900">Keamanan</h2>
				<p class="mt-1 text-sm text-gray-500">Perbarui kata sandi akun secara berkala.</p>
				<div class="mt-5 space-y-4">
					<label class="block text-sm font-medium text-gray-700"
						>Kata sandi saat ini<input
							type="password"
							autocomplete="current-password"
							class="field mt-2 w-full rounded-xl border border-gray-700 px-4 py-3 text-sm"
						/></label
					>
					<label class="block text-sm font-medium text-gray-700"
						>Kata sandi baru<input
							type="password"
							autocomplete="new-password"
							class="field mt-2 w-full rounded-xl border border-gray-700 px-4 py-3 text-sm"
						/></label
					>
				</div>
				<button
					type="button"
					class="mt-5 w-full cursor-pointer rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white"
					>Ubah kata sandi</button
				>
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
