<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { clearLandingSectionHash, handleSectionClick } from '../model/section-navigation.js';
	let open = $state(false);
	let toggle = $state<HTMLButtonElement>();
	const links = [
		{ href: '#beranda', label: 'Beranda' },
		{ href: '#tema', label: 'Tema' },
		{ href: '#harga', label: 'Harga' }
	];
	function close() {
		open = false;
	}
	function navigateSection(event: MouseEvent) {
		if (handleSectionClick(event)) close();
	}
	function keydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			close();
			toggle?.focus();
		}
	}
	afterNavigate(() => {
		close();
		void clearLandingSectionHash();
	});
</script>

<svelte:window
	onkeydown={keydown}
	onhashchange={() => void clearLandingSectionHash()}
	onresize={() => {
		if (window.innerWidth >= 768) close();
	}}
/>

<header
	class="fixed inset-x-0 top-0 z-50 border-b-[3px] border-[#191919] bg-[#fffaf1] text-[#191919]"
>
	<div
		class="mx-auto flex h-19 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 md:grid md:grid-cols-[1fr_auto_1fr]"
	>
		<a
			href="#beranda"
			onclick={navigateSection}
			aria-label="Wedez, kembali ke beranda"
			class="flex w-fit items-center gap-2"
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
		<nav aria-label="Navigasi utama" class="hidden items-center gap-8 text-sm font-bold md:flex">
			{#each links as link (link.href)}<a
					class="underline-offset-4 hover:underline"
					href={link.href}
					onclick={navigateSection}>{link.label}</a
				>{/each}
		</nav>
		<a
			href="/login"
			class="hidden justify-self-end border-2 border-[#191919] bg-[#e5fa94] px-7 py-2.5 text-sm font-extrabold shadow-[3px_3px_0_#191919] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#191919] md:inline-flex"
			>Masuk</a
		>
		<button
			bind:this={toggle}
			type="button"
			aria-label={open ? 'Tutup navigasi' : 'Buka navigasi'}
			aria-controls="landing-navigation"
			aria-expanded={open}
			onclick={() => (open = !open)}
			class="grid size-11 place-items-center border-2 border-[#191919] bg-white shadow-[3px_3px_0_#191919] md:hidden"
		>
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				aria-hidden="true"
				><path d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 6h16M4 12h16M4 18h16'} /></svg
			>
		</button>
	</div>
	{#if open}
		<nav
			id="landing-navigation"
			aria-label="Navigasi mobile"
			class="absolute inset-x-0 top-full border-b-[3px] border-[#191919] bg-[#fffaf1] p-5 shadow-[0_6px_0_#191919] md:hidden"
		>
			<div class="flex flex-col gap-2">
				{#each links as link (link.href)}<a
						href={link.href}
						onclick={navigateSection}
						class="px-3 py-3 text-sm font-bold hover:bg-[#e2d2ff]">{link.label}</a
					>{/each}
				<a
					href="/login"
					onclick={close}
					class="mt-2 border-2 border-[#191919] bg-[#e5fa94] px-5 py-3 text-center font-extrabold shadow-[3px_3px_0_#191919]"
					>Masuk</a
				>
			</div>
		</nav>
	{/if}
</header>
<div class="h-[79px]" aria-hidden="true"></div>
