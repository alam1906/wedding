<script lang="ts">
	import {
		WeddingDataError,
		getDashboardSummary,
		getWeddingInvitationHost,
		getWeddingInvitationUrl
	} from '#lib/features/weddings/index.js';

	async function getDashboardData() {
		try {
			const summary = await getDashboardSummary();

			return {
				weddingProgress: summary.completion,
				weddingSlug: summary.slug,
				weddingPlanTier: summary.plan_tier,
				weddingProgressError: null,
				guestStats: summary.guests,
				guestStatsError: null
			};
		} catch (error) {
			return {
				weddingProgress: null,
				weddingSlug: '',
				weddingPlanTier: null,
				weddingProgressError:
					error instanceof WeddingDataError ? error.message : 'Progres data undangan gagal dimuat.',
				guestStats: null,
				guestStatsError: 'Statistik tamu belum tersedia.'
			};
		}
	}

	const {
		weddingProgress,
		weddingSlug,
		weddingPlanTier,
		weddingProgressError,
		guestStats,
		guestStatsError
	} = await getDashboardData();

	const stats = [
		{ label: 'Tamu diundang', value: guestStats?.total ?? '—', badge: 'Total' },
		{ label: 'Tamu hadir', value: guestStats?.attending ?? '—', badge: 'Hadir' },
		{
			label: 'Tidak hadir',
			value: guestStats?.notAttending ?? '—',
			badge: 'Berhalangan'
		},
		{ label: 'Menunggu', value: guestStats?.pending ?? '—', badge: 'Menunggu' }
	];

	const progressPercentage = weddingProgress?.percentage ?? 0;
	const weddingURL = weddingSlug ? getWeddingInvitationUrl(weddingSlug) : null;
	const weddingHost = weddingSlug ? getWeddingInvitationHost(weddingSlug) : '';
</script>

<svelte:head>
	<title>Dashboard — Wedez</title>
	<meta
		name="description"
		content="Kelola undangan pernikahan, daftar tamu, dan RSVP melalui dashboard Wedez."
	/>
</svelte:head>

<section class="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
	<div class="w-full">
		<div class="ws-highlights grid w-full min-w-0 gap-5 lg:grid-cols-2">
			<article class="ws-panel flex min-w-0 items-center p-5">
				<div class="flex w-full min-w-0 items-center justify-between gap-4">
					<div class="flex min-w-0 items-center gap-3">
						<span class="ws-icon grid size-10 shrink-0 place-items-center">
							<svg
								aria-hidden="true"
								class="size-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
							>
								<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"></path>
								<path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"></path>
							</svg>
						</span>
						<div class="min-w-0">
							<p class="text-sm font-medium text-[#5c554e]">Link pernikahan</p>
							{#if weddingURL}
								<a
									href={weddingURL}
									target="_blank"
									rel="noreferrer"
									class="mt-1 block truncate text-lg font-bold text-[#191919] hover:text-gray-600"
								>
									{weddingHost}
								</a>
							{:else}
								<p class="mt-1 text-lg font-bold text-amber-700" role="status">
									Nama domain belum diatur
								</p>
							{/if}
						</div>
					</div>
					<a
						href="/user/data"
						aria-label="Edit link pernikahan"
						title="Edit link pernikahan"
						class="ws-button ws-button--icon grid size-10 shrink-0 place-items-center transition"
					>
						<svg
							aria-hidden="true"
							class="size-4.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 20h9"></path>
							<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
						</svg>
					</a>
				</div>
			</article>

			<article class="ws-panel flex min-w-0 items-center p-5">
				<div class="flex w-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="text-sm font-medium text-[#5c554e]">Paket aktif</p>
						<h2 class="mt-2 text-2xl font-extrabold tracking-tight text-[#191919]">
							{weddingPlanTier === 'pro'
								? 'Paket Pro'
								: weddingPlanTier === 'free'
									? 'Free'
									: 'Paket belum tersedia'}
						</h2>
					</div>
					{#if weddingPlanTier === 'free'}
						<a
							href="/user/upgrade"
							class="ws-button inline-flex shrink-0 items-center justify-center px-5 py-3 text-sm transition"
						>
							Upgrade
						</a>
					{/if}
				</div>
			</article>
		</div>

		<article class="ws-panel mt-5 w-full p-6">
			<div class="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
				<div>
					<p class="text-sm font-medium text-[#5c554e]">Kelengkapan undangan</p>
					<h2 class="mt-2 text-2xl font-extrabold tracking-tight text-[#191919]">
						{progressPercentage}% selesai
					</h2>
					{#if weddingProgress}
						<p class="mt-2 text-sm text-[#5c554e]">
							{weddingProgress.completedFields} dari {weddingProgress.totalFields} data utama telah diisi.
						</p>
					{:else}
						<p class="mt-2 text-sm text-red-600">
							{weddingProgressError ?? 'Progres data undangan belum tersedia.'}
						</p>
					{/if}
				</div>
				<div
					class="ws-progress h-3 overflow-hidden bg-[#fffaf1] sm:col-span-2 sm:row-start-2"
					role="progressbar"
					aria-label="Kelengkapan data undangan"
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={progressPercentage}
				>
					<div
						class="h-full bg-[#ff96ca] transition-[width] duration-500"
						style:width={`${progressPercentage}%`}
					></div>
				</div>
				<a
					href="/user/data"
					class="ws-button ws-button--primary w-full shrink-0 sm:col-start-2 sm:row-start-1 sm:w-auto"
				>
					Lengkapi data
				</a>
			</div>
		</article>

		<article class="ws-panel mt-5 w-full p-5">
			<h2 class="text-lg font-extrabold text-[#191919]">Tamu</h2>
			<div class="ws-metrics mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
				{#each stats as stat (stat.label)}
					<div class="ws-inset min-w-0 p-3.5">
						<p class="text-sm font-medium text-[#5c554e]">{stat.label}</p>
						<div class="mt-4 flex items-end justify-between gap-3">
							<p class="text-4xl font-bold tracking-tight text-[#191919]">{stat.value}</p>
							<span class="ws-badge px-3 py-1 text-xs font-semibold">
								{stat.badge}
							</span>
						</div>
					</div>
				{/each}
			</div>
			{#if guestStatsError}
				<p class="mt-4 text-sm text-red-600">{guestStatsError}</p>
			{/if}
		</article>
	</div>
</section>
