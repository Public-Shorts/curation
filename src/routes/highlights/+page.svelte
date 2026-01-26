<script lang="ts">
	import { StatCard } from '$lib/components/ui';
	import VoteBreakdown from '$lib/components/selection/VoteBreakdown.svelte';
	import FlagBadge from '$lib/components/ui/FlagBadge.svelte';

	let { data } = $props();

	const { stats } = data;

	let sortKey = $state('popular'); // 'popular', 'score', 'title', 'length'
	let sortDir = $state<'asc' | 'desc'>('desc');
	let viewMode = $state<'card' | 'inline'>('card');

	let sortedHighlights = $derived.by(() => {
		return [...data.highlights].sort((a, b) => {
			let av, bv;

			if (sortKey === 'popular') {
				av = a.curators.length;
				bv = b.curators.length;
			} else if (sortKey === 'score') {
				av = a.submission.score || 0;
				bv = b.submission.score || 0;
			} else if (sortKey === 'title') {
				av = a.submission.englishTitle.toLowerCase();
				bv = b.submission.englishTitle.toLowerCase();
			} else if (sortKey === 'length') {
				av = a.submission.length || 0;
				bv = b.submission.length || 0;
			}

			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});
	});

	function toggleSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'title' ? 'asc' : 'desc';
		}
	}
</script>

