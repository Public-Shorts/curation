<script lang="ts">
	import SubmissionChart from '$lib/components/SubmissionChart.svelte';

	let { data } = $props();

	// Reactive derived values
	let leaderboard = $derived(data.leaderboard ?? []);
	let overall = $derived(data.overall);
	let flaggedStats = $derived(data.flaggedStats);
	let timelineStats = $derived(data.timelineStats);

	// Calculate Active vs Inactive Curators
	let activeCurators = $derived(leaderboard.filter((c: any) => c.total > 0));
	let inactiveCurators = $derived(leaderboard.filter((c: any) => c.total === 0));

	// Calculate "Reviewed at least 2 times" metric
	// NOTE: This assumes `overall.reviewedAtLeastTwice` is passed from server.
	// If not, you might need to calculate it from a raw submissions list if available,
	// otherwise, update your server-side load function to return this number.
	let reviewedAtLeastTwiceCount = $derived(overall.reviewedAtLeastTwice ?? 0);

	// Formatting helper
	const formatPercent = (num: number, total: number) => {
		if (total === 0) return '0%';
		return ((num / total) * 100).toFixed(0) + '%';
	};
</script>

<div class="p-6 max-w-7xl mx-auto space-y-12 pb-20">
	<!-- Overall Stats Cards -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Overview</h2>

		<div class="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
			<!-- Total Submissions -->
			<div class="col-span-2 md:col-span-2 rounded-lg bg-gray-900 p-4 shadow-sm text-white">
				<p class="text-xs uppercase text-gallery-400">Total Submissions</p>
				<p class="mt-1 text-3xl font-bold">{overall.totalSubmissions}</p>
			</div>

			<!-- Total Duration -->
			<div
				class="col-span-2 md:col-span-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5"
			>
				<p class="text-xs uppercase text-gallery-500">Total Footage Duration</p>
				<div class="mt-1 flex items-baseline gap-1">
					<p class="text-2xl font-semibold text-gallery-900">
						{Math.floor(overall.totalMinutes / 60)}
					</p>
					<span class="text-sm text-gallery-500">h</span>
					<p class="text-2xl font-semibold text-gallery-900 ml-1">
						{overall.totalMinutes % 60}
					</p>
					<span class="text-sm text-gallery-500">m</span>
				</div>
			</div>

			<!-- Average Length -->
			<div
				class="col-span-2 md:col-span-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5"
			>
				<p class="text-xs uppercase text-gallery-500">Average Length</p>
				<div class="mt-1 flex items-baseline gap-1">
					<p class="text-2xl font-semibold text-gallery-900">
						{Math.floor(overall.avgLength)}
					</p>
					<span class="text-sm text-gallery-500">m</span>
					<p class="text-xl font-semibold text-gallery-500 ml-1">
						{Math.round((overall.avgLength - Math.floor(overall.avgLength)) * 60)}
					</p>
					<span class="text-xs text-gallery-400">s</span>
				</div>
			</div>

			<!-- Median Length -->
			<div
				class="col-span-2 md:col-span-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5"
			>
				<p class="text-xs uppercase text-gallery-500">Median Length</p>
				<div class="mt-1 flex items-baseline gap-1">
					<p class="text-2xl font-semibold text-gallery-900">
						{Math.floor(overall.medianLength)}
					</p>
					<span class="text-sm text-gallery-500">m</span>
					<p class="text-xl font-semibold text-gallery-500 ml-1">
						{Math.round((overall.medianLength - Math.floor(overall.medianLength)) * 60)}
					</p>
					<span class="text-xs text-gallery-400">s</span>
				</div>
			</div>

			<!-- Review Progress Funnel -->
			<div class="col-span-2 md:col-span-4 lg:col-span-8">
				<h3 class="text-sm font-medium text-gallery-500 mb-3 uppercase tracking-wider">
					Review Progress
				</h3>
				<div class="grid gap-4 md:grid-cols-3">
					<!-- 1. Needs to be seen twice (0 reviews) -->
					<div class="rounded-lg bg-orange-50 p-4 shadow-sm ring-1 ring-orange-900/5">
						<div class="flex items-center justify-between mb-2">
							<p class="text-xs uppercase text-orange-600 font-bold">Unseen</p>
							<span class="text-[10px] text-orange-400 font-medium">Needs 2 reviews</span>
						</div>
						<p class="text-3xl font-bold text-orange-900">
							{overall.totalSubmissions - overall.reviewedSubmissions}
						</p>
						<p class="text-[10px] text-orange-500 mt-1">
							{formatPercent(
								overall.totalSubmissions - overall.reviewedSubmissions,
								overall.totalSubmissions
							)} of total
						</p>
					</div>

					<!-- 2. Needs one more review (1 review) -->
					<div class="rounded-lg bg-blue-50 p-4 shadow-sm ring-1 ring-blue-900/5">
						<div class="flex items-center justify-between mb-2">
							<p class="text-xs uppercase text-blue-600 font-bold">In Progress</p>
							<span class="text-[10px] text-blue-400 font-medium">Needs 1 review</span>
						</div>
						<p class="text-3xl font-bold text-blue-900">
							{overall.reviewedSubmissions - reviewedAtLeastTwiceCount}
						</p>
						<div class="w-full bg-blue-200 rounded-full h-1.5 mt-3 overflow-hidden">
							<div
								class="bg-blue-600 h-1.5 rounded-full"
								style="width: {((overall.reviewedSubmissions - reviewedAtLeastTwiceCount) /
									overall.totalSubmissions) *
									100}%"
							></div>
						</div>
					</div>

					<!-- 3. Completed (2+ reviews) -->
					<div class="rounded-lg bg-purple-50 p-4 shadow-sm ring-1 ring-purple-900/5">
						<div class="flex items-center justify-between mb-2">
							<p class="text-xs uppercase text-purple-600 font-bold">Completed</p>
							<span class="text-[10px] text-purple-400 font-medium">Fully Reviewed</span>
						</div>
						<p class="text-3xl font-bold text-purple-900">
							{reviewedAtLeastTwiceCount}
						</p>
						<div class="w-full bg-purple-200 rounded-full h-1.5 mt-3 overflow-hidden">
							<div
								class="bg-purple-600 h-1.5 rounded-full"
								style="width: {(reviewedAtLeastTwiceCount / overall.totalSubmissions) * 100}%"
							></div>
						</div>
					</div>
				</div>

				<!-- Summary Text -->
				<div class="mt-3 flex items-center justify-between px-1">
					<p class="text-xs text-gallery-500">
						<span class="font-medium text-gallery-900">{overall.reviewedSubmissions}</span> videos have been
						reviewed at least once.
					</p>
					<p class="text-xs text-gallery-400">
						Total Submissions: <span class="font-mono">{overall.totalSubmissions}</span>
					</p>
				</div>
			</div>

			<!-- Breakdown Row -->
			<div class="col-span-2 md:col-span-4 lg:col-span-8 grid grid-cols-3 gap-4">
				<div class="rounded-lg bg-green-50 p-3 text-center shadow-sm ring-1 ring-green-900/10">
					<p class="text-[10px] uppercase font-bold text-green-700">Selected</p>
					<p class="text-xl font-bold text-green-800">{overall.selected}</p>
				</div>
				<div class="rounded-lg bg-yellow-50 p-3 text-center shadow-sm ring-1 ring-yellow-900/10">
					<p class="text-[10px] uppercase font-bold text-yellow-700">Maybe</p>
					<p class="text-xl font-bold text-yellow-800">{overall.maybe}</p>
				</div>
				<div class="rounded-lg bg-red-50 p-3 text-center shadow-sm ring-1 ring-red-900/10">
					<p class="text-[10px] uppercase font-bold text-red-700">Not Selected</p>
					<p class="text-xl font-bold text-red-800">{overall.notSelected}</p>
				</div>
			</div>
		</div>
	</section>

	<div class="grid gap-8 grid-cols-1 md:grid-cols-2">
		<!-- Submissions Timeline -->
		<section class="space-y-6">
			<header>
				<h2 class="text-2xl font-semibold">Submission Timeline</h2>
				<p class="text-sm text-gallery-500">Daily intake activity</p>
			</header>
			<SubmissionChart data={timelineStats} />
		</section>

		<!-- Review Timeline -->
		<section class="space-y-6">
			<header>
				<h2 class="text-2xl font-semibold">Review Timeline</h2>
				<p class="text-sm text-gallery-500">Daily review activity</p>
			</header>
			<SubmissionChart data={data.reviewTimelineStats ?? []} />
		</section>
	</div>

	<div class="grid gap-12 lg:grid-cols-6">
		<!-- Curator Leaderboard (Active) -->
		<section class="space-y-6 lg:col-span-4">
			<header class="flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-semibold">Active Curators</h2>
					<p class="text-sm text-gallery-500 mt-1">{activeCurators.length} active members</p>
				</div>
			</header>

			{#if activeCurators.length === 0}
				<div class="rounded-lg bg-gallery-50 p-8 text-center border border-dashed border-gallery-200">
					<p class="text-gallery-500">No active curators yet.</p>
				</div>
			{:else}
				<div class="overflow-hidden rounded-lg border border-gallery-200 bg-white shadow-sm">
					<table class="w-full text-left text-sm">
						<thead
							class="bg-gallery-50 border-b border-gallery-100 text-[10px] uppercase text-gallery-500 tracking-wider"
						>
							<tr>
								<th class="py-3 pl-4 pr-3 font-medium">Curator</th>
								<th class="py-3 px-3 font-medium text-right">Reviews</th>
								<th class="py-3 px-3 font-medium text-right">Selected</th>
								<th class="py-3 px-3 font-medium text-right">Highlights</th>
								<th class="py-3 px-3 font-medium text-right">Ratio</th>
								<th class="py-3 pl-3 pr-4 font-medium text-right">Length</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each activeCurators as curator}
								<tr class="hover:bg-gallery-50/50 transition-colors">
									<td class="py-3 pl-4 pr-3 font-medium text-gallery-900"
										><a class="hover:text-blue-600 transition-all" href="/curator/{curator._id}"
											>{curator.name}</a
										></td
									>
									<td class="py-3 px-3 text-right text-gallery-900 font-medium">{curator.total}</td>
									<td class="py-3 px-3 text-right text-gallery-500">{curator.selected}</td>
									<td class="py-3 px-3 text-right text-gallery-500">{curator.highlights ?? 0}</td>
									<td class="py-3 px-3 text-right text-gallery-500">
										{curator.total > 0
											? ((curator.selected / curator.total) * 100).toFixed(0) + '%'
											: '0%'}
									</td><td class="py-3 pl-3 pr-4 text-right text-gallery-500 text-xs">
										{Math.floor((curator.totalMinutes ?? 0) / 60)}h {(curator.totalMinutes ?? 0) %
											60}m
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		<!-- Inactive Curators -->
		<section class="space-y-6 lg:col-span-2">
			<header class="flex items-center justify-between">
				<div>
					<h2 class="text-2xl font-semibold text-gallery-500">Inactive Curators</h2>
					<p class="text-sm text-gallery-400 mt-1">{inactiveCurators.length} pending members</p>
				</div>
			</header>

			{#if inactiveCurators.length === 0}
				<div class="rounded-lg bg-gallery-50 p-8 text-center border border-dashed border-gallery-200">
					<p class="text-gallery-500">Everyone is active!</p>
				</div>
			{:else}
				<div class="overflow-hidden rounded-lg border border-gallery-200 bg-gallery-50/50 shadow-sm">
					<table class="w-full text-left text-sm">
						<thead
							class="bg-gallery-50 border-b border-gallery-100 text-[10px] uppercase text-gallery-400 tracking-wider"
						>
							<tr>
								<th class="py-3 pl-4 pr-3 font-medium">Name</th>
								<th class="py-3 px-3 font-medium text-right">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each inactiveCurators as curator}
								<tr>
									<td class="py-3 pl-4 pr-3 font-medium text-gallery-500">{curator.name}</td>
									<td class="py-3 px-3 text-right">
										<span
											class="inline-flex items-center rounded-full bg-gallery-100 px-2 py-0.5 text-xs font-medium text-gallery-500"
										>
											Not Started
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		<!-- Flagged Content Index (Full Width if needed, or keeping split) -->
		<section class="space-y-6 lg:col-span-6">
			<header class="flex items-center justify-between">
				<h2 class="text-2xl font-semibold text-red-700">Flagged Content Index</h2>
				<p class="text-sm text-gallery-500">
					{flaggedStats.reduce((acc: any, curr: any) => acc + curr.items.length, 0)} flags
				</p>
			</header>

			{#if flaggedStats.length === 0}
				<div class="rounded-lg bg-gallery-50 p-8 text-center border border-dashed border-gallery-200">
					<p class="text-gallery-500">No content has been flagged yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2">
					{#each flaggedStats as { reason, items }}
						<div class="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden h-fit">
							<div
								class="bg-red-50/50 px-4 py-3 border-b border-red-100 flex justify-between items-center"
							>
								<h3 class="text-sm font-semibold text-red-900">{reason}</h3>
								<span
									class="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-500/10"
								>
									{items.length}
								</span>
							</div>
							<table class="min-w-full table-fixed divide-y divide-gray-100">
								<tbody class="divide-y divide-gray-100 bg-white">
									{#each items as item}
										<tr class="hover:bg-gallery-50 transition-colors group">
											<td class="w-full max-w-0 py-3 pl-4 pr-2 align-middle">
												<a
													href={`/review/${item.id}`}
													class="block text-sm font-medium text-gallery-900 group-hover:text-blue-600 transition-colors truncate"
													title={item.title}
												>
													{item.title}
												</a>
											</td>
											<td class="whitespace-nowrap py-3 pr-4 pl-2 text-right align-middle">
												<span class="text-[10px] text-gallery-400">by {item.curator}</span>
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
