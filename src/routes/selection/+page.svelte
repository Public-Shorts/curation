<script lang="ts">
	import FilterDropdown from '$lib/components/FilterDropdown.svelte';
	import FilterBar from '$lib/components/selection/FilterBar.svelte';
	import MoviesTable from '$lib/components/selection/MoviesTable.svelte';

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

	function setSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = ['englishTitle', 'filmLanguage'].includes(key) ? 'asc' : 'desc';
		}
	}
</script>

<div class="p-6 mx-auto space-y-8">
	<header
		class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6"
	>
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-gray-900">Final Selection</h1>
			<p class="text-sm text-gray-500 mt-1">
				Showing {filteredMovies.length} of {data.movies.length} submissions
			</p>
		</div>

		<!-- COMPACT FILTER BAR -->
		<FilterBar
			allCategories={data.allCategories}
			allCuratorTags={data.allCuratorTags}
			bind:activeCategories
			bind:activeCuratorTags
		/>
	</header>

	<!-- Main Table -->
	<MoviesTable movies={filteredMovies} {sortKey} {sortDir} {setSort} />
</div>
