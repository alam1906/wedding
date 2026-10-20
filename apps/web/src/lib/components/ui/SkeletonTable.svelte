<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	let { columns = 4, guests = false }: { columns?: number; guests?: boolean } = $props();
</script>

<div role="status" aria-label="Memuat riwayat" aria-busy="true" data-skeleton="table">
	<span class="sr-only">Memuat riwayat…</span>
	<div aria-hidden="true" class={guests ? 'hidden sm:block' : 'overflow-x-auto'}>
		<div class="min-w-144">
			<div
				class="grid border-b border-[#191919] bg-[#e2d2ff]"
				style:grid-template-columns={`repeat(${columns}, minmax(0, 1fr))`}
			>
				{#each Array(columns).keys() as index (index)}
					<div class="border-r border-[#191919] px-5 py-4 last:border-r-0">
						<Skeleton class="h-3 w-16" />
					</div>
				{/each}
			</div>
			{#each Array(4).keys() as row (row)}
				<div
					class="grid border-b border-[#191919]/15 last:border-b-0"
					style:grid-template-columns={`repeat(${columns}, minmax(0, 1fr))`}
				>
					{#each Array(columns).keys() as column (column)}
						<div class="min-w-0 border-r border-[#191919]/15 px-5 py-6 last:border-r-0">
							<Skeleton class={column === columns - 1 ? 'ml-auto h-6 w-12' : 'h-4 w-3/4'} />
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
	{#if guests}
		<div aria-hidden="true" class="divide-y divide-[#191919]/15 sm:hidden">
			{#each Array(4).keys() as index (index)}
				<div class="p-5">
					<div class="flex justify-between gap-3">
						<Skeleton class="h-5 w-32" /><Skeleton class="h-6 w-16" />
					</div>
					<Skeleton class="mt-2 h-4 w-36" /><Skeleton class="mt-2 h-3 w-28" /><Skeleton
						class="mt-4 ml-auto size-10"
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>
