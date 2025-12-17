<!-- src/routes/stats/+page.svelte -->
<script lang="ts">
	let { data } = $props();
	const { leaderboard, overall, categoriesStats, flaggedStats } = data;
	const maxCount = Math.max(1, ...categoriesStats.map((c: any) => c.count));
</script>

<div class="p-6 max-w-7xl mx-auto space-y-12">
	<!-- Overall Stats Cards -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Overview</h2>
		<div class="grid gap-4 md:grid-cols-5">
			<!-- Total Reviews -->
			<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
				<p class="text-xs uppercase text-gray-500">Total Reviews</p>
				<p class="mt-1 text-lg font-semibold">{overall.total}</p>
			</div>

			<!-- Selected -->
			<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
				<p class="text-xs uppercase text-gray-500">Selected</p>
				<p class="mt-1 text-lg font-semibold text-green-700">{overall.selected}</p>
			</div>

			<!-- Maybe -->
			<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
				<p class="text-xs uppercase text-gray-500">Maybe</p>
				<p class="mt-1 text-lg font-semibold text-yellow-700">{overall.maybe}</p>
			</div>

			<!-- notSelected -->
			<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
				<p class="text-xs uppercase text-gray-500">Not Selected</p>
				<p class="mt-1 text-lg font-semibold text-red-700">{overall.notSelected}</p>
			</div>

			<!-- Approval Rate -->
			<div class="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
				<p class="text-xs uppercase text-gray-500">Global Approval Rate</p>
				<p class="mt-1 text-lg font-semibold">
					{overall.approvalRate.toFixed(1)}<span class="text-sm text-gray-500">%</span>
				</p>
			</div>
		</div>
	</section>

	<div class="grid gap-12 lg:grid-cols-2">
		<!-- Leaderboard Table -->
		<section class="space-y-6">
			<header class="flex items-center justify-between">
				<h2 class="text-2xl font-semibold">Curator Leaderboard</h2>
				<p class="text-sm text-gray-500">Total: {leaderboard.length}</p>
			</header>

			{#if leaderboard.length === 0}
				<div class="rounded-lg bg-gray-50 p-8 text-center">
					<p class="text-gray-500">No data available.</p>
				</div>
			{:else}
				<div class="overflow-x-auto rounded-lg border bg-white shadow-sm">
					<table class="w-full text-left text-sm">
						<thead class="border-b bg-gray-50/50 text-[10px] uppercase text-gray-500">
							<tr>
								<th class="py-3 pl-4 pr-3 font-medium">Curator</th>
								<th class="py-3 px-3 font-medium text-right">Reviews</th>
								<th class="py-3 px-3 font-medium text-right">Selected</th>
								<th class="py-3 pl-3 pr-4 font-medium text-right">Appr. Rate</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100 bg-white">
							{#each leaderboard as curator}
								<tr class="hover:bg-gray-50/50">
									<td class="py-3 pl-4 pr-3 font-medium text-gray-900">{curator.name}</td>
									<td class="py-3 px-3 text-right text-gray-500">{curator.total}</td>
									<td class="py-3 px-3 text-right">
										<span
											class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
										>
											{curator.selected}
										</span>
									</td>
									<td class="py-3 pl-3 pr-4 text-right text-gray-500">
										{curator.approvalRate.toFixed(1)}%
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		<!-- Category Stats -->
		<section class="space-y-6">
			<header class="flex items-center justify-between">
				<h2 class="text-2xl font-semibold">Submissions per Category</h2>
				<p class="text-sm text-gray-500">Categories: {categoriesStats.length}</p>
			</header>

			<div class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 space-y-4">
				{#each categoriesStats as cat}
					<div class="group">
						<div class="flex items-center justify-between mb-1 text-sm">
							<span class="font-medium text-gray-700 truncate max-w-[200px]" title={cat.name}>
								{cat.name}
							</span>
							<span class="text-gray-500 text-xs">{cat.count}</span>
						</div>
						<div class="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
							<div
								class="h-full rounded-full bg-black/80 group-hover:bg-black transition-all duration-500"
								style:width="{(cat.count / maxCount) * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</section>
		<!-- NEW: Index of Flagged Content -->
		<section class="space-y-6">
			<header class="flex items-center justify-between">
				<h2 class="text-2xl font-semibold">Flagged Content Index</h2>
				<p class="text-sm text-gray-500">
					{flaggedStats.reduce((acc: any, curr: any) => acc + curr.items.length, 0)} flags across {flaggedStats.length}
					categories
				</p>
			</header>

			{#if flaggedStats.length === 0}
				<div class="rounded-lg bg-gray-50 p-8 text-center">
					<p class="text-gray-500">No content has been flagged yet.</p>
				</div>
			{:else}
				<div class="">
					{#each flaggedStats as { reason, items }}
						<div class="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
							<!-- Header -->
							<div
								class="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex justify-between items-center"
							>
								<h3 class="text-sm font-semibold text-gray-900">{reason}</h3>
								<span
									class="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
								>
									{items.length}
								</span>
							</div>

							<!-- Table -->
							<table class="min-w-full table-fixed divide-y divide-gray-100">
								<tbody class="divide-y divide-gray-100 bg-white">
									{#each items as item}
										<tr class="hover:bg-gray-50 transition-colors group">
											<!-- Title Column (Truncated) -->
											<td class="w-full max-w-0 py-3 pl-4 pr-2 align-middle">
												<a
													href={`/review/${item.id}`}
													class="block text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors"
													title={item.title}
												>
													{item.title}
												</a>
											</td>

											<!-- Curator Column (Fixed width, right aligned) -->
											<td class="whitespace-nowrap py-3 pr-4 pl-2 text-right align-middle">
												<span class="text-[10px] text-gray-400">
													by {item.curator}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>

<style>
	.truncate-cell {
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
