<script lang="ts">
    let { data } = $props();
    const { leaderboard, overall, categoriesStats } = data;
</script>

<div class="space-y-8 p-4">
	<h1 class="text-2xl font-bold">Statistics</h1>

	<!-- Overall Stats Cards -->
	<section class="grid gap-4 md:grid-cols-5">
		<div class="rounded border p-4 shadow-sm bg-white">
			<div class="text-sm text-gray-500">Total Reviews</div>
			<div class="text-2xl font-bold">{overall.total}</div>
		</div>
		<div class="rounded border p-4 shadow-sm bg-white">
			<div class="text-sm text-gray-500">Selected</div>
			<div class="text-2xl font-bold text-green-600">{overall.selected}</div>
		</div>
		<div class="rounded border p-4 shadow-sm bg-white">
			<div class="text-sm text-gray-500">Maybe</div>
			<div class="text-2xl font-bold text-yellow-600">{overall.maybe}</div>
		</div>
		<div class="rounded border p-4 shadow-sm bg-white">
			<div class="text-sm text-gray-500">Rejected</div>
			<div class="text-2xl font-bold text-red-600">{overall.rejected}</div>
		</div>
		<div class="rounded border p-4 shadow-sm bg-white">
			<div class="text-sm text-gray-500">Global Approval Rate</div>
			<div class="text-2xl font-bold">{overall.approvalRate.toFixed(1)}%</div>
		</div>
	</section>

	<div class="grid gap-8 md:grid-cols-2">
		<!-- Leaderboard -->
		<section class="space-y-4">
			<h2 class="text-xl font-semibold">Curator Leaderboard</h2>
			<div class="overflow-x-auto rounded border bg-white shadow-sm">
				<table class="w-full text-left text-sm">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-2 font-medium">Curator</th>
							<th class="px-4 py-2 font-medium text-right">Reviews</th>
							<th class="px-4 py-2 font-medium text-right">Selected</th>
							<th class="px-4 py-2 font-medium text-right">Appr. Rate</th>
						</tr>
					</thead>
					<tbody class="divide-y">
						{#each leaderboard as curator}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-2 font-medium">{curator.name}</td>
								<td class="px-4 py-2 text-right">{curator.total}</td>
								<td class="px-4 py-2 text-right text-green-700">{curator.selected}</td>
								<td class="px-4 py-2 text-right">{curator.approvalRate.toFixed(1)}%</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<!-- Category Stats -->
		<section class="space-y-4">
			<h2 class="text-xl font-semibold">Submissions per Category</h2>
			<div class="rounded border bg-white p-4 shadow-sm space-y-3">
				{#each categoriesStats as cat}
					<div class="flex items-center gap-2">
						<div class="w-32 text-sm font-medium truncate" title={cat.name}>{cat.name}</div>
						<div class="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
							<div
								class="h-full bg-blue-600"
								style:width="{(cat.count / Math.max(...categoriesStats.map((c) => c.count))) *
									100}%"
							></div>
						</div>
						<div class="text-sm text-gray-500 w-8 text-right">{cat.count}</div>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
