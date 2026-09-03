<script lang="ts">
	import ToggleSwitch from '#lib/components/ui/ToggleSwitch.svelte';

	const notifications = $state([
		{
			id: 'rsvp',
			label: 'Notifikasi RSVP',
			description: 'Dapatkan pemberitahuan ketika tamu mengisi RSVP.',
			enabled: true
		},
		{
			id: 'email',
			label: 'Email informasi',
			description: 'Terima pembaruan akun dan informasi paket melalui email.',
			enabled: true
		}
	]);
</script>

<svelte:head>
	<title>Pengaturan — Wedez</title>
	<meta name="description" content="Kelola profil dan pengaturan akun Wedez." />
</svelte:head>

<section class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
	<div
		class="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]"
	>
		<div class="space-y-5">
			<section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
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
						<p class="mt-1 text-sm text-gray-500">
							Informasi yang digunakan untuk mengelola akun Wedez.
						</p>
						<button
							type="button"
							class="mt-3 text-sm font-semibold text-gray-900 hover:text-gray-600"
						>
							Ganti foto
						</button>
					</div>
				</div>

				<div class="mt-6 grid gap-5 sm:grid-cols-2">
					<label class="block text-sm font-medium text-gray-700">
						Nama lengkap
						<input
							autocomplete="name"
							class="field mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
							value="Nama Pengguna"
						/>
					</label>
					<label class="block text-sm font-medium text-gray-700">
						Nomor WhatsApp
						<input
							autocomplete="tel"
							class="field mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
							placeholder="08xx xxxx xxxx"
						/>
					</label>
					<label class="block text-sm font-medium text-gray-700 sm:col-span-2">
						Email
						<input
							type="email"
							autocomplete="email"
							class="field mt-2 w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm text-gray-500"
							value="nama@email.com"
							readonly
						/>
					</label>
				</div>

				<div class="mt-6 flex justify-end">
					<button
						type="button"
						class="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
					>
						Simpan profil
					</button>
				</div>
			</section>

			<section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
				<div>
					<h2 class="text-lg font-bold text-gray-900">Notifikasi</h2>
					<p class="mt-1 text-sm text-gray-500">Pilih informasi yang ingin kamu terima.</p>
				</div>

				<div class="mt-5 divide-y divide-gray-200">
					{#each notifications as notification (notification.id)}
						<ToggleSwitch
							bind:checked={notification.enabled}
							label={notification.label}
							description={notification.description}
						/>
					{/each}
				</div>
			</section>
		</div>

		<div class="space-y-5">
			<section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-sm font-medium text-gray-500">Paket aktif</p>
						<h2 class="mt-2 text-2xl font-bold tracking-tight text-gray-900">Gratis</h2>
					</div>
					<span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
						>Aktif</span
					>
				</div>
				<ul class="mt-5 space-y-3 text-sm text-gray-600">
					<li>1 undangan aktif</li>
					<li>Maksimal 100 tamu</li>
					<li>Tema dasar</li>
				</ul>
				<button
					type="button"
					class="mt-6 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
				>
					Lihat pilihan paket
				</button>
			</section>

			<section class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
				<h2 class="text-lg font-bold text-gray-900">Keamanan</h2>
				<p class="mt-1 text-sm text-gray-500">Perbarui kata sandi akun secara berkala.</p>

				<div class="mt-5 space-y-4">
					<label class="block text-sm font-medium text-gray-700">
						Kata sandi saat ini
						<input
							type="password"
							autocomplete="current-password"
							class="field mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
						/>
					</label>
					<label class="block text-sm font-medium text-gray-700">
						Kata sandi baru
						<input
							type="password"
							autocomplete="new-password"
							class="field mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm"
						/>
					</label>
				</div>
				<button
					type="button"
					class="mt-5 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
				>
					Ubah kata sandi
				</button>
			</section>

			<section class="rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
				<h2 class="text-lg font-bold text-gray-900">Hapus akun</h2>
				<p class="mt-2 text-sm leading-6 text-gray-500">
					Semua undangan dan data tamu akan dihapus secara permanen.
				</p>
				<button
					type="button"
					class="mt-5 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
				>
					Hapus akun
				</button>
			</section>
		</div>
	</div>
</section>
