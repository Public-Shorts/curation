<script lang="ts">
	let { reviews, compact = false } = $props<{ reviews: any[]; compact?: boolean }>();

	let stats = $derived.by(() => {
		const total = reviews.length;
		if (total === 0)
			return {
				selected: 0,
				maybe: 0,
				rejected: 0,
				total: 0,
				counts: { selected: 0, maybe: 0, rejected: 0, total: 0 }
			};

		const selected = reviews.filter((r: any) => r.selection === 'selected').length;
		const maybe = reviews.filter((r: any) => r.selection === 'maybe').length;
		// Count rejected (explicit 'rejected' or 'notSelected' for backward compatibility if any)
		const rejected = total - selected - maybe;

		return {
			selected: (selected / total) * 100,
			maybe: (maybe / total) * 100,
			rejected: (rejected / total) * 100,
			total,
			counts: { selected, maybe, rejected, total }
		};
	});
</script>

{#if stats.total > 0}
	<div class="flex flex-col gap-1" class:w-24={!compact} class:w-16={compact}>
		<!-- Stacked Bar -->
		<div
			class="flex w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-inset ring-black/5"
			class:h-2={!compact}
			class:h-1={compact}
		>
			{#if stats.selected > 0}
				<div class="h-full bg-green-500" style="width: {stats.selected}%"></div>
			{/if}
			{#if stats.maybe > 0}
				<div class="h-full bg-amber-400" style="width: {stats.maybe}%"></div>
			{/if}
			{#if stats.rejected > 0}
				<div class="h-full bg-red-400" style="width: {stats.rejected}%"></div>
			{/if}
		</div>

		<!-- Legend/Counts (Tiny) - Hidden in compact mode -->
		{#if !compact}
			<div class="flex justify-between text-[10px] text-gray-400 font-mono leading-none px-0.5">
				<span
					class:text-green-600={stats.counts.selected > 0}
					class:font-bold={stats.counts.selected > 0}>{stats.counts.selected}</span
				>
				<span class:text-amber-600={stats.counts.maybe > 0} class:font-bold={stats.counts.maybe > 0}
					>{stats.counts.maybe}</span
				>
				<span
					class:text-red-500={stats.counts.rejected > 0}
					class:font-bold={stats.counts.rejected > 0}>{stats.counts.rejected}</span
				>
			</div>
		{/if}
	</div>
{:else}
	<span class="text-xs text-gallery-300">-</span>
{/if}
