<script lang="ts">
	let { data } = $props();

	// State
	let activeCategories = $state<string[]>([]);
	let activeCuratorTags = $state<string[]>([]); // New state for curator tags

	let sortKey = $state('approvalRate');
	let sortDir = $state<'asc' | 'desc'>('desc');

	// Derived: Filter and Sort
	let filteredMovies = $derived.by(() => {
		let result = data.movies.filter((movie: any) => {
			// 1. Filter by Submission Categories
			if (activeCategories.length > 0) {
				const hasAllCategories = activeCategories.every((tag) =>
					movie.displayCategories.includes(tag)
				);
				if (!hasAllCategories) return false;
			}

			// 2. Filter by Curator Tags (New)
			if (activeCuratorTags.length > 0) {
				const hasAllTags = activeCuratorTags.every((tag) => movie.curatorTags.includes(tag));
				if (!hasAllTags) return false;
			}

			return true;
		});

		// 3. Sort
		return result.sort((a: any, b: any) => {
			let av = a[sortKey];
			let bv = b[sortKey];

			if (typeof av === 'string') av = av.toLowerCase();
			if (typeof bv === 'string') bv = bv.toLowerCase();

			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});
	});

	// Helpers
	function toggleCategory(cat: string) {
		if (activeCategories.includes(cat)) {
			activeCategories = activeCategories.filter((c) => c !== cat);
		} else {
			activeCategories = [...activeCategories, cat];
		}
	}

	function toggleCuratorTag(tag: string) {
		if (activeCuratorTags.includes(tag)) {
			activeCuratorTags = activeCuratorTags.filter((t) => t !== tag);
		} else {
			activeCuratorTags = [...activeCuratorTags, tag];
		}
	}

	function setSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = ['englishTitle', 'filmLanguage'].includes(key) ? 'asc' : 'desc';
		}
	}

	const getScoreColor = (score: number) => {
		if (score >= 75) return 'bg-green-500';
		if (score >= 50) return 'bg-yellow-500';
		return 'bg-red-500';
	};
</script>

