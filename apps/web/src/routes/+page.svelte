<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';
	import ThemeCatalogCard from '#lib/features/wedding-themes/components/ThemeCatalogCard.svelte';
	import { WEDDING_THEME_CATALOG } from '#lib/features/wedding-themes/model/theme-catalog.js';
	import type { WeddingThemeKey } from '#lib/features/wedding-themes/model/wedding-theme.js';

	type Plan = {
		name: string;
		price: string;
		description: string;
		features: string[];
		featured: boolean;
	};

	const navItems = [
		{ href: '#beranda', label: 'Beranda' },
		{ href: '/tema', label: 'Tema' },
		{ href: '#harga', label: 'Harga' }
	];

	const featuredThemeKeys: WeddingThemeKey[] = [
		'minimalist-1',
		'neubrutalism-1',
		'playful-1',
		'3d-design-1'
	];
	const themes = WEDDING_THEME_CATALOG.filter((theme) => featuredThemeKeys.includes(theme.key));

	const benefits = [
		{
			title: 'Tautan personal',
			description: 'Sapa setiap tamu dengan nama mereka melalui tautan undangan yang personal.'
		},
		{
			title: 'RSVP terorganisir',
			description: 'Pantau siapa yang hadir, tidak hadir, dan belum memberikan jawaban.'
		},
		{
			title: 'Selalu mudah diedit',
			description: 'Perbarui informasi acara kapan saja tanpa harus mengirim ulang undangan.'
		}
	];

	type Reason = {
		title: string;
		description: string;
		image: string;
		alt: string;
	};

	const reasons: Reason[] = [
		{
			title: 'Desain Eksklusif',
			description:
				'Setiap tema dirancang dengan detail yang matang agar undangan kalian terasa personal, modern, dan tidak pasaran.',
			image: '/images/why-wedez/exclusive-design.webp',
			alt: 'Ilustrasi rangkaian kartu undangan pernikahan premium dengan detail botanical'
		},
		{
			title: 'Edit Mudah Tanpa Skills',
			description:
				'Ubah teks, foto, jadwal, dan tampilan langsung dari dashboard yang sederhana tanpa perlu memahami coding atau desain.',
			image: '/images/why-wedez/easy-editing.webp',
			alt: 'Ilustrasi laptop dengan editor visual undangan pernikahan yang mudah digunakan'
		},
		{
			title: 'Fitur Lengkap',
			description:
				'Galeri, lokasi acara, daftar tamu, RSVP, hingga informasi kado tersusun rapi dalam satu undangan digital.',
			image: '/images/why-wedez/complete-features.webp',
			alt: 'Ilustrasi fitur lengkap undangan digital dalam tampilan dashboard'
		},
		{
			title: 'Harga Terjangkau',
			description:
				'Mulai membuat secara gratis dan pilih paket saat sudah siap, tanpa biaya berlangganan yang membebani.',
			image: '/images/why-wedez/affordable-price.webp',
			alt: 'Ilustrasi undangan pernikahan elegan dengan koin dan cincin emas'
		}
	];

	const plans: Plan[] = [
		{
			name: 'Free',
			price: 'Rp0',
			description: 'Mulai merancang undangan dan lihat hasilnya sebelum dipublikasikan.',
			features: ['Tema Terbatas', 'Tamu Terbatas', 'Ada Watermark'],
			featured: false
		},
		{
			name: 'Pro',
			price: 'Rp50rb',
			description: 'Semua yang dibutuhkan untuk membagikan dan mengelola undangan kalian.',
			features: ['Semua Tema Premium', 'Unlimited Tamu', 'No Watermark'],
			featured: true
		}
	];

	const faqs = [
		{
			question: 'Apakah Wedez gratis digunakan?',
			answer:
				'Ya, Wedez menyediakan paket gratis dengan tema dasar dan maksimal 100 tamu. Paket Pro membuka semua tema premium, tamu tanpa batas, dan menghilangkan watermark.'
		},
		{
			question: 'Bagaimana cara membuat undangan di Wedez?',
			answer:
				'Anda dapat membuat undangan dengan mendaftar di website kami, mengisi form, memilih tema, menyesuaikan konten, dan mengirimkannya kepada tamu melalui link.'
		},
		{
			question: 'Bagaimana cara upgrade ke Premium?',
			answer:
				'Anda dapat upgrade langsung di dashboard setelah membuat undangan. Pilih paket Pro, lakukan pembayaran, dan undangan Anda otomatis berubah menjadi Premium.'
		},
		{
			question: 'Apakah Wedez menyediakan dukungan pelanggan?',
			answer:
				'Ya, Wedez menyediakan dukungan pelanggan melalui chat WhatsApp untuk membantu menjawab pertanyaan atau mengatasi masalah dengan cepat dan responsif.'
		}
	] as const;

	let mobileMenuOpen = $state(false);

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function animateFaqAnswer(event: Event) {
		const details = event.currentTarget as HTMLDetailsElement;
		if (!details.open || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const answer = details.querySelector<HTMLElement>('.faq-answer');
		if (!answer) return;

		answer.getAnimations().forEach((animation) => animation.cancel());
		answer.animate(
			[
				{ opacity: 0, transform: 'translateY(-0.375rem)' },
				{ opacity: 1, transform: 'translateY(0)' }
			],
			{ duration: 180, easing: 'ease-out' }
		);
	}

	onMount(() => {
		let disposed = false;
		let revertAnimations: (() => void) | undefined;

		void (async () => {
			try {
				const [{ gsap }, { ScrollTrigger }] = await Promise.all([
					import('gsap'),
					import('gsap/ScrollTrigger')
				]);
				const root = document.getElementById('main-content');
				if (disposed || !root) return;

				gsap.registerPlugin(ScrollTrigger);
				const media = gsap.matchMedia();
				media.add('(prefers-reduced-motion: no-preference)', () => {
					const context = gsap.context(() => {
						root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
							gsap.from(element, {
								autoAlpha: 0,
								y: 28,
								duration: 0.7,
								ease: 'power2.out',
								clearProps: 'opacity,visibility,transform',
								scrollTrigger: {
									trigger: element,
									start: 'top 88%',
									once: true
								}
							});
						});
					}, root);

					return () => context.revert();
				});
				revertAnimations = () => media.revert();
			} catch (error) {
				console.error('Animasi landing page gagal dimuat.', error);
			}
		})();

		return () => {
			disposed = true;
			revertAnimations?.();
		};
	});
