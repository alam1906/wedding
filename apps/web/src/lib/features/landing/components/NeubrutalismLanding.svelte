<script lang="ts">
	import { onMount } from 'svelte';
	import WhatsAppButton from '#lib/components/ui/WhatsAppButton.svelte';
	import { WEDDING_THEME_CATALOG } from '#lib/features/wedding-themes/model/theme-catalog.js';
	import { getWeddingThemePreviewUrl } from '#lib/features/wedding-themes/model/theme-preview-url.js';
	import type { WeddingThemeKey } from '#lib/features/wedding-themes/model/wedding-theme.js';
	import LandingNavbar from './LandingNavbar.svelte';
	import { handleSectionClick } from '../model/section-navigation.js';
	import {
		landingStats,
		landingReasons,
		landingDashboards,
		landingPlans,
		landingFaqs
	} from '../model/landing-content.js';

	const featuredKeys: WeddingThemeKey[] = ['neubrutalism-1', 'sakura', 'retro', 'kinetika'];
	const socialLinks = [
		{ label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61595590375457' },
		{ label: 'Instagram', href: 'https://www.instagram.com/wedez.id/' },
		{ label: 'Threads', href: 'https://www.threads.com/@wedez.id' },
		{ label: 'TikTok', href: 'https://www.tiktok.com/' }
	];
	const themes = featuredKeys.flatMap((key) =>
		WEDDING_THEME_CATALOG.filter((theme) => theme.key === key)
	);
	let root: HTMLElement;

	onMount(() => {
		let disposed = false;
		let cleanup: (() => void) | undefined;
		void (async () => {
			try {
				const [{ gsap }, { ScrollTrigger }] = await Promise.all([
					import('gsap'),
					import('gsap/ScrollTrigger')
				]);
				if (disposed) return;
				gsap.registerPlugin(ScrollTrigger);
				const media = gsap.matchMedia();
				media.add('(prefers-reduced-motion: no-preference)', () => {
					const context = gsap.context(() => {
						root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
							gsap.from(element, {
								y: 24,
								autoAlpha: 0,
								duration: 0.6,
								ease: 'power2.out',
								clearProps: 'opacity,visibility,transform',
								scrollTrigger: { trigger: element, start: 'top 92%', once: true }
							});
						});
					}, root);
					return () => context.revert();
				});
				cleanup = () => media.revert();
			} catch (error) {
				console.error('Animasi landing page gagal dimuat.', error);
			}
		})();
		return () => {
			disposed = true;
			cleanup?.();
		};
	});
</script>

<svelte:head>
	<title>Wedez — Undangan Pernikahan Digital</title>
	<meta
		name="description"
		content="Buat undangan pernikahan digital yang personal, mudah dibagikan, dan praktis dikelola bersama Wedez."
	/>
	<meta name="theme-color" content="#fffaf1" />
	<meta property="og:title" content="Wedez — Undangan Pernikahan Digital" />
	<meta
		property="og:description"
		content="Pilih tema, lengkapi cerita, dan bagikan undangan pernikahan digital kalian."
	/>
</svelte:head>