<div class="p-6 max-w-7xl mx-auto space-y-8">
	<header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-gray-900">Final Selection</h1>
			<p class="text-sm text-gray-500 mt-1">
				Showing {filteredMovies.length} of {data.movies.length} submissions
			</p>
		</div>
		<div class="flex items-center gap-2 text-sm text-gray-600">
			<span
				>Sorted by <span class="font-semibold capitalize">{sortKey.replace(/([A-Z])/g, ' $1')}</span
				></span
			>
		</div>
	</header>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Filter 1: Submission Categories -->
		<section class="space-y-3">
			<h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">
				Filter by Genre (Submission)
			</h3>
			<div class="flex flex-wrap gap-2">
				{#each data.allCategories as cat}
					<button
						onclick={() => toggleCategory(cat)}
						class="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border
                        {activeCategories.includes(cat)
							? 'bg-black text-white border-black'
							: 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}"
					>
						{cat}
					</button>
				{/each}
				{#if activeCategories.length > 0}
					<button
						onclick={() => (activeCategories = [])}
						class="px-3 py-1 text-xs text-red-600 hover:underline">Clear</button
					>
				{/if}
			</div>
		</section>

		<!-- Filter 2: Curator Tags -->
		<section class="space-y-3">
			<h3 class="text-xs font-semibold uppercase tracking-wider text-blue-600">
				Filter by Tags (Curators)
			</h3>
			<div class="flex flex-wrap gap-2">
				{#each data.allCuratorTags as tag}
					{@const count = data.movies.filter((m) => m.curatorTags.includes(tag)).length}
					<button
						onclick={() => toggleCuratorTag(tag)}
						class="pl-3 pr-1 py-1 rounded-full flex items-center gap-2 text-xs font-medium transition-all duration-200 border
						{activeCuratorTags.includes(tag)
							? 'bg-blue-600 text-white border-blue-600'
							: 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300'}"
					>
						{tag}
						<span class="p-0.5 text-xs w-2 rounded-full bg-blue-100 opacity-60">{count}</span>
					</button>
				{/each}
				{#if activeCuratorTags.length === 0 && data.allCuratorTags.length === 0}
					<span class="text-xs text-gray-400 italic">No tags assigned yet.</span>
				{/if}
				{#if activeCuratorTags.length > 0}
					<button
						onclick={() => (activeCuratorTags = [])}
						class="px-3 py-1 text-xs text-red-600 hover:underline">Clear</button
					>
				{/if}
			</div>
		</section>
	</div>

	<!-- Main Table -->
	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
		<table class="w-full text-left text-sm">
			<thead
				class="bg-gray-50 border-b border-gray-200 text-[10px] uppercase text-gray-500 font-medium"
			>
				<tr>
					<th
						class="py-3 pl-4 cursor-pointer hover:text-gray-900"
						onclick={() => setSort('englishTitle')}
					>
						Title {sortKey === 'englishTitle' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th
						class="py-3 px-2 w-20 cursor-pointer hover:text-gray-900"
						onclick={() => setSort('reviewsCount')}
					>
						Reviews {sortKey === 'reviewsCount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th
						class="py-3 px-2 w-32 cursor-pointer hover:text-gray-900"
						onclick={() => setSort('approvalRate')}
					>
						Approval {sortKey === 'approvalRate' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th
						class="py-3 px-2 w-24 cursor-pointer hover:text-gray-900"
						onclick={() => setSort('averageRating')}
					>
						Avg Rating {sortKey === 'averageRating' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th class="py-3 px-2">Categories & Tags</th>
					<th class="py-3 px-2 w-24">Action</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each filteredMovies as movie (movie._id)}
					<tr class="hover:bg-gray-50/80 transition-colors">
						<!-- Title -->
						<td class="py-3 pl-4 pr-2 font-medium text-gray-900 align-top">
							<div class="truncate max-w-[200px]" title={movie.englishTitle}>
								{movie.englishTitle}
							</div>
							<div class="text-xs text-gray-400 font-normal mt-0.5">
								{movie.filmLanguage} · {movie.length}m
							</div>
						</td>

						<!-- Reviews Count -->
						<td class="py-3 px-2 align-top pt-3.5">
							<span
								class="inline-flex items-center justify-center px-2 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700"
							>
								{movie.reviewsCount}
							</span>
						</td>

						<!-- Approval -->
						<td class="py-3 px-2 align-top pt-3.5">
							<div class="flex items-center gap-2">
								<span class="text-xs font-semibold w-8 text-right"
									>{movie.approvalRate.toFixed(0)}%</span
								>
								<div class="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden min-w-[50px]">
									<div
										class="h-full rounded-full {getScoreColor(movie.approvalRate)}"
										style:width="{movie.approvalRate}%"
									></div>
								</div>
							</div>
						</td>

						<!-- Rating -->
						<td class="py-3 px-2 align-top pt-3">
							{#if movie.averageRating > 0}
								<span
									class="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-[11px] font-semibold text-gray-700 border border-gray-200"
								>
									★ {movie.averageRating.toFixed(1)}
								</span>
							{:else}
								<span class="text-xs text-gray-400 pl-1">-</span>
							{/if}
						</td>

						<!-- Combined Categories & Tags Display -->
						<td class="py-3 px-2 align-top">
							<div class="flex flex-col gap-1.5">
								<!-- Genre -->
								<div class="flex flex-wrap gap-1 max-w-[300px]">
									{#each movie.displayCategories as cat}
										<span
											class="inline-flex items-center rounded-sm bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
										>
											{cat}
										</span>
									{/each}
								</div>
								<!-- Curator Tags -->
								{#if movie.curatorTags.length > 0}
									<div class="flex flex-wrap gap-1 max-w-[300px]">
										{#each movie.curatorTags as tag}
											<span
												class="inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10"
											>
												#{tag}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						</td>

						<!-- Action Button -->
						<td class="py-3 px-2 align-top pt-3">
							<a
								href="/review/{movie._id}"
								class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
							>
								Review
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if filteredMovies.length === 0}
			<div class="p-12 text-center text-gray-500">No movies match the selected filters.</div>
		{/if}
	</div>
</div>
