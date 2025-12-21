<!-- src/routes/stats/+page.svelte -->
<script lang="ts">
	import { fade } from 'svelte/transition';

	let { data } = $props();

	let leaderboard = $derived(data.leaderboard);
	let overall = $derived(data.overall);
	let categoriesStats = $derived(data.categoriesStats);
	let flaggedStats = $derived(data.flaggedStats);
	let timelineStats = $derived(data.timelineStats);
	const maxCount = Math.max(1, ...categoriesStats.map((c: any) => c.count));

	// --- Chart Logic ---
	// Simple SVG dimensions
	let chartWidth = 0;
	const chartHeight = 200;
	const padding = 20;

	// Derived values for the chart
	const dates = timelineStats.map((d: any) => new Date(d.date).getTime());
	const counts = timelineStats.map((d: any) => d.count);
	const maxSubmissionCount = Math.max(...counts, 5); // Minimum ceiling of 5
	const minDate = Math.min(...dates);
	const maxDate = Math.max(...dates);

	// Scales
	const xScale = (date: number) => {
		if (!chartWidth) return 0;
		return padding + ((date - minDate) / (maxDate - minDate)) * (chartWidth - padding * 2);
	};

	const yScale = (count: number) => {
		return chartHeight - padding - (count / maxSubmissionCount) * (chartHeight - padding * 2);
	};

	// Generate path
	let pathD = $state('');
	let points = $state<{ x: number; y: number; data: any }[]>([]);

	// React to width changes
	$effect(() => {
		if (chartWidth > 0 && timelineStats.length > 1) {
			const pts = timelineStats.map((d: any) => ({
				x: xScale(new Date(d.date).getTime()),
				y: yScale(d.count),
				data: d
			}));
			points = pts;
			pathD = `M${pts.map((p: any) => `${p.x},${p.y}`).join(' L')}`;
		}
	});

	// Tooltip interaction
	let hoveredPoint = $state<{ x: number; y: number; data: any } | null>(null);
</script>

