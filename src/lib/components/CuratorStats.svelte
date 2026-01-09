<!-- src/lib/components/curator/CuratorStats.svelte -->
<script lang="ts">
    interface Stats {
        total: number;
        approved: number;
        approvalRate: number;
        totalMinutes: number;
        timeDisplay: string;
    }

    let { curatorName, stats } = $props<{ curatorName: string, stats: Stats }>();
</script>

<section class="grid gap-4 pb-12 md:grid-cols-4">
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<p class="text-xs uppercase text-gray-500">Curator</p>
		<p class="mt-1 text-lg font-semibold">{curatorName}</p>
	</div>
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<p class="text-xs uppercase text-gray-500">Reviews</p>
		<p class="mt-1 text-lg font-semibold">{stats.total}</p>
	</div>
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<p class="text-xs uppercase text-gray-500">Approved · Rate</p>
		<p class="mt-1 text-lg font-semibold">
			{stats.approved} <span class="text-sm text-gray-500">({stats.approvalRate}%)</span>
		</p>
	</div>
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<p class="text-xs uppercase text-gray-500">Total Watched</p>
		<p class="mt-1 text-lg font-semibold" title="{stats.totalMinutes} total minutes">
			{stats.timeDisplay}
		</p>
	</div>
</section>