{#snippet arrow()}
	<svg
		class="size-5 shrink-0"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg
	>
{/snippet}
{#snippet check()}
	<svg
		class="size-4 shrink-0"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
		aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg
	>
{/snippet}

<div class="landing">
	<a class="skip-link" href="#main-content" onclick={handleSectionClick}>Lewati ke konten utama</a>
	<LandingNavbar />
	<main id="main-content" bind:this={root}>
		<section id="beranda" class="section-anchor bg-[#fffaf1]">
			<div
				class="hero-layout nb-container grid min-h-[calc(100dvh-79px)] items-center gap-14 py-12 sm:py-16 lg:grid-cols-2 lg:gap-14"
			>
				<div class="relative min-w-0">
					<h1 data-reveal class="hero-title">
						<span class="block">Wedding</span>
						<span class="mt-1 block">made <span class="hero-highlight">Ez</span></span>
						<span class="mt-3 block whitespace-nowrap"
							>for Gen <span class="hero-highlight">Z</span></span
						>
					</h1>
					<svg
						class="absolute top-2 right-0 size-7 sm:right-4 sm:size-10"
						viewBox="0 0 40 48"
						fill="none"
						aria-hidden="true"
						><path
							d="M20 4c0 12-4 17-15 20 11 3 15 8 15 20 0-12 4-17 15-20C24 21 20 16 20 4Z"
							fill="#fffaf1"
							stroke="#191919"
							stroke-width="3"
						/><path d="M35 0v10M30 5h10" stroke="#191919" stroke-width="2" /></svg
					>
					<p
						data-reveal
						class="mt-7 max-w-xl text-base leading-7 font-medium text-[#191919] sm:text-lg sm:leading-8"
					>
						Buat undangan digital yang estetik, personal, dan gampang dibagikan. Pilih tema,
						ceritakan momen kalian, lalu pantau RSVP semuanya dalam satu tempat.
					</p>
					<div
						data-reveal
						class="mt-7 grid grid-cols-[1.25fr_1fr] gap-3 sm:flex sm:flex-wrap sm:gap-4"
					>
						<a class="nb-button hero-button bg-[#ff96ca]" href="/login"
							><span>Buat undangan gratis</span><span class="hidden sm:inline-flex"
								>{@render arrow()}</span
							></a
						>
						<a class="nb-button hero-button bg-[#fffaf1]" href="#tema" onclick={handleSectionClick}
							>Lihat pilihan tema</a
						>
					</div>
				</div>
				<div data-reveal class="relative mx-auto w-full max-w-xl min-w-0">
					<img
						class="h-auto w-full object-contain drop-shadow-[0_16px_20px_rgba(25,25,25,0.12)]"
						src="/images/hero/digital-wedding-invitation.webp"
						alt="Pratinjau website undangan pernikahan digital pada laptop dan ponsel"
						width="1536"
						height="1024"
						fetchpriority="high"
					/>
				</div>
			</div>
		</section>

		<section class="border-y-[3px] border-[#191919] bg-[#e5fa94]" aria-label="Ringkasan Wedez">
			<div class="nb-container grid grid-cols-2 sm:grid-cols-4">
				{#each landingStats as stat (stat.label)}
					<div class="stat-cell px-2 py-7 text-center sm:py-9">
						<div data-reveal>
							<p class="text-3xl font-black tracking-[-0.05em] sm:text-4xl">{stat.value}</p>
							<p class="mt-1 text-xs font-semibold sm:text-sm">{stat.label}</p>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="section-space" aria-labelledby="why-wedez-title">
			<div class="nb-container">
				<div data-reveal class="max-w-3xl">
					<p class="eyebrow">Kenapa memilih Wedez</p>
					<h2 id="why-wedez-title" class="section-title mt-4">
						Lebih sederhana untuk kalian, lebih berkesan untuk tamu.
					</h2>
					<p class="section-description">
						Semua yang dibutuhkan untuk membuat dan mengelola undangan, dirancang dalam satu
						pengalaman yang mudah digunakan.
					</p>
				</div>
				<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
					{#each landingReasons as reason, index (reason.title)}
						<article data-reveal class="nb-panel flex min-w-0 flex-col bg-white">
							<div class="relative border-b-2 border-[#191919] bg-white">
								<img
									src={reason.image}
									alt={reason.alt}
									width="1200"
									height="1200"
									loading="lazy"
									class="aspect-4/3 w-full object-cover"
								/>
								<span
									class="absolute top-3 left-3 grid size-9 place-items-center border-2 border-[#191919] bg-[#fffaf1] text-xs font-extrabold"
									>0{index + 1}</span
								>
							</div>
							<div class="flex-1 bg-white p-5">
								<h3 class="text-xl leading-tight font-extrabold tracking-tight">{reason.title}</h3>
								<p class="mt-3 text-sm leading-6">{reason.description}</p>
							</div>
						</article>
					{/each}
				</div>
			</div>
		</section>

		<section
			class="section-space border-y-[3px] border-[#191919] bg-[#fffaf1]"
			aria-labelledby="themes-title"
		>
			<div class="nb-container">
				<div
					id="tema"
					class="section-anchor flex flex-col justify-between gap-6 md:flex-row md:items-end"
				>
					<div data-reveal class="max-w-2xl">
						<p class="eyebrow">Pilihan tema</p>
						<h2 id="themes-title" class="section-title mt-4">
							Temukan gaya yang terasa seperti kalian.
						</h2>
					</div>
					<a data-reveal class="nb-button w-fit shrink-0 bg-[#e5fa94]" href="/tema"
						>Lihat semua tema {@render arrow()}</a
					>
				</div>
				<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
					{#each themes as theme (theme.key)}
						<article data-reveal class="min-w-0">
							<a
								class="theme-link nb-panel block bg-white"
								href={getWeddingThemePreviewUrl(theme.key)}
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Lihat tema {theme.name} (tab baru)"
							>
								<img
									src={theme.thumbnail}
									alt="Halaman pembuka tema {theme.name}"
									width="1200"
									height="900"
									loading="lazy"
									decoding="async"
									class="aspect-4/3 w-full bg-white object-contain"
								/>
								<div
									class="flex min-h-20 items-center justify-between gap-2 border-t-2 border-[#191919] px-4 py-4"
								>
									<h3 class="text-base leading-snug font-extrabold tracking-tight">{theme.name}</h3>
									<span
										class="grid size-8 shrink-0 place-items-center border-2 border-[#191919] bg-[#e5fa94]"
										>{@render arrow()}</span
									>
								</div>
							</a>
						</article>
					{/each}
				</div>
			</div>
		</section>

		{#each landingDashboards as dashboard, index (dashboard.id)}
			<section class="section-space border-b-2 border-[#191919]" aria-labelledby={dashboard.id}>
				<div class="nb-container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
					<figure data-reveal class={['nb-panel min-w-0 bg-white', index === 0 && 'lg:order-2']}>
						<img
							src={dashboard.image}
							alt={dashboard.alt}
							width="1280"
							height="800"
							loading="lazy"
							decoding="async"
							class="block h-auto w-full"
						/>
					</figure>
					<div class="min-w-0">
						<div data-reveal>
							<h2 id={dashboard.id} class="section-title">
								{dashboard.title}<span class="text-[#8030e4]">.</span>
							</h2>
							<p class="section-description">{dashboard.description}</p>
						</div>
						<div class="mt-8 space-y-6">
							{#each dashboard.benefits as benefit (benefit.title)}
								<div data-reveal class="flex gap-4">
									<span
										class="mt-1 grid size-8 shrink-0 place-items-center border-2 border-[#191919] shadow-[2px_2px_0_#191919]"
										style:background={dashboard.color}>{@render check()}</span
									>
									<div>
										<h3 class="font-extrabold">{benefit.title}</h3>
										<p class="mt-1 text-sm leading-7 text-[#47433f] sm:text-base">
											{benefit.description}
										</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</section>
		{/each}

		<section
			class="section-space border-b-[3px] border-[#191919] bg-[#fffaf1]"
			aria-labelledby="pricing-title"
		>
			<div class="nb-container">
				<div id="harga" class="section-anchor mx-auto max-w-3xl text-center">
					<div data-reveal>
						<p class="eyebrow">Harga</p>
						<h2 id="pricing-title" class="section-title mt-4">Mulai gratis, bayar saat siap.</h2>
						<p class="section-description mx-auto">
							Coba seluruh alur pembuatan undangan terlebih dahulu. Tidak ada biaya berlangganan.
						</p>
					</div>
				</div>
				<div class="mx-auto mt-10 grid max-w-4xl gap-7 md:grid-cols-2 lg:mt-12">
					{#each landingPlans as plan (plan.name)}
						<article
							data-reveal
							class={[
								'nb-panel flex flex-col p-6 sm:p-9',
								plan.featured ? 'bg-[#e5fa94]' : 'bg-white'
							]}
						>
							<h3 class="text-2xl font-extrabold">{plan.name}</h3>
							<p class="mt-5 text-5xl font-black tracking-[-0.06em] sm:text-6xl">{plan.price}</p>
							<p class="mt-5 text-sm leading-7">{plan.description}</p>
							<ul class="my-7 space-y-4 border-t-2 border-[#191919] pt-7">
								{#each plan.features as feature (feature)}<li
										class="flex items-center gap-3 text-sm font-semibold"
									>
										{@render check()}{feature}
									</li>{/each}
							</ul>
							<a
								class={['nb-button mt-auto', plan.featured ? 'nb-purple' : 'bg-[#fffaf1]']}
								href="#buat-undangan"
								onclick={handleSectionClick}
								>{plan.featured ? 'Pilih Siap Tayang' : 'Mulai mencoba'}{@render arrow()}</a
							>
						</article>
					{/each}
				</div>
			</div>
		</section>

		<section id="faq" class="section-space section-anchor" aria-labelledby="faq-title">
			<div class="nb-container grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
				<div data-reveal>
					<p class="eyebrow">Pertanyaan umum</p>
					<h2 id="faq-title" class="section-title mt-4">FAQ - Pertanyaan yang sering diajukan</h2>
					<p class="section-description">
						Butuh bantuan? Pertanyaan berikut mungkin dapat membantu Anda.
					</p>
				</div>
				<div class="space-y-4">
					{#each landingFaqs as faq (faq.question)}
						<details
							data-reveal
							name="wedez-faq"
							class="group border-2 border-[#191919] bg-white shadow-[4px_4px_0_#191919] open:bg-[#e5fa94]"
						>
							<summary
								class="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-base font-extrabold [&::-webkit-details-marker]:hidden"
								><span>{faq.question}</span><span
									class="relative grid size-7 shrink-0 place-items-center border-2 border-[#191919] bg-[#fffaf1]"
									aria-hidden="true"
									><span class="h-0.5 w-3 bg-[#191919]"></span><span
										class="absolute h-3 w-0.5 bg-[#191919] group-open:hidden"
									></span></span
								></summary
							>
							<p
								class="border-t-2 border-[#191919] bg-white px-5 py-5 text-sm leading-7 text-[#47433f]"
							>
								{faq.answer}
							</p>
						</details>
					{/each}
				</div>
			</div>
		</section>

		<section class="nb-container pb-20 lg:pb-28">
			<div
				id="buat-undangan"
				class="section-anchor nb-panel bg-[#ffd1e6] px-6 py-14 text-center sm:px-10 sm:py-20"
			>
				<h2 data-reveal class="section-title mx-auto max-w-3xl">
					Buat undangan kurang dari 5 Menit
				</h2>
				<p data-reveal class="mx-auto mt-6 max-w-xl text-base leading-8 text-[#47433f] sm:text-lg">
					Mulai gratis, pilih tema favorit, dan lihat hasilnya secara langsung.
				</p>
				<div data-reveal class="mt-8">
					<a class="nb-button bg-[#e5fa94]" href="/login"
						>Buat undangan sekarang {@render arrow()}</a
					>
				</div>
			</div>
		</section>
	</main>
	<footer class="border-t-2 border-[#191919] bg-[#fffaf1] text-[#191919]">
		<div class="nb-container pt-12 sm:pt-14">
			<div class="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.6fr_0.8fr_0.8fr] md:gap-16">
				<div class="col-span-2 md:col-span-1">
					<a
						href="#beranda"
						onclick={handleSectionClick}
						aria-label="Wedez, kembali ke beranda"
						class="inline-flex items-center gap-2"
					>
						<img
							src="/images/hero/logo-wedez.webp"
							alt=""
							width="256"
							height="256"
							class="size-11 object-contain"
						/>
						<span class="text-[23px] font-black tracking-[-0.06em]"
							>wedez<span class="text-[#8030e4]">.id</span></span
						>
					</a>
					<p class="mt-4 max-w-sm text-sm leading-6 text-[#47433f]">
						Undangan pernikahan digital yang personal, mudah dibuat, dan praktis dibagikan.
					</p>
				</div>
				<nav aria-labelledby="footer-navigation-title">
					<h2
						id="footer-navigation-title"
						class="font-mono text-xs font-bold tracking-[0.16em] uppercase"
					>
						Navigasi
					</h2>
					<ul class="mt-5 space-y-3 text-sm font-medium">
						<li>
							<a
								class="underline-offset-4 hover:underline"
								href="#beranda"
								onclick={handleSectionClick}>Beranda</a
							>
						</li>
						<li>
							<a
								class="underline-offset-4 hover:underline"
								href="#tema"
								onclick={handleSectionClick}>Tema</a
							>
						</li>
						<li>
							<a
								class="underline-offset-4 hover:underline"
								href="#harga"
								onclick={handleSectionClick}>Harga</a
							>
						</li>
					</ul>
				</nav>
				<div>
					<h2 class="font-mono text-xs font-bold tracking-[0.16em] uppercase">Ikuti Kami</h2>
					<ul class="mt-5 space-y-3 text-sm font-medium">
						{#each socialLinks as platform (platform.href)}
							<li>
								<a
									class="underline-offset-4 hover:underline"
									href={platform.href}
									target="_blank"
									rel="noopener noreferrer">{platform.label}</a
								>
							</li>
						{/each}
					</ul>
				</div>
			</div>
			<div class="mt-10 flex h-14 items-center justify-center border-t border-[#191919] sm:mt-12">
				<p class="text-center font-mono text-xs leading-6 sm:text-sm">© 2026 Wedez</p>
			</div>
		</div>
	</footer>
	<WhatsAppButton phoneNumber="+6281292464061" />
</div>

<style>
	.landing {
		background: #fffaf1;
		color: #191919;
	}
	.nb-container {
		width: 100%;
		max-width: 1280px;
		margin-inline: auto;
		padding-inline: 24px;
	}
	.section-space {
		padding-block: 72px;
	}
	.section-anchor {
		scroll-margin-top: 20px;
	}
	.section-title {
		font-size: clamp(2rem, 3.8vw, 3.5rem);
		line-height: 1.12;
		font-weight: 900;
		letter-spacing: -0.04em;
		text-wrap: balance;
	}
	.section-description {
		margin-top: 20px;
		font-size: 16px;
		line-height: 1.85;
		color: #47433f;
		max-width: 680px;
	}
	.eyebrow {
		font-size: 11px;
		line-height: 1.5;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.nb-panel {
		border: 2px solid #191919;
		box-shadow: 6px 6px 0 #191919;
	}
	.nb-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		min-height: 52px;
		padding: 12px 22px;
		border: 2px solid #191919;
		box-shadow: 4px 4px 0 #191919;
		font-size: 14px;
		font-weight: 800;
		line-height: 1.5;
		transition:
			transform 150ms,
			box-shadow 150ms;
	}
	.nb-purple {
		background: #8b3fe8;
		color: white;
	}
	.hero-title {
		width: fit-content;
		font-size: clamp(2.9rem, 11.7vw, 4rem);
		line-height: 0.95;
		font-weight: 950;
		letter-spacing: -0.045em;
		text-transform: uppercase;
	}
	.hero-highlight {
		display: inline-block;
		vertical-align: 0.02em;
		background: #ff96ca;
		color: #ffb3d9;
		-webkit-text-stroke: 3px #191919;
		paint-order: stroke fill;
		padding: 0 0.12em 0.03em;
		border: 3px solid #191919;
		box-shadow: 4px 4px 0 #191919;
		transform: rotate(-5deg);
	}
	.hero-button {
		min-width: 0;
		padding: 12px 14px;
		font-size: 12px;
	}
	@media (min-width: 640px) {
		.hero-button {
			padding: 12px 22px;
			font-size: 14px;
		}
	}
	@media (min-width: 1024px) {
		.hero-layout {
			height: calc(100dvh - 79px);
			min-height: min-content;
			padding-block: clamp(24px, 5dvh, 64px);
		}
		.hero-title {
			font-size: min(6.2vw, 10dvh, 6rem);
		}
	}
	.stat-cell:nth-child(even) {
		border-left: 2px solid #191919;
	}
	.stat-cell:nth-child(-n + 2) {
		border-bottom: 2px solid #191919;
	}
	.theme-link:hover h3 {
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.skip-link {
		position: fixed;
		top: 12px;
		left: 12px;
		z-index: 100;
		padding: 12px;
		background: #e5fa94;
		border: 2px solid #191919;
		transform: translateY(-160%);
	}
	.skip-link:focus {
		transform: translateY(0);
	}
	.landing :global(:focus-visible) {
		outline: 3px solid #8030e4;
		outline-offset: 4px;
	}
	@media (hover: hover) {
		.nb-button:hover {
			transform: translate(3px, 3px);
			box-shadow: 1px 1px 0 #191919;
		}
	}
	.nb-button:active {
		transform: translate(4px, 4px);
		box-shadow: none;
	}
	@media (min-width: 640px) {
		.nb-container {
			padding-inline: 32px;
		}
		.section-description {
			font-size: 18px;
		}
		.eyebrow {
			font-size: 12px;
		}
		.stat-cell + .stat-cell {
			border-left: 2px solid #191919;
		}
		.stat-cell:nth-child(-n + 2) {
			border-bottom: none;
		}
	}
	@media (min-width: 1024px) {
		.section-space {
			padding-block: 104px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.nb-button {
			transition: none;
		}
	}
</style>
