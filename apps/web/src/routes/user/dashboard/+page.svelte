<script lang="ts">
	import { GuestDataError, getGuests, type Guest } from '#lib/features/guests/index.js';
	import {
		WeddingDataError,
		calculateWeddingCompletion,
		getCurrentWedding,
		getWeddingInvitationHost,
		getWeddingInvitationUrl
	} from '#lib/features/weddings/index.js';

	type GuestStats = {
		total: number;
		attending: number;
		notAttending: number;
		pending: number;
	};

	function calculateGuestStats(guests: Guest[]): GuestStats {
		const stats: GuestStats = {
			total: 0,
			attending: 0,
			notAttending: 0,
			pending: 0
		};

		for (const guest of guests) {
			const guestCount = Math.max(1, Math.trunc(guest.guest_count));
			stats.total += guestCount;

			if (guest.rsvp_status === 'attending') {
				stats.attending += guestCount;
			} else if (guest.rsvp_status === 'not_attending') {
				stats.notAttending += guestCount;
			} else {
				stats.pending += guestCount;
			}
		}

		return stats;
	}

	async function getDashboardData() {
		try {
			const wedding = await getCurrentWedding();
			let guestStats: GuestStats | null = null;
			let guestStatsError: string | null = null;

			try {
				guestStats = calculateGuestStats(await getGuests());
			} catch (error) {
				guestStatsError =
					error instanceof GuestDataError ? error.message : 'Statistik tamu gagal dimuat.';
			}

			return {
				weddingProgress: calculateWeddingCompletion(wedding),
				weddingSlug: wedding.slug,
				weddingPlanTier: wedding.plan_tier,
				weddingProgressError: null,
				guestStats,
				guestStatsError
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
	<div class="mx-auto w-full max-w-6xl">
		<div class="grid w-full min-w-0 gap-5 lg:grid-cols-2">
			<article
				class="flex min-w-0 items-center rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
			>
				<div class="flex w-full min-w-0 items-center justify-between gap-4">
					<div class="flex min-w-0 items-center gap-3">
						<span
							class="grid size-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-gray-600"
						>
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
							<p class="text-sm font-medium text-gray-500">Link pernikahan</p>
							{#if weddingURL}
								<a
									href={weddingURL}
									target="_blank"
									rel="noreferrer"
									class="mt-1 block truncate text-lg font-bold text-gray-900 hover:text-gray-600"
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
						class="grid size-10 shrink-0 place-items-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
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

			<article
				class="flex min-w-0 items-center rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
			>
				<div class="flex w-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="text-sm font-medium text-gray-500">Paket aktif</p>
						<h2 class="mt-2 text-2xl font-bold tracking-tight text-gray-900">
							{weddingPlanTier === 'pro'
								? 'Paket Pro'
								: weddingPlanTier === 'free'
									? 'Free'
									: 'Paket belum tersedia'}
						</h2>
					</div>
					<a
						href="/user/setting"
						class="inline-flex shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
					>
						Lihat paket
					</a>
				</div>
			</article>
		</div>

		<article class="mt-5 w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
			<div class="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
				<div>
					<p class="text-sm font-medium text-gray-500">Kelengkapan undangan</p>
					<h2 class="mt-2 text-2xl font-bold tracking-tight text-gray-900">
						{progressPercentage}% selesai
					</h2>
					{#if weddingProgress}
						<p class="mt-2 text-sm text-gray-500">
							{weddingProgress.completedFields} dari {weddingProgress.totalFields} data utama telah diisi.
						</p>
					{:else}
						<p class="mt-2 text-sm text-red-600">
							{weddingProgressError ?? 'Progres data undangan belum tersedia.'}
						</p>
					{/if}
				</div>
				<div
					class="h-3 overflow-hidden rounded-full bg-gray-100 sm:col-span-2 sm:row-start-2"
					role="progressbar"
					aria-label="Kelengkapan data undangan"
					aria-valuemin="0"
					aria-valuemax="100"
					aria-valuenow={progressPercentage}
				>
					<div
						class="h-full rounded-full bg-yellow-400 transition-[width] duration-500"
						style:width={`${progressPercentage}%`}
					></div>
				</div>
				<a
					href="/user/data"
					class="inline-flex w-full shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 sm:col-start-2 sm:row-start-1 sm:w-auto"
				>
					Lengkapi data
				</a>
			</div>
		</article>

		<article class="mt-5 w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
			<h2 class="text-lg font-bold text-gray-900">Tamu</h2>
			<div class="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
				{#each stats as stat (stat.label)}
					<div class="min-w-0 rounded-xl border border-gray-200 bg-white p-3.5">
						<p class="text-sm font-medium text-gray-500">{stat.label}</p>
						<div class="mt-4 flex items-end justify-between gap-3">
							<p class="text-4xl font-bold tracking-tight text-gray-900">{stat.value}</p>
							<span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
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
