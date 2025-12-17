<script lang="ts">
    let { data } = $props();
    
    // State
    let activeTags = $state<string[]>([]);
    let sortKey = $state('approvalRate'); // Default sort by approval
    let sortDir = $state<'asc' | 'desc'>('desc'); // Highest first

    // Derived: Filter and Sort
    let filteredMovies = $derived.by(() => {
        // 1. Filter by Tags (AND logic: movie must have ALL selected tags)
        let result = data.movies.filter((movie: any) => {
            if (activeTags.length === 0) return true;
            return activeTags.every(tag => movie.displayCategories.includes(tag));
        });

        // 2. Sort
        return result.sort((a: any, b: any) => {
            let av = a[sortKey];
            let bv = b[sortKey];

            // Handle strings (case insensitive)
            if (typeof av === 'string') av = av.toLowerCase();
            if (typeof bv === 'string') bv = bv.toLowerCase();

            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    });

    // Helpers
    function toggleTag(tag: string) {
        if (activeTags.includes(tag)) {
            activeTags = activeTags.filter(t => t !== tag);
        } else {
            activeTags = [...activeTags, tag];
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

    // Color helpers for progress bars
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
	</header>

	<!-- Tag Filter System -->
	<section class="space-y-3">
		<h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Filter by Category</h3>
		<div class="flex flex-wrap gap-2">
			{#each data.allTags as tag}
				<button
					onclick={() => toggleTag(tag)}
					class="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border
                    {activeTags.includes(tag)
						? 'bg-black text-white border-black'
						: 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}"
				>
					{tag}
				</button>
			{/each}
			{#if activeTags.length > 0}
				<button
					onclick={() => (activeTags = [])}
					class="px-3 py-1 text-xs text-red-600 hover:underline"
				>
					Clear filters
				</button>
			{/if}
		</div>
	</section>

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
					<th
						class="py-3 px-2 cursor-pointer hover:text-gray-900"
						onclick={() => setSort('reviewsCount')}
					>
						Reviews
					</th>
					<th class="py-3 px-2">Categories</th>
					<th class="py-3 px-2 w-20 text-right">Action</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each filteredMovies as movie (movie._id)}
					<tr class="hover:bg-gray-50/80 transition-colors">
						<!-- Title -->
						<td class="py-3 pl-4 pr-2 font-medium text-gray-900">
							<div class="truncate max-w-[200px]" title={movie.englishTitle}>
								{movie.englishTitle}
							</div>
							<div class="text-xs text-gray-400 font-normal">
								{movie.filmLanguage} · {movie.length}m
							</div>
						</td>

						<!-- Approval Rate Bar -->
						<td class="py-3 px-2 align-middle">
							<div class="flex items-center gap-2">
								<span class="text-xs font-semibold w-8 text-right"
									>{movie.approvalRate.toFixed(0)}%</span
								>
								<div class="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
									<div
										class="h-full rounded-full {getScoreColor(movie.approvalRate)}"
										style:width="{movie.approvalRate}%"
									></div>
								</div>
							</div>
						</td>

						<!-- Average Rating -->
						<td class="py-3 px-2 align-middle">
							{#if movie.averageRating > 0}
								<div
									class="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-semibold text-gray-700"
								>
									★ {movie.averageRating.toFixed(1)}
								</div>
							{:else}
								<span class="text-xs text-gray-400">-</span>
							{/if}
						</td>

						<!-- Review Count -->
						<td class="py-3 px-2 text-gray-500">
							{movie.reviewsCount}
						</td>

						<!-- Categories -->
						<td class="py-3 px-2">
							<div class="flex flex-wrap gap-1 max-w-[250px]">
								{#each movie.displayCategories.slice(0, 3) as cat}
									<span
										class="inline-flex items-center rounded-sm bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
									>
										{cat}
									</span>
								{/each}
								{#if movie.displayCategories.length > 3}
									<span class="text-[10px] text-gray-400 px-1"
										>+{movie.displayCategories.length - 3}</span
									>
								{/if}
							</div>
						</td>

						<!-- Action -->
						<td class="py-3 px-2 text-right pr-4">
							<a
								href="/review/{movie._id}"
								class="text-blue-600 hover:text-blue-900 text-xs font-medium"
							>
								Open
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
