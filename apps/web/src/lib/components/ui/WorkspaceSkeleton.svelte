<script lang="ts">
	import Skeleton from './Skeleton.svelte';
	import SkeletonTable from './SkeletonTable.svelte';
	let { pathname }: { pathname: string } = $props();
	const affiliate = $derived(pathname.startsWith('/affiliate'));
	const menu = $derived(pathname.split('/')[2] || 'dashboard');
</script>

{#snippet field()}
	<div><Skeleton class="mb-2 h-4 w-32" /><Skeleton class="h-12 w-full" /></div>
{/snippet}

<div
	class={affiliate ? '' : 'px-4 py-8 sm:px-6 lg:px-10 lg:py-10'}
	role="status"
	aria-label="Memuat halaman"
	aria-busy="true"
	data-skeleton={pathname}
>
	<span class="sr-only">Memuat halaman…</span>
	<div aria-hidden="true" class="w-full min-w-0">
		{#if menu === 'dashboard'}
			<div class="grid gap-5 lg:grid-cols-2">
				{#each Array(2).keys() as index (index)}
					<div class="ws-panel flex min-h-25 items-center gap-3 p-5">
						{#if index === 0}<Skeleton class="size-10 shrink-0" />{/if}
						<div class="min-w-0 flex-1">
							<Skeleton class="h-4 w-28" /><Skeleton class="mt-2 h-6 w-3/4" />
						</div>
						{#if index === 0}<Skeleton class="size-10 shrink-0" />{/if}
					</div>
				{/each}
			</div>
			<div class="ws-panel mt-5 p-6">
				<div class="flex flex-col justify-between gap-5 sm:flex-row">
					<div class="min-w-0 flex-1">
						<Skeleton class="h-4 w-40" /><Skeleton class="mt-2 h-8 w-44" /><Skeleton
							class="mt-2 h-4 w-3/4"
						/>
					</div>
					<Skeleton class="h-11 w-full sm:w-36" />
				</div>
				<Skeleton class="mt-5 h-3 w-full" />
			</div>
			<div class="ws-panel mt-5 p-5">
				<Skeleton class="h-6 w-36" />
				<div
					class={affiliate
						? 'mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
						: 'mt-4 grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4'}
				>
					{#each Array(4).keys() as index (index)}<div class="ws-inset min-w-0 p-3.5">
							<Skeleton class="h-4 w-28" />
							<div class="mt-4 flex items-end justify-between gap-3">
								<Skeleton class="h-10 w-16" /><Skeleton class="h-6 w-16" />
							</div>
						</div>{/each}
				</div>
			</div>
		{:else if menu === 'data'}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each Array(9).keys() as index (index)}<div class="ws-panel p-5">
						<div class="flex items-center justify-between">
							<Skeleton class="size-10" /><Skeleton class="h-5 w-24" />
						</div>
						<Skeleton class="mt-5 h-6 w-36" /><Skeleton class="mt-2 h-4 w-4/5" />
					</div>{/each}
			</div>
		{:else if menu === 'invitation'}
			<div class="ws-panel overflow-hidden">
				<div class="border-b border-[#191919] p-5 sm:p-6">
					<div class="flex flex-col justify-between gap-3 sm:flex-row">
						<div class="flex min-w-0 flex-1 gap-3">
							<Skeleton class="h-11 w-1/2 sm:max-w-56" /><Skeleton class="h-11 w-1/2 sm:max-w-56" />
						</div>
						<div class="flex shrink-0 gap-2">
							<Skeleton class="h-11 w-11 lg:w-28" /><Skeleton class="h-11 w-11 lg:w-28" /><Skeleton
								class="h-11 w-11 lg:w-32"
							/>
						</div>
					</div>
				</div>
				<SkeletonTable columns={5} guests />
			</div>
		{:else if menu === 'upgrade'}
			<div class="mb-8">
				<Skeleton class="mb-3 h-3 w-32" /><Skeleton class="h-10 w-60" /><Skeleton
					class="mt-3 h-5 w-3/4"
				/>
			</div>
			<div class="grid gap-6 md:grid-cols-2">
				{#each Array(2).keys() as index (index)}<div class="ws-panel">
						<div class="border-b-2 border-[#191919] p-6 sm:p-8">
							<Skeleton class="h-8 w-20" /><Skeleton class="mt-6 h-10 w-44" /><Skeleton
								class="mt-2 h-4 w-3/4"
							/>
						</div>
						<div class="divide-y divide-[#191919]/15 px-6 sm:px-8">
							{#each Array(3).keys() as feature (feature)}<div class="py-5">
									<Skeleton class="h-3 w-28" /><Skeleton class="mt-2 h-5 w-3/4" />
								</div>{/each}
						</div>
						<div class="px-6 pt-3 pb-6 sm:px-8 sm:pb-8"><Skeleton class="h-12 w-full" /></div>
					</div>{/each}
			</div>
		{:else if menu === 'setting'}
			<div class="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start">
				<div class="contents lg:block lg:space-y-5">
					<div class="ws-panel order-1 p-5 sm:p-6">
						<div
							class="flex flex-col gap-5 border-b border-[#191919] pb-6 min-[420px]:flex-row min-[420px]:items-center"
						>
							<Skeleton class="size-20 rounded-full" />
							<div><Skeleton class="h-6 w-32" /><Skeleton class="mt-3 h-4 w-24" /></div>
						</div>
						<div class="mt-6 space-y-5">{@render field()}{@render field()}</div>
						<Skeleton class="mt-6 ml-auto h-11 w-36" />
					</div>
					<div class="ws-panel order-3 p-5 sm:p-6">
						<Skeleton class="h-6 w-32" /><Skeleton class="mt-2 h-4 w-4/5" /><Skeleton
							class="mt-5 h-11 w-full"
						/>
					</div>
				</div>
				<div class="ws-panel order-2 p-5 sm:p-6">
					<Skeleton class="h-6 w-28" /><Skeleton class="mt-2 h-4 w-4/5" />
					<div class="mt-5 space-y-5">
						{#each Array(3).keys() as index (index)}{@render field()}{/each}
					</div>
					<Skeleton class="mt-5 h-11 w-full" />
				</div>
			</div>
		{:else if menu === 'commissions' || menu === 'payouts'}
			<Skeleton class="h-8 w-52" /><Skeleton class="mt-2 h-4 w-3/4" />
			{#if menu === 'payouts'}<div class="ws-panel mt-6 p-6">
					<Skeleton class="h-4 w-28" /><Skeleton class="mt-2 h-9 w-44" /><Skeleton
						class="mt-3 h-4 w-4/5"
					/><Skeleton class="mt-5 h-11 w-40" />
				</div>{/if}
			<div class="ws-panel mt-6 overflow-hidden">
				<div class="flex items-center justify-between border-b border-[#191919] px-5 py-4">
					<Skeleton class="h-5 w-40" /><Skeleton class="size-10" />
				</div>
				<SkeletonTable />
			</div>
		{:else if menu === 'settings'}
			<Skeleton class="h-8 w-60" /><Skeleton class="mt-2 h-4 w-4/5" />
			<div class="ws-panel mt-8 space-y-5 p-6 sm:p-8">
				{#each Array(3).keys() as index (index)}{@render field()}{/each}<Skeleton
					class="h-3 w-4/5"
				/><Skeleton class="h-12 w-full" />
			</div>
		{/if}
	</div>
</div>
