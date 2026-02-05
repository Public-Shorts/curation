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
				counts: { selected: 0, maybe: 0, rejected: 0, total: 0 },
				curators: { selected: [] as string[], maybe: [] as string[], rejected: [] as string[] }
			};

		const selectedReviews = reviews.filter((r: any) => r.selection === 'selected');
		const maybeReviews = reviews.filter((r: any) => r.selection === 'maybe');
		const rejectedReviews = reviews.filter(
			(r: any) => r.selection !== 'selected' && r.selection !== 'maybe'
		);

		return {
			selected: (selectedReviews.length / total) * 100,
			maybe: (maybeReviews.length / total) * 100,
			rejected: (rejectedReviews.length / total) * 100,
			total,
			counts: {
				selected: selectedReviews.length,
				maybe: maybeReviews.length,
				rejected: rejectedReviews.length,
				total
			},
			curators: {
				selected: selectedReviews.map((r: any) => r.curatorName).filter(Boolean),
				maybe: maybeReviews.map((r: any) => r.curatorName).filter(Boolean),
				rejected: rejectedReviews.map((r: any) => r.curatorName).filter(Boolean)
			}
		};
	});
</script>

{#if stats.total > 0}
	<div class="group/votes relative flex flex-col gap-1" class:w-24={!compact} class:w-16={compact}>
		<!-- Stacked Bar -->
		<div
			class="flex w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-inset ring-black/5 cursor-help"
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

		<!-- Tooltip -->
		<div
			class="absolute bottom-full left-0 mb-2 w-48 p-3 bg-gray-900 text-white text-xs rounded shadow-xl opacity-0 group-hover/votes:opacity-100 transition-opacity pointer-events-none z-50"
		>
			<p class="font-bold mb-2">Vote Breakdown ({stats.total} votes)</p>
			<div class="space-y-2">
				{#if stats.counts.selected > 0}
					<div>
						<div class="flex items-center gap-1.5 mb-0.5">
							<span class="w-2 h-2 rounded-full bg-green-500"></span>
							<span class="font-medium text-green-400"
								>Selected: {stats.counts.selected} ({stats.selected.toFixed(0)}%)</span
							>
						</div>
						<p class="text-gray-400 pl-3.5">{stats.curators.selected.join(', ')}</p>
					</div>
				{/if}
				{#if stats.counts.maybe > 0}
					<div>
						<div class="flex items-center gap-1.5 mb-0.5">
							<span class="w-2 h-2 rounded-full bg-amber-400"></span>
							<span class="font-medium text-amber-400"
								>Maybe: {stats.counts.maybe} ({stats.maybe.toFixed(0)}%)</span
							>
						</div>
						<p class="text-gray-400 pl-3.5">{stats.curators.maybe.join(', ')}</p>
					</div>
				{/if}
				{#if stats.counts.rejected > 0}
					<div>
						<div class="flex items-center gap-1.5 mb-0.5">
							<span class="w-2 h-2 rounded-full bg-red-400"></span>
							<span class="font-medium text-red-400"
								>Rejected: {stats.counts.rejected} ({stats.rejected.toFixed(0)}%)</span
							>
						</div>
						<p class="text-gray-400 pl-3.5">{stats.curators.rejected.join(', ')}</p>
					</div>
				{/if}
			</div>
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