<div class="p-6 max-w-7xl mx-auto space-y-12">
	<!-- Overall Stats Cards -->
	<section class="space-y-4">
		<h2 class="text-2xl font-semibold">Overview</h2>

		<!-- Responsive Grid: 2 cols mobile, 4 cols tablet, 8 cols desktop -->
		<div class="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
			<!-- Total Submissions (NEW REQUEST) -->
			<div class="col-span-2 md:col-span-2 rounded-lg bg-gray-900 p-4 shadow-sm text-white">
				<p class="text-xs uppercase text-gray-400">Total Submissions</p>
				<p class="mt-1 text-3xl font-bold">{overall.totalSubmissions}</p>
			</div>

			<!-- Total Duration (NEW REQUEST) -->
			<div
				class="col-span-2 md:col-span-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5"
			>
				<p class="text-xs uppercase text-gray-500">Total Footage Duration</p>
				<div class="mt-1 flex items-baseline gap-1">
					<p class="text-2xl font-semibold text-gray-900">
						{Math.floor(overall.totalMinutes / 60)}
					</p>
					<span class="text-sm text-gray-500">hours</span>
					<p class="text-2xl font-semibold text-gray-900 ml-2">
						{overall.totalMinutes % 60}
					</p>
					<span class="text-sm text-gray-500">mins</span>
				</div>
			</div>

			<!-- Submissions Reviewed (NEW REQUEST) -->
			<div
				class="col-span-2 md:col-span-2 rounded-lg bg-blue-50 p-4 shadow-sm ring-1 ring-blue-900/5"
			>
				<p class="text-xs uppercase text-blue-600 font-medium">Submissions Reviewed</p>
				<div class="flex items-end justify-between">
					<p class="mt-1 text-2xl font-semibold text-blue-900">{overall.reviewedSubmissions}</p>
					<!-- Progress bar visual -->
					<div class="w-16 h-1.5 bg-blue-200 rounded-full mb-2">
						<div
							class="h-full bg-blue-600 rounded-full"
							style="width: {(overall.reviewedSubmissions / overall.totalSubmissions) * 100}%"
						></div>
					</div>
				</div>
				<p class="text-[10px] text-blue-400 mt-1">
					{((overall.reviewedSubmissions / overall.totalSubmissions) * 100).toFixed(0)}% completion
				</p>
			</div>

			<!-- Approval Rate -->
			<div
				class="col-span-1 md:col-span-1 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5"
			>
				<p class="text-xs uppercase text-gray-500">Approval Rate</p>
				<p class="mt-1 text-lg font-semibold">
					{overall.approvalRate.toFixed(1)}<span class="text-sm text-gray-500">%</span>
				</p>
			</div>

			<!-- Total Individual Reviews -->
			<div
				class="col-span-1 md:col-span-1 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5"
			>
				<p class="text-xs uppercase text-gray-500">Total Reviews</p>
				<p class="mt-1 text-lg font-semibold">{overall.total}</p>
			</div>

			<!-- Breakdown (Small Cards) -->
			<div class="col-span-2 md:col-span-4 lg:col-span-8 grid grid-cols-3 gap-4">
				<!-- Selected -->
				<div class="rounded-lg bg-green-50 p-3 text-center shadow-sm ring-1 ring-green-900/10">
					<p class="text-[10px] uppercase font-bold text-green-700">Selected</p>
					<p class="text-xl font-bold text-green-800">{overall.selected}</p>
				</div>
				<!-- Maybe -->
				<div class="rounded-lg bg-yellow-50 p-3 text-center shadow-sm ring-1 ring-yellow-900/10">
					<p class="text-[10px] uppercase font-bold text-yellow-700">Maybe</p>
					<p class="text-xl font-bold text-yellow-800">{overall.maybe}</p>
				</div>
				<!-- Not Selected -->
				<div class="rounded-lg bg-red-50 p-3 text-center shadow-sm ring-1 ring-red-900/10">
					<p class="text-[10px] uppercase font-bold text-red-700">Not Selected</p>
					<p class="text-xl font-bold text-red-800">{overall.notSelected}</p>
				</div>
			</div>
		</div>
	</section>

	<!-- NEW: Submissions Timeline Graph -->
	<section class="space-y-6">
		<header>
			<h2 class="text-2xl font-semibold">Submission Timeline</h2>
			<p class="text-sm text-gray-500">Daily submission intake over time</p>
		</header>

		<div
			class="w-full bg-white rounded-lg border p-6 shadow-sm overflow-hidden relative"
			bind:clientWidth={chartWidth}
		>
			{#if timelineStats.length > 1}
				<svg width="100%" height={chartHeight} class="overflow-visible">
					<!-- Grid Lines (Horizontal) -->
					{#each [0, 0.25, 0.5, 0.75, 1] as tick}
						<line
							x1={padding}
							x2="100%"
							y1={chartHeight - padding - tick * (chartHeight - padding * 2)}
							y2={chartHeight - padding - tick * (chartHeight - padding * 2)}
							stroke="#f3f4f6"
							stroke-dasharray="4"
						/>
					{/each}

					<!-- The Line -->
					<path
						d={pathD}
						fill="none"
						stroke="#2563eb"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>

					<!-- Interactive Points -->
					{#each points as point}
						<!-- Invisible larger click area -->
						<circle
							cx={point.x}
							cy={point.y}
							r="8"
							fill="transparent"
							onmouseenter={() => (hoveredPoint = point)}
							onmouseleave={() => (hoveredPoint = null)}
							class="cursor-pointer"
							role="button"
							tabindex="0"
							aria-label="View submission count for {point.data.date}"
						/>
						<!-- Visible dot -->
						<circle
							cx={point.x}
							cy={point.y}
							r={hoveredPoint === point ? 5 : 3}
							fill="white"
							stroke="#2563eb"
							stroke-width="2"
							class="pointer-events-none transition-all duration-200"
						/>
					{/each}
				</svg>

				<!-- Tooltip -->
				{#if hoveredPoint}
					<div
						transition:fade={{ duration: 100 }}
						class="absolute bg-gray-900 text-white text-xs rounded py-1 px-2 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-10px] z-10"
						style="left: {hoveredPoint.x}px; top: {hoveredPoint.y}px;"
					>
						<div class="font-bold">{hoveredPoint.data.count} submissions</div>
						<div class="text-gray-400">{hoveredPoint.data.date}</div>
					</div>
				{/if}

				<!-- X Axis Labels (Min and Max) -->
				<div class="flex justify-between text-xs text-gray-400 mt-2 px-[20px]">
					<span>{timelineStats[0].date}</span>
					<span>{timelineStats[timelineStats.length - 1].date}</span>
				</div>
			{:else}
				<div class="h-[200px] flex items-center justify-center text-gray-400 italic">
					Not enough data to generate graph.
				</div>
			{/if}
		</div>
	</section>

	<!-- Split Section: Leaderboard & Categories -->
	<div class="grid gap-12 lg:grid-cols-2">
		<!-- Leaderboard Table -->
		<section class="space-y-6">
			<header class="flex items-center justify-between">
				<h2 class="text-2xl font-semibold">Curator Leaderboard</h2>
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
			</header>

			<div
				class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 space-y-4 max-h-[400px] overflow-y-auto"
			>
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

		<!-- Flagged Content Index (Full Width on mobile, 2 cols on Desktop) -->
		<section class="space-y-6 lg:col-span-2">
			<header class="flex items-center justify-between">
				<h2 class="text-2xl font-semibold text-red-700">Flagged Content Index</h2>
				<p class="text-sm text-gray-500">
					{flaggedStats.reduce((acc: any, curr: any) => acc + curr.items.length, 0)} flags
				</p>
			</header>

			{#if flaggedStats.length === 0}
				<div class="rounded-lg bg-gray-50 p-8 text-center">
					<p class="text-gray-500">No content has been flagged yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2">
					{#each flaggedStats as { reason, items }}
						<div class="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden h-fit">
							<!-- Header -->
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

							<!-- Table -->
							<table class="min-w-full table-fixed divide-y divide-gray-100">
								<tbody class="divide-y divide-gray-100 bg-white">
									{#each items as item}
										<tr class="hover:bg-gray-50 transition-colors group">
											<td class="w-full max-w-0 py-3 pl-4 pr-2 align-middle">
												<a
													href={`/review/${item.id}`}
													class="block text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate"
													title={item.title}
												>
													{item.title}
												</a>
											</td>
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
