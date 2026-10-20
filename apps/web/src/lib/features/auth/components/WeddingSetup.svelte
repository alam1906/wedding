<script lang="ts">
	import { goto } from '$app/navigation';
	import { chooseAffiliateHome } from '#lib/features/auth/api/choose-home.js';
	import { refreshAuthenticatedUser } from '#lib/features/auth/api/verification.js';
	import { hasWedding, type AccountIntent } from '#lib/features/auth/model/navigation.js';
	import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
	import AuthFrame from '#lib/components/auth/AuthFrame.svelte';
	let busy = $state<AccountIntent | null>(null);
	let error = $state('');
	async function createWedding() {
		if (busy) return;
		busy = 'wedding';
		error = '';
		try {
			await pocketBase.send('/api/wedez/account/provision', { method: 'POST' });
			await refreshAuthenticatedUser();
			await goto('/user/dashboard', { invalidateAll: true });
		} catch {
			error = 'Pilihan undangan belum dapat disimpan. Silakan coba lagi.';
		} finally {
			busy = null;
		}
	}
	async function chooseAffiliate() {
		if (busy) return;
		busy = 'affiliate';
		error = '';
		try {
			await chooseAffiliateHome();
			await goto('/affiliate/dashboard');
		} catch {
			error = 'Pilihan affiliate belum dapat disimpan. Silakan coba lagi.';
		} finally {
			busy = null;
		}
	}
</script>

<svelte:head><title>Pilih tujuan akun - Wedez</title></svelte:head>
<AuthFrame
	title="Mau mulai dari mana?"
	description="Pilih tujuan akunmu. Pilihan ini disimpan untuk login berikutnya, dan kamu bisa mengubahnya nanti."
	wide
>
	{#if error}<p role="alert" class="auth-notice auth-notice-error mt-6">{error}</p>{/if}
	<div class="mt-8 grid gap-5 sm:grid-cols-2">
		<div class="flex flex-col border-2 border-[#191919] bg-white p-5 shadow-[3px_3px_0_#191919]">
			<span
				class="mb-5 grid size-10 place-items-center border-2 border-[#191919] bg-[#ff96ca] text-xs font-black"
				aria-hidden="true">01</span
			>
			<h2 class="text-xl font-black tracking-tight">Buat undangan</h2>
			<p class="mt-3 flex-1 text-sm leading-6 text-[#57534e]">
				Siapkan undangan pernikahan gratis, kelola tamu, dan pilih tema.
			</p>
			<button
				type="button"
				onclick={createWedding}
				disabled={busy !== null}
				aria-busy={busy === 'wedding'}
				class="auth-button auth-button-pink mt-6 w-full"
				>{busy === 'wedding'
					? 'Menyiapkan undangan...'
					: hasWedding()
						? 'Masuk ke undangan'
						: 'Buat undangan gratis'}</button
			>
		</div>
		<div class="flex flex-col border-2 border-[#191919] bg-white p-5 shadow-[3px_3px_0_#191919]">
			<span
				class="mb-5 grid size-10 place-items-center border-2 border-[#191919] bg-[#e5fa94] text-xs font-black"
				aria-hidden="true">02</span
			>
			<h2 class="text-xl font-black tracking-tight">Jadi affiliate</h2>
			<p class="mt-3 flex-1 text-sm leading-6 text-[#57534e]">
				Bagikan kode kupon dan dapatkan komisi dari pembayaran yang berhasil.
			</p>
			<button
				type="button"
				onclick={chooseAffiliate}
				disabled={busy !== null}
				aria-busy={busy === 'affiliate'}
				class="auth-button mt-6 w-full"
				>{busy === 'affiliate' ? 'Menyimpan pilihan...' : 'Masuk ke affiliate'}</button
			>
		</div>
	</div>
</AuthFrame>
