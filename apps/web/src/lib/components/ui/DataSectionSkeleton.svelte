<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	let { section, footer = true }: { section: string; footer?: boolean } = $props();
</script>

{#snippet field(multiline = false)}
	<div>
		<Skeleton class="mb-2 h-4 w-36" /><Skeleton class={multiline ? 'h-28 w-full' : 'h-12 w-full'} />
	</div>
{/snippet}

<div
	role="status"
	aria-label={`Memuat ${section}`}
	aria-busy="true"
	data-skeleton={`section-${section}`}
>
	<span class="sr-only">Memuat {section}…</span>
	<div aria-hidden="true">
		{#if section === 'Tema'}
			<div class="mb-6 flex flex-wrap gap-2">
				{#each Array(7).keys() as index (index)}<Skeleton class="h-11 w-20" />{/each}
			</div>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each Array(8).keys() as index (index)}
					<div class="overflow-hidden border-2 border-[#191919]">
						<Skeleton class="aspect-16/7 w-full" />
						<div class="p-3.5">
							<Skeleton class="h-4 w-2/3" /><Skeleton class="mt-3 h-3 w-full" /><Skeleton
								class="mt-2 h-3 w-4/5"
							/>
						</div>
					</div>
				{/each}
			</div>
		{:else if section === 'Mempelai' || section === 'Kado'}
			<div class="grid gap-6 lg:grid-cols-2">
				{#each Array(2).keys() as index (index)}
					<div class="ws-inset p-4 sm:p-5">
						<Skeleton class="h-6 w-40" />
						{#if section === 'Mempelai'}<div class="mt-4 min-h-44 bg-[#fffaf1] p-6">
								<Skeleton class="h-4 w-28" /><Skeleton class="mt-4 size-20 rounded-full" />
							</div>{:else}<Skeleton class="mt-5 h-6 w-11" />{/if}
						<div class="mt-5 space-y-5">
							{#each Array(3).keys() as fieldIndex (fieldIndex)}{@render field()}{/each}
						</div>
					</div>
				{/each}
			</div>
		{:else if section === 'Acara'}
			<div class="space-y-5">
				<div class="grid gap-5 sm:grid-cols-2">{@render field()}{@render field()}</div>
				{@render field(true)}{@render field()}
				<div class="flex items-center justify-between gap-4 border-t border-[#191919]/15 pt-5">
					<Skeleton class="h-4 w-2/3" /><Skeleton class="h-6 w-11" />
				</div>
			</div>
		{:else if section === 'Media'}
			<Skeleton class="h-4 w-28" /><Skeleton class="mt-4 h-64 w-full" />
			<div class="mt-8 border-t border-[#191919] pt-6">
				<Skeleton class="h-4 w-24" />
				<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
					{#each Array(5).keys() as index (index)}<Skeleton class="aspect-square w-full" />{/each}
				</div>
				<Skeleton class="mt-4 h-32 w-full" />
			</div>
		{:else if section === 'Story'}
			<div class="grid gap-5 lg:grid-cols-2">
				{#each Array(2).keys() as index (index)}<div class="space-y-5 py-5 sm:p-5">
						<Skeleton class="h-5 w-32" /><Skeleton class="h-52 w-full" />
						<div class="grid gap-5 sm:grid-cols-2">{@render field()}{@render field()}</div>
						{@render field(true)}
					</div>{/each}<Skeleton class="h-14 w-full lg:col-span-2" />
			</div>
		{:else if section === 'Quote'}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each Array(4).keys() as index (index)}<Skeleton class="h-20 w-full" />{/each}
			</div>
			<div class="mt-5">{@render field(true)}</div>
		{:else if section === 'Musik'}
			<div class="ws-inset divide-y divide-[#191919]/15">
				{#each Array(5).keys() as index (index)}<div class="flex flex-wrap items-center gap-4 p-4">
						<Skeleton class="size-5" /><Skeleton class="h-4 w-1/3" /><Skeleton
							class="h-12 w-full sm:ml-auto sm:w-64"
						/>
					</div>{/each}
			</div>
		{:else}
			{@render field()}<Skeleton class="mt-3 h-3 w-2/3" />
		{/if}
		{#if footer}
			<div
				class={section === 'Tema'
					? 'ws-panel fixed inset-x-4 bottom-0 z-20 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-6 sm:px-7 md:left-[calc(16rem+1.5rem)] lg:right-10 lg:left-[calc(16rem+2.5rem)]'
					: 'mt-7 border-t border-[#191919] pt-5'}
			>
				<div
					class={section === 'Tema'
						? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
						: 'flex justify-end'}
				>
					{#if section === 'Tema'}<Skeleton class="h-4 w-48" />{/if}
					<Skeleton class="h-11 w-44" />
				</div>
			</div>
		{/if}
	</div>
</div>