</script>

<svelte:head>
	<title>Wedez — Undangan Pernikahan Digital</title>
	<meta
		name="description"
		content="Buat undangan pernikahan digital yang personal, mudah dibagikan, dan praktis dikelola bersama Wedez."
	/>
	<meta name="theme-color" content="#ffffff" />
	<meta property="og:title" content="Wedez — Undangan Pernikahan Digital" />
	<meta
		property="og:description"
		content="Pilih tema, lengkapi cerita, dan bagikan undangan pernikahan digital kalian."
	/>
</svelte:head>

<a
	class="fixed top-3 left-3 z-100 -translate-y-20 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0"
	href="#main-content">Lewati ke konten utama</a
>

<header
	class="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md md:sticky md:inset-x-auto"
>
	<div
		class="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-4 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-8 2xl:max-w-[1600px] 2xl:px-10"
	>
		<a class="flex items-center gap-2" href="#beranda" aria-label="Wedez, kembali ke beranda">
			<img
				class="size-12 shrink-0 object-contain"
				src="/images/hero/logo-wedez.webp"
				alt=""
				width="256"
				height="256"
			/>
			<span
				class="bg-linear-to-r from-[#9400ff] to-[#7200e8] bg-clip-text text-xl font-bold tracking-[-0.04em] text-transparent"
				>wedez.id</span
			>
		</a>

		<nav class="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
			{#each navItems as item (item.href)}
				<a
					class="text-sm font-medium text-gray-600 transition-colors hover:text-gray-950"
					href={item.href}>{item.label}</a
				>
			{/each}
		</nav>
		<a
			class="hidden justify-self-end rounded-full bg-linear-to-r from-[#9400ff] to-[#7200e8] px-5 py-2.5 text-sm font-semibold text-white md:inline-flex"
			href="/login">Buat Undangan</a
		>

		<button
			class="grid size-10 place-items-center rounded-xl border border-gray-200 text-gray-900 md:hidden"
			type="button"
			aria-expanded={mobileMenuOpen}
			aria-controls="mobile-navigation"
			aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
		>
			{#if mobileMenuOpen}
				<svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M6 6L18 18M18 6L6 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			{:else}
				<svg class="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M4 7H20M4 12H20M4 17H20"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			{/if}
		</button>
	</div>

	{#if mobileMenuOpen}
		<nav
			id="mobile-navigation"
			class="absolute inset-x-0 top-full overflow-hidden border-y border-gray-200 bg-white px-4 py-4 shadow-lg md:hidden"
			aria-label="Navigasi mobile"
			transition:slide={{ duration: 240, axis: 'y' }}
		>
			<div class="mx-auto flex w-full max-w-7xl flex-col gap-1">
				{#each navItems as item (item.href)}
					<a
						class="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
						href={item.href}
						onclick={closeMobileMenu}>{item.label}</a
					>
				{/each}
				<a
					class="mt-2 rounded-xl bg-linear-to-r from-[#9400ff] to-[#7200e8] px-4 py-3 text-center text-sm font-semibold text-white"
					href="/login"
					onclick={closeMobileMenu}>Buat Undangan</a
				>
			</div>
		</nav>
	{/if}
</header>
<div class="h-18 md:hidden" aria-hidden="true"></div>

<main id="main-content" class="w-full">
	<section
		id="beranda"
		class="mx-auto flex min-h-[calc(100dvh-4.5rem)] w-full max-w-7xl scroll-mt-22 items-center overflow-hidden bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16 2xl:max-w-[1600px] 2xl:px-10"
	>
		<div
			class="grid w-full items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 2xl:grid-cols-[0.85fr_1.15fr] 2xl:gap-24"
		>
			<div class="order-2 min-w-0 lg:order-1">
				<h1
					data-reveal
					class="max-w-2xl text-[40px] leading-[1.08] font-bold tracking-[-0.045em] text-gray-950 sm:text-[48px] lg:text-[56px] 2xl:max-w-3xl 2xl:text-[64px]"
				>
					Undangan Digital untuk <span
						class="bg-linear-to-r from-[#9400ff] to-[#7200e8] bg-clip-text text-transparent"
						>Gen Z</span
					>
				</h1>

				<p
					data-reveal
					class="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8 2xl:max-w-2xl 2xl:text-xl 2xl:leading-9"
				>
					Buat undangan digital yang estetik, personal, dan gampang dibagikan. Pilih tema, ceritakan
					momen kalian, lalu pantau RSVP—semuanya dalam satu tempat.
				</p>

				<div class="mt-8 flex flex-col gap-3 sm:flex-row">
					<a
						data-reveal
						class="inline-flex min-h-12 items-center justify-center rounded-full bg-linear-to-r from-[#9400ff] to-[#7200e8] px-6 text-sm font-semibold text-white"
						href="/login"
					>
						Buat undangan gratis
						<svg class="ml-2 size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M5 12H19M13 6L19 12L13 18"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</a>
					<a
						data-reveal
						class="inline-flex min-h-12 items-center justify-center rounded-full border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-100"
						href="#tema">Lihat pilihan tema</a
					>
				</div>

				<div class="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-500">
					<span data-reveal class="flex items-center gap-2"
						><span class="text-gray-500">●</span> Gratis mencoba</span
					>
					<span data-reveal class="flex items-center gap-2"
						><span class="text-gray-500">●</span> Tanpa coding</span
					>
					<span data-reveal class="flex items-center gap-2"
						><span class="text-gray-500">●</span> Responsif di semua layar</span
					>
				</div>
			</div>

			<div
				data-reveal
				class="relative order-1 mx-auto w-full max-w-2xl min-w-0 lg:order-2 lg:translate-y-3 2xl:max-w-3xl"
			>
				<div
					class="absolute -inset-10 -z-10 rounded-full bg-gray-200/70 blur-3xl"
					aria-hidden="true"
				></div>
				<img
					class="relative z-10 h-auto w-full object-contain drop-shadow-[0_28px_45px_rgba(23,23,23,0.18)]"
					src="/images/hero/digital-wedding-invitation.webp"
					alt="Pratinjau website undangan pernikahan digital pada laptop dan ponsel"
					width="1536"
					height="1024"
					fetchpriority="high"
				/>
				<div
					class="hidden overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 p-3 shadow-xl shadow-gray-200/60 sm:p-5"
				>
					<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
						<div
							class="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5"
						>
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded-full bg-gray-300"></span>
								<span class="size-2.5 rounded-full bg-gray-300"></span>
								<span class="size-2.5 rounded-full bg-gray-900"></span>
							</div>
							<p class="text-xs font-medium text-gray-500">Wedez Dashboard</p>
							<span
								class="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600"
								>Aktif</span
							>
						</div>

						<div class="grid min-h-105 grid-cols-[76px_1fr] sm:grid-cols-[150px_1fr]">
							<aside class="flex flex-col border-r border-gray-200 bg-white p-2.5 sm:p-4">
								<p class="text-center text-xs font-bold tracking-tight text-gray-900 sm:text-base">
									<span class="sm:hidden">W</span>
									<span class="hidden sm:inline">Wedez</span>
								</p>
								<nav class="mt-4 space-y-1" aria-label="Pratinjau navigasi dashboard">
									<div
										class="flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-2 py-2 text-[10px] font-semibold text-gray-900 sm:justify-start"
									>
										<svg
											class="size-3.5 shrink-0"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.8"
											aria-hidden="true"
										>
											<path d="M3 11.5 12 4l9 7.5"></path>
											<path d="M5.5 10v10h13V10M9 20v-6h6v6"></path>
										</svg>
										<span class="hidden sm:inline">Beranda</span>
									</div>
									{#each ['Data Pernikahan', 'Undangan', 'Pengaturan'] as item (item)}
										<div
											class="flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-[10px] font-medium text-gray-500 sm:justify-start"
										>
											<svg
												class="size-3.5 shrink-0"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
												aria-hidden="true"
											>
												{#if item === 'Data Pernikahan'}
													<rect x="3" y="5" width="18" height="16" rx="2"></rect>
													<path d="M8 3v4M16 3v4M3 10h18"></path>
												{:else if item === 'Undangan'}
													<rect x="3" y="5" width="18" height="14" rx="2"></rect>
													<path d="m4 7 8 6 8-6"></path>
												{:else}
													<path d="M4 7h10M18 7h2M4 17h2M10 17h10"></path>
													<circle cx="16" cy="7" r="2"></circle>
													<circle cx="8" cy="17" r="2"></circle>
												{/if}
											</svg>
											<span class="hidden sm:inline">{item}</span>
										</div>
									{/each}
								</nav>
								<div class="mt-auto border-t border-gray-200 pt-3">
									<div
										class="rounded-lg bg-red-600 px-2 py-2 text-center text-[9px] font-semibold text-white"
									>
										<span class="sm:hidden">Keluar</span>
										<span class="hidden sm:inline">Logout</span>
									</div>
								</div>
							</aside>

							<div class="min-w-0 bg-gray-100">
								<div class="flex h-10 items-center border-b border-gray-200 bg-white px-3 sm:px-4">
									<p class="text-xs font-bold tracking-tight text-gray-900 sm:text-sm">Beranda</p>
								</div>
								<div class="space-y-2.5 p-2.5 sm:p-4">
									<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
										<div class="flex items-center gap-2.5">
											<span
												class="grid size-7 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-600"
											>
												<svg
													class="size-3.5"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.8"
													aria-hidden="true"
												>
													<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"></path>
													<path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"></path>
												</svg>
											</span>
											<div class="min-w-0 flex-1">
												<p class="text-[8px] font-medium text-gray-500 sm:text-[9px]">
													Link pernikahan
												</p>
												<p class="truncate text-[10px] font-bold text-gray-900 sm:text-xs">
													wedez.id/raka-laras
												</p>
											</div>
											<span
												class="hidden rounded-lg bg-gray-900 px-2.5 py-2 text-[8px] font-semibold text-white sm:inline-flex"
												>Kelola undangan</span
											>
										</div>
									</div>

									<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
										<div class="flex items-start justify-between gap-2">
											<div>
												<p class="text-[8px] font-medium text-gray-500 sm:text-[9px]">
													Kelengkapan undangan
												</p>
												<p class="mt-1 text-sm font-bold tracking-tight text-gray-900 sm:text-base">
													80% selesai
												</p>
											</div>
											<span
												class="rounded-lg border border-gray-300 px-2 py-1.5 text-[8px] font-semibold text-gray-700"
												>Lengkapi data</span
											>
										</div>
										<div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
											<div class="h-full w-4/5 rounded-full bg-yellow-400"></div>
										</div>
									</div>

									<div class="grid grid-cols-3 gap-1.5 sm:gap-2.5">
										{#each [{ label: 'Tamu diundang', value: '128', badge: 'Total' }, { label: 'Tamu hadir', value: '86', badge: 'Hadir' }, { label: 'Tidak hadir', value: '12', badge: 'Berhalangan' }] as stat (stat.label)}
											<div
												class="min-w-0 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm"
											>
												<p class="truncate text-[7px] font-medium text-gray-500 sm:text-[8px]">
													{stat.label}
												</p>
												<p
													class="mt-1.5 text-base font-bold tracking-tight text-gray-900 sm:text-lg"
												>
													{stat.value}
												</p>
												<span
													class="mt-1 hidden rounded-full bg-gray-100 px-1.5 py-0.5 text-[7px] font-semibold text-gray-500 sm:inline-flex"
													>{stat.badge}</span
												>
											</div>
										{/each}
									</div>

									<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
										<div class="flex items-center justify-between gap-3">
											<div>
												<p class="text-[8px] font-medium text-gray-500 sm:text-[9px]">
													Paket aktif
												</p>
												<p class="mt-1 text-sm font-bold tracking-tight text-gray-900">
													Paket Gratis
												</p>
											</div>
											<span
												class="rounded-lg border border-gray-300 px-2 py-1.5 text-[8px] font-semibold text-gray-700"
												>Lihat paket</span
											>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<div class="border-y border-gray-200 bg-gray-100">
		<section
			class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[1600px] 2xl:px-10"
			aria-label="Ringkasan Wedez"
		>
			<div class="grid w-full grid-cols-2 gap-6 sm:grid-cols-4">
				{#each [{ value: '5 menit', label: 'Mulai membuat' }, { value: '20+', label: 'Tema pilihan' }, { value: '1 link', label: 'Untuk semua tamu' }, { value: '24/7', label: 'Bisa diperbarui' }] as stat (stat.label)}
					<div data-reveal class="text-center">
						<p class="text-lg font-semibold text-gray-950">{stat.value}</p>
						<p class="mt-1 text-xs text-gray-500 sm:text-sm">{stat.label}</p>
					</div>
				{/each}
			</div>
		</section>
	</div>

	<section class="w-full bg-white py-20 lg:py-28" aria-labelledby="why-wedez-title">
		<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px] 2xl:px-10">
			<div class="max-w-3xl">
				<p data-reveal class="text-sm font-semibold text-[#667052]">KENAPA MEMILIH WEDEZ</p>
				<h2
					data-reveal
					id="why-wedez-title"
					class="mt-3 text-[40px] leading-[1.1] font-bold tracking-[-0.04em] text-gray-950 sm:text-[48px] lg:text-[56px]"
				>
					Lebih sederhana untuk kalian, lebih berkesan untuk tamu.
				</h2>
				<p data-reveal class="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
					Semua yang dibutuhkan untuk membuat dan mengelola undangan, dirancang dalam satu
					pengalaman yang mudah digunakan.
				</p>
			</div>

			<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
				{#each reasons as reason (reason.title)}
					<article
						data-reveal
						class="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/70"
					>
						<div class="aspect-4/3 overflow-hidden bg-[#f5f0e6]">
							<img
								class="size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
								src={reason.image}
								alt={reason.alt}
								width="1200"
								height="1200"
								loading="lazy"
							/>
						</div>
						<div class="flex-1 bg-white p-6">
							<div>
								<h3 class="text-xl font-bold tracking-tight text-gray-950">{reason.title}</h3>
								<p class="mt-3 text-sm leading-6 text-gray-600">{reason.description}</p>
							</div>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<div class="bg-gray-100">
		<section
			class="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28 2xl:max-w-[1600px] 2xl:px-10"
		>
			<div class="w-full">
				<div
					id="tema"
					class="flex scroll-mt-22 flex-col justify-between gap-6 md:flex-row md:items-end"
				>
					<div class="max-w-2xl">
						<p data-reveal class="text-sm font-semibold text-gray-600">PILIHAN TEMA</p>
						<h2
							data-reveal
							class="mt-3 text-[40px] leading-[1.1] font-bold tracking-[-0.04em] text-gray-950 sm:text-[48px] lg:text-[56px]"
						>
							Temukan gaya yang terasa seperti kalian.
						</h2>
					</div>
					<a
						data-reveal
						class="inline-flex items-center text-sm font-semibold text-gray-900 hover:text-gray-600"
						href="/tema"
					>
						Lihat semua tema
						<svg class="ml-2 size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M5 12H19M13 6L19 12L13 18"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</a>
				</div>

				<div class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
					{#each themes as theme (theme.key)}
						<div data-reveal class="min-w-0">
							<ThemeCatalogCard {theme} headingTag="h3" />
						</div>
					{/each}
				</div>
			</div>
		</section>
	</div>

	<section class="w-full bg-white py-20 lg:py-28" aria-labelledby="features-title">
		<div
			class="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8 2xl:max-w-[1600px] 2xl:gap-24 2xl:px-10"
		>
			<div>
				<p data-reveal class="text-sm font-semibold text-gray-600">SATU DASHBOARD</p>
				<h2
					data-reveal
					id="features-title"
					class="mt-3 text-[40px] leading-[1.1] font-bold tracking-[-0.04em] text-gray-950 sm:text-[48px] lg:text-[56px]"
				>
					Lebih dekat dengan setiap tamu.
				</h2>
				<p data-reveal class="mt-5 text-lg leading-8 text-gray-600">
					Semua informasi penting tersedia dalam satu tempat yang mudah dipahami.
				</p>

				<div class="mt-10 space-y-7">
					{#each benefits as benefit (benefit.title)}
						<div data-reveal class="flex gap-4">
							<span
								class="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-white text-gray-900 shadow-sm"
							>
								<svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path
										d="M7 12.5L10.5 16L17.5 8.5"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</span>
							<div>
								<h3 class="font-semibold text-gray-950">{benefit.title}</h3>
								<p class="mt-1 leading-7 text-gray-600">{benefit.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div
				data-reveal
				class="relative mx-auto w-full max-w-2xl rounded-4xl bg-gray-100 p-2 shadow-sm sm:p-3"
			>
				<div
					class="absolute -inset-8 -z-10 rounded-full bg-gray-200/70 blur-3xl"
					aria-hidden="true"
				></div>
				<div
					class="overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 p-3 shadow-xl shadow-gray-200/60 sm:p-5"
				>
					<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
						<div
							class="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5"
						>
							<div class="flex items-center gap-2">
								<span class="size-2.5 rounded-full bg-gray-300"></span>
								<span class="size-2.5 rounded-full bg-gray-300"></span>
								<span class="size-2.5 rounded-full bg-gray-900"></span>
							</div>
							<p class="text-xs font-medium text-gray-500">Wedez Dashboard</p>
							<span
								class="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600"
								>Aktif</span
							>
						</div>

						<div class="grid min-h-105 grid-cols-[76px_1fr] sm:grid-cols-[150px_1fr]">
							<aside class="flex flex-col border-r border-gray-200 bg-white p-2.5 sm:p-4">
								<p class="text-center text-xs font-bold tracking-tight text-gray-900 sm:text-base">
									<span class="sm:hidden">W</span>
									<span class="hidden sm:inline">Wedez</span>
								</p>
								<nav class="mt-4 space-y-1" aria-label="Pratinjau navigasi dashboard kedua">
									<div
										class="flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-2 py-2 text-[10px] font-semibold text-gray-900 sm:justify-start"
									>
										<svg
											class="size-3.5 shrink-0"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.8"
											aria-hidden="true"
										>
											<path d="M3 11.5 12 4l9 7.5"></path>
											<path d="M5.5 10v10h13V10M9 20v-6h6v6"></path>
										</svg>
										<span class="hidden sm:inline">Beranda</span>
									</div>
									{#each ['Data Pernikahan', 'Undangan', 'Pengaturan'] as item (item)}
										<div
											class="flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-[10px] font-medium text-gray-500 sm:justify-start"
										>
											<svg
												class="size-3.5 shrink-0"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
												aria-hidden="true"
											>
												{#if item === 'Data Pernikahan'}
													<rect x="3" y="5" width="18" height="16" rx="2"></rect>
													<path d="M8 3v4M16 3v4M3 10h18"></path>
												{:else if item === 'Undangan'}
													<rect x="3" y="5" width="18" height="14" rx="2"></rect>
													<path d="m4 7 8 6 8-6"></path>
												{:else}
													<path d="M4 7h10M18 7h2M4 17h2M10 17h10"></path>
													<circle cx="16" cy="7" r="2"></circle>
													<circle cx="8" cy="17" r="2"></circle>
												{/if}
											</svg>
											<span class="hidden sm:inline">{item}</span>
										</div>
									{/each}
								</nav>
								<div class="mt-auto border-t border-gray-200 pt-3">
									<div
										class="rounded-lg bg-red-600 px-2 py-2 text-center text-[9px] font-semibold text-white"
									>
										<span class="sm:hidden">Keluar</span>
										<span class="hidden sm:inline">Logout</span>
									</div>
								</div>
							</aside>

							<div class="min-w-0 bg-gray-100">
								<div class="flex h-10 items-center border-b border-gray-200 bg-white px-3 sm:px-4">
									<p class="text-xs font-bold tracking-tight text-gray-900 sm:text-sm">Beranda</p>
								</div>
								<div class="space-y-2.5 p-2.5 sm:p-4">
									<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
										<div class="flex items-center gap-2.5">
											<span
												class="grid size-7 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-600"
											>
												<svg
													class="size-3.5"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="1.8"
													aria-hidden="true"
												>
													<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"></path>
													<path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"></path>
												</svg>
											</span>
											<div class="min-w-0 flex-1">
												<p class="text-[8px] font-medium text-gray-500 sm:text-[9px]">
													Link pernikahan
												</p>
												<p class="truncate text-[10px] font-bold text-gray-900 sm:text-xs">
													wedez.id/raka-laras
												</p>
											</div>
											<span
												class="hidden rounded-lg bg-gray-900 px-2.5 py-2 text-[8px] font-semibold text-white sm:inline-flex"
												>Kelola undangan</span
											>
										</div>
									</div>

									<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
										<div class="flex items-start justify-between gap-2">
											<div>
												<p class="text-[8px] font-medium text-gray-500 sm:text-[9px]">
													Kelengkapan undangan
												</p>
												<p class="mt-1 text-sm font-bold tracking-tight text-gray-900 sm:text-base">
													80% selesai
												</p>
											</div>
											<span
												class="rounded-lg border border-gray-300 px-2 py-1.5 text-[8px] font-semibold text-gray-700"
												>Lengkapi data</span
											>
										</div>
										<div class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
											<div class="h-full w-4/5 rounded-full bg-yellow-400"></div>
										</div>
									</div>

									<div class="grid grid-cols-3 gap-1.5 sm:gap-2.5">
										{#each [{ label: 'Tamu diundang', value: '128' }, { label: 'Tamu hadir', value: '86' }, { label: 'Tidak hadir', value: '12' }] as stat (stat.label)}
											<div
												class="min-w-0 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm"
											>
												<p class="truncate text-[7px] font-medium text-gray-500 sm:text-[8px]">
													{stat.label}
												</p>
												<p
													class="mt-1.5 text-base font-bold tracking-tight text-gray-900 sm:text-lg"
												>
													{stat.value}
												</p>
											</div>
										{/each}
									</div>

									<div class="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
										<div class="flex items-center justify-between gap-3">
											<div>
												<p class="text-[8px] font-medium text-gray-500 sm:text-[9px]">
													Paket aktif
												</p>
												<p class="mt-1 text-sm font-bold tracking-tight text-gray-900">
													Paket Gratis
												</p>
											</div>
											<span
												class="rounded-lg border border-gray-300 px-2 py-1.5 text-[8px] font-semibold text-gray-700"
												>Lihat paket</span
											>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<div class="bg-gray-100">
		<section
			class="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28 2xl:max-w-[1600px] 2xl:px-10"
		>
			<div class="w-full">
				<div id="harga" class="mx-auto max-w-2xl scroll-mt-22 text-center">
					<p data-reveal class="text-sm font-semibold text-gray-600">HARGA SEDERHANA</p>
					<h2
						data-reveal
						class="mt-3 text-[40px] leading-[1.1] font-bold tracking-[-0.04em] text-gray-950 sm:text-[48px] lg:text-[56px]"
					>
						Mulai gratis, bayar saat siap.
					</h2>
					<p data-reveal class="mt-5 text-lg leading-8 text-gray-600">
						Coba seluruh alur pembuatan undangan terlebih dahulu. Tidak ada biaya berlangganan.
					</p>
				</div>

				<div class="mt-12 grid gap-6 md:grid-cols-2">
					{#each plans as plan (plan.name)}
						<article
							data-reveal
							class="relative flex flex-col rounded-3xl border border-gray-200 bg-white p-7 sm:p-9"
						>
							<p class="text-2xl font-bold tracking-[-0.02em] text-gray-950 sm:text-3xl">
								{plan.name}
							</p>
							<p class="mt-5 text-4xl font-bold tracking-[-0.04em] text-gray-950 sm:text-5xl">
								{plan.price}
							</p>
							<p class="mt-4 leading-7 text-gray-700">{plan.description}</p>
							<ul class="my-8 space-y-3.5">
								{#each plan.features as feature (feature)}
									<li class="flex items-center gap-3 text-sm text-gray-800">
										<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
											<path
												d="M7 12.5L10.5 16L17.5 8.5"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
										{feature}
									</li>
								{/each}
							</ul>
							<a
								class={[
									'mt-auto inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors',
									'bg-linear-to-r from-[#9400ff] to-[#7200e8] text-white'
								]}
								href="#buat-undangan"
							>
								{plan.featured ? 'Pilih Siap Tayang' : 'Mulai mencoba'}
							</a>
						</article>
					{/each}
				</div>
			</div>
		</section>
	</div>

	<section id="faq" class="w-full scroll-mt-22 bg-white py-20 lg:py-28" aria-labelledby="faq-title">
		<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 2xl:max-w-[1600px] 2xl:px-10">
			<div class="mx-auto max-w-3xl text-center">
				<p data-reveal class="text-sm font-semibold text-gray-600">PERTANYAAN UMUM</p>
				<h2
					data-reveal
					id="faq-title"
					class="mt-3 text-[40px] leading-[1.1] font-bold tracking-[-0.04em] text-gray-950 sm:text-[48px] lg:text-[56px]"
				>
					FAQ - Pertanyaan yang sering diajukan
				</h2>
				<p
					data-reveal
					class="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8"
				>
					Butuh bantuan? Pertanyaan berikut mungkin dapat membantu Anda.
				</p>
			</div>

			<div class="mt-12 space-y-3 sm:mt-14 sm:space-y-4">
				{#each faqs as faq (faq.question)}
					<details
						data-reveal
						name="wedez-faq"
						ontoggle={animateFaqAnswer}
						class="group overflow-hidden border border-gray-200 bg-white transition-colors open:border-gray-300 open:bg-gray-50"
					>
						<summary
							class="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 text-left transition-colors outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-inset sm:min-h-18 sm:px-6 [&::-webkit-details-marker]:hidden"
						>
							<span class="text-base font-semibold text-gray-900 sm:text-lg">{faq.question}</span>
							<svg
								class="size-5 shrink-0 text-gray-600 transition-transform duration-200 group-open:rotate-180"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								aria-hidden="true"
							>
								<path d="m6 9 6 6 6-6"></path>
							</svg>
						</summary>
						<div class="faq-answer border-t border-gray-200 bg-white px-5 py-5 sm:px-6 sm:py-6">
							<p class="max-w-4xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
								{faq.answer}
							</p>
						</div>
					</details>
				{/each}
			</div>
		</div>
	</section>

	<section
		class="mx-auto w-full max-w-7xl bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28 2xl:max-w-[1600px] 2xl:px-10"
	>
		<div
			id="buat-undangan"
			class="w-full scroll-mt-22 rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm sm:px-10 sm:py-16 lg:px-16 lg:py-20"
		>
			<p data-reveal class="text-sm font-semibold text-gray-700">Waktunya memulai</p>
			<h2
				data-reveal
				class="mx-auto mt-3 max-w-3xl text-[40px] leading-[1.1] font-bold tracking-[-0.04em] text-gray-950 sm:text-[48px] lg:text-[56px]"
			>
				Undangan kalian bisa siap hari ini.
			</h2>
			<p data-reveal class="mx-auto mt-5 max-w-xl text-lg leading-8 text-gray-700">
				Mulai gratis, pilih tema favorit, dan lihat hasilnya secara langsung.
			</p>
			<a
				data-reveal
				class="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-linear-to-r from-[#9400ff] to-[#7200e8] px-7 text-sm font-semibold text-white"
				href="/login"
			>
				Buat undangan sekarang
				<svg class="ml-2 size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M5 12H19M13 6L19 12L13 18"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</a>
		</div>
	</section>
</main>

<footer class="border-t border-gray-200 bg-white py-10">
	<div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 2xl:max-w-[1600px] 2xl:px-10">
		<a
			href="/affiliate"
			class="mb-4 inline-block text-sm font-semibold text-violet-700 hover:text-violet-900"
			>Gabung Affiliate</a
		>
		<p class="text-sm text-gray-500">© 2026 Wedez</p>
	</div>
</footer>
