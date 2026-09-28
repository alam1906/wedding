<script lang="ts">
	import { goto } from '$app/navigation';
	import { chooseAffiliateHome } from '#lib/features/auth/api/choose-home.js';
	import { hasWedding, type AccountIntent } from '#lib/features/auth/model/navigation.js';
	import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
	let busy = $state<AccountIntent | null>(null);
	let error = $state('');
	async function createWedding() {
		if (busy) return;
		busy = 'wedding';
		error = '';
		try {
			await pocketBase.send('/api/wedez/account/provision', { method: 'POST' });
			await pocketBase.collection('users').authRefresh();
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
<main class="grid min-h-screen place-items-center bg-gray-100 px-4 py-12">
	<section class="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8">
		<a href="/" class="text-sm font-bold text-violet-700">WEDEZ</a>
		<h1 class="mt-6 text-2xl font-bold tracking-tight text-gray-900">Mau mulai dari mana?</h1>
		<p class="mt-3 text-sm leading-6 text-gray-500">
			Pilih tujuan akunmu. Pilihan ini disimpan untuk login berikutnya, dan kamu bisa mengubahnya
			nanti.
		</p>
		{#if error}<p role="alert" class="mt-4 text-sm text-red-600">{error}</p>{/if}
		<div class="mt-7 grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col rounded-xl border border-gray-200 p-5">
				<h2 class="text-lg font-semibold text-gray-900">Buat undangan</h2>
				<p class="mt-2 flex-1 text-sm leading-6 text-gray-600">
					Siapkan undangan pernikahan gratis, kelola tamu, dan pilih tema.
				</p>
				<button
					type="button"
					onclick={createWedding}
					disabled={busy !== null}
					class="mt-5 w-full cursor-pointer rounded-xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
					>{busy === 'wedding'
						? 'Menyiapkan undangan...'
						: hasWedding()
							? 'Masuk ke undangan'
							: 'Buat undangan gratis'}</button
				>
			</div>
			<div class="flex flex-col rounded-xl border border-gray-200 p-5">
				<h2 class="text-lg font-semibold text-gray-900">Jadi affiliate</h2>
				<p class="mt-2 flex-1 text-sm leading-6 text-gray-600">
					Bagikan kode kupon dan dapatkan komisi dari pembayaran yang berhasil.
				</p>
				<button
					type="button"
					onclick={chooseAffiliate}
					disabled={busy !== null}
					class="mt-5 w-full cursor-pointer rounded-xl border border-violet-200 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
					>{busy === 'affiliate' ? 'Menyimpan pilihan...' : 'Masuk ke affiliate'}</button
				>
			</div>
		</div>
	</section>
</main>