<div class="space-y-8">
	<!-- Stats Section (Moved to top) -->
	<section class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
		<StatCard label="Unique Films" value={stats.totalHighlights} />

		<StatCard label="Total Highlights" value={stats.totalVideos} />

		<StatCard label="Total Length">
			<p class="text-lg font-semibold">
				{stats.totalHours}h {stats.totalMins}m
			</p>
		</StatCard>

		<StatCard label="Active Curators" value={stats.totalCurators} />

		<StatCard label="Avg Selections">
			<p class="text-lg font-semibold">{stats.averageHighlightsPerVideo}</p>
			<p class="text-xs text-gallery-500 mt-1">per video</p>
		</StatCard>

		<StatCard label="Most Popular">
			{#if stats.mostHighlighted}
				<p
					class="text-sm font-medium truncate"
					title={stats.mostHighlighted.submission.englishTitle}
				>
					{stats.mostHighlighted.submission.englishTitle}
				</p>
				<p class="text-xs text-gallery-500 mt-1">
					{stats.mostHighlighted.curators.length} curator{stats.mostHighlighted.curators.length > 1
						? 's'
						: ''}
				</p>
			{:else}
				<p class="text-sm text-gallery-400">N/A</p>
			{/if}
		</StatCard>
	</section>

	<!-- Header (Title & Sorting) -->
	<header class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
		<div>
			<h1 class="text-3xl font-bold mb-1">Highlights</h1>
			<p class="text-gallery-600 text-sm">Curator selections from the latest batch</p>
		</div>

		<div class="flex flex-col md:items-end gap-3">
			<!-- Display Toggle -->
			<div
				class="flex items-center gap-1 bg-gallery-100 p-1 rounded-lg border border-gallery-200 w-fit"
			>
				<button
					onclick={() => (viewMode = 'card')}
					class="p-1.5 rounded-md transition-all {viewMode === 'card'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
					aria-label="Grid View"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"
						></rect><rect x="14" y="14" width="7" height="7"></rect><rect
							x="3"
							y="14"
							width="7"
							height="7"
						></rect></svg
					>
				</button>
				<button
					onclick={() => (viewMode = 'inline')}
					class="p-1.5 rounded-md transition-all {viewMode === 'inline'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
					aria-label="List View"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"
						></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"
						></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line
							x1="3"
							y1="18"
							x2="3.01"
							y2="18"
						></line></svg
					>
				</button>
			</div>

			<!-- Sorting Controls -->
			<div class="flex items-center gap-2 bg-gallery-50 p-1 rounded-lg border border-gallery-100">
				<span class="text-[10px] uppercase font-bold text-gallery-400 px-2">Sort by:</span>
				<button
					onclick={() => toggleSort('popular')}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {sortKey === 'popular'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
				>
					Popular {sortKey === 'popular' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</button>
				<button
					onclick={() => toggleSort('score')}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {sortKey === 'score'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
				>
					Score {sortKey === 'score' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</button>
				<button
					onclick={() => toggleSort('length')}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {sortKey === 'length'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
				>
					Length {sortKey === 'length' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</button>
				<button
					onclick={() => toggleSort('title')}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {sortKey === 'title'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
				>
					A-Z {sortKey === 'title' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</button>
			</div>
		</div>
	</header>

	<!-- Highlights Grid -->
	<section class="space-y-6">
		{#if sortedHighlights.length === 0}
			<div class="rounded-lg bg-gallery-50 p-12 text-center">
				<p class="text-gallery-500">
					No highlights yet. Curators will select their favorites soon!
				</p>
			</div>
		{:else if viewMode === 'card'}
			<!-- Card Mode -->
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each sortedHighlights as { submission, curators, avgRating, uniqueTags }}
					<a
						href={`/review/${submission._id}`}
						class="flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
					>
						<!-- Poster/Screenshot -->
						{#if submission.poster?.asset}
							<div class="relative aspect-video bg-gallery-100 overflow-hidden">
								<img
									src={`${submission.poster.asset.url}?w=600&h=400&fit=crop`}
									alt={submission.englishTitle}
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								<div
									class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"
								></div>
							</div>
						{:else if submission.screenshots?.[0]?.asset}
							<div class="relative aspect-video bg-gallery-100 overflow-hidden">
								<img
									src={`${submission.screenshots[0].asset.url}?w=600&h=400&fit=crop`}
									alt={submission.englishTitle}
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								<div
									class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"
								></div>
							</div>
						{:else}
							<div
								class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
							>
								<span class="text-gallery-400 text-4xl">🎬</span>
							</div>
						{/if}

						<!-- Content -->
						<div class="p-5 flex-1 flex flex-col space-y-4">
							<div class="flex justify-between items-start gap-4">
								<div class="flex-1 min-w-0">
									<h3
										class="font-bold text-lg leading-tight text-gallery-900 group-hover:text-black truncate"
									>
										{submission.englishTitle}
									</h3>
									<p class="text-sm text-gallery-600 font-medium mt-1">
										{submission.directorName}
										{#if submission.length}
											<span class="text-gallery-300 mx-1.5">•</span>
											<span>{submission.length} min</span>
										{/if}
									</p>
								</div>

								<!-- Grade, Approval, Rating Integrated -->
								<div class="flex flex-col items-end gap-1">
									<div class="flex items-center gap-1.5 text-right">
										{#if submission.score !== undefined}
											<span class="text-xl font-black text-gallery-900 leading-none tracking-tight">
												{submission.score.toFixed(0)}%
											</span>
										{/if}
										{#if avgRating}
											<span
												class="text-xs font-bold text-gallery-400 border-l border-gallery-200 pl-1.5 ml-0.5"
											>
												{avgRating.toFixed(1)}
											</span>
										{/if}
									</div>
									<VoteBreakdown reviews={submission.reviews || []} compact={true} />
								</div>
							</div>

							<!-- Curation Info Disclosure (Icon based) -->
							<div
								class="mt-auto pt-3 border-t border-gallery-100 flex items-center justify-between"
							>
								<div class="relative group/disclosure">
									<!-- Trigger Icon -->
									<div
										class="flex items-center gap-1.5 cursor-help bg-gallery-50 px-2 py-1 rounded-full border border-gallery-100 hover:bg-gallery-100 transition-colors"
									>
										<span class="text-amber-500 text-xs">★</span>
										<span class="text-[10px] font-black text-gallery-600 uppercase tracking-widest"
											>{curators.length}</span
										>
									</div>

									<!-- Disclosure Popover -->
									<div
										class="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gallery-200 p-4 opacity-0 pointer-events-none group-hover/disclosure:opacity-100 group-hover/disclosure:pointer-events-auto transition-all z-50 transform translate-y-2 group-hover/disclosure:translate-y-0"
									>
										<div class="space-y-4">
											<!-- Flags -->
											{#if submission.flags && submission.flags.length > 0}
												<div class="space-y-1.5">
													<p
														class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest"
													>
														Flags
													</p>
													<div class="flex flex-wrap gap-1.5">
														{#each submission.flags as flag}
															<FlagBadge {flag} />
														{/each}
													</div>
												</div>
											{/if}

											<!-- Tags -->
											{#if uniqueTags && uniqueTags.length > 0}
												<div class="space-y-1.5">
													<p
														class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest"
													>
														Tags
													</p>
													<div class="flex flex-wrap gap-1">
														{#each uniqueTags as tag}
															<span
																class="px-2 py-0.5 text-[10px] font-bold uppercase bg-gallery-50 text-gallery-500 rounded-full border border-gallery-100/50"
															>
																{tag.label}
															</span>
														{/each}
													</div>
												</div>
											{/if}

											<!-- Curators -->
											<div class="space-y-1.5">
												<p class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest">
													Curators
												</p>
												<div class="flex flex-wrap gap-1">
													{#each curators as curator}
														<span
															class="text-[9px] font-bold text-gallery-700 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-200/50"
														>
															{curator.name}
														</span>
													{/each}
												</div>
											</div>
										</div>
									</div>
								</div>

								<span
									class="text-xs font-bold text-gallery-400 group-hover:text-black transition-colors"
								>
									Details →
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<!-- Inline Mode (List) -->
			<div class="space-y-2">
				{#each sortedHighlights as { submission, curators, avgRating, uniqueTags }}
					<a
						href={`/review/${submission._id}`}
						class="flex items-center gap-4 bg-white p-3 rounded-lg border border-gallery-100 hover:border-gallery-300 hover:shadow-md transition-all group"
					>
						<!-- Thumbnail -->
						<div class="h-12 w-20 rounded bg-gallery-100 flex-shrink-0 overflow-hidden">
							{#if submission.poster?.asset}
								<img
									src={`${submission.poster.asset.url}?w=200&h=120&fit=crop`}
									class="h-full w-full object-cover"
									alt=""
								/>
							{:else if submission.screenshots?.[0]?.asset}
								<img
									src={`${submission.screenshots[0].asset.url}?w=200&h=120&fit=crop`}
									class="h-full w-full object-cover"
									alt=""
								/>
							{:else}
								<div class="h-full w-full flex items-center justify-center text-xs">🎬</div>
							{/if}
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<h4 class="font-bold text-gallery-900 group-hover:text-black truncate">
								{submission.englishTitle}
							</h4>
							<p class="text-[11px] text-gallery-500">
								{submission.directorName}
							</p>
						</div>

						<!-- Duration -->
						<div class="w-16 text-center">
							<span class="text-xs font-medium text-gallery-500">{submission.length}m</span>
						</div>

						<!-- Curation Info Disclosure (Inline) -->
						<div class="w-[80px] flex justify-end">
							<div class="relative group/disclosure">
								<!-- Trigger Icon -->
								<div
									class="flex items-center gap-1 cursor-help px-2 py-1 rounded-md hover:bg-gallery-50 transition-colors"
								>
									<span class="text-lg text-amber-500">★</span>
									<span class="text-xs font-bold text-gallery-500">{curators.length}</span>
								</div>

								<!-- Disclosure Popover -->
								<div
									class="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gallery-200 p-4 opacity-0 pointer-events-none group-hover/disclosure:opacity-100 group-hover/disclosure:pointer-events-auto transition-all z-50 transform translate-y-2 group-hover/disclosure:translate-y-0 text-left"
								>
									<div class="space-y-4">
										<!-- Flags -->
										{#if submission.flags && submission.flags.length > 0}
											<div class="space-y-1.5">
												<p class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest">
													Flags
												</p>
												<div class="flex flex-wrap gap-1.5">
													{#each submission.flags as flag}
														<FlagBadge {flag} />
													{/each}
												</div>
											</div>
										{/if}

										<!-- Tags -->
										{#if uniqueTags && uniqueTags.length > 0}
											<div class="space-y-1.5">
												<p class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest">
													Tags
												</p>
												<div class="flex flex-wrap gap-1">
													{#each uniqueTags as tag}
														<span
															class="px-2 py-0.5 text-[10px] font-bold uppercase bg-gallery-50 text-gallery-500 rounded-full border border-gallery-100/50"
														>
															{tag.label}
														</span>
													{/each}
												</div>
											</div>
										{/if}

										<!-- Curators -->
										<div class="space-y-1.5">
											<p class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest">
												Curators
											</p>
											<div class="flex flex-wrap gap-1">
												{#each curators as curator}
													<span
														class="text-[9px] font-bold text-gallery-700 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-200/50"
													>
														{curator.name}
													</span>
												{/each}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
	}
</style>
