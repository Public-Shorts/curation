<script lang="ts">
	import type { PageData } from './$types';
	import { StatCard } from '$lib/components/ui';
	import { formatTime } from '$lib/utils/formatting';
	import { invalidateAll } from '$app/navigation';
	import { getToastMessages } from '$lib/toast/toastMessages.svelte.ts';
	import { LayoutGrid, List } from 'lucide-svelte';
	import SelectionFilters from '$lib/components/selection/SelectionFilters.svelte';
	import FilmSection from '$lib/components/selection/FilmSection.svelte';
	import FilmDetailDialog from '$lib/components/selection/FilmDetailDialog.svelte';
	import { calculateSectionStats, addVisibilityToFilms } from '$lib/utils/selectionStats';

	type Film = {
		_id: string;
		length?: number;
		isVisible?: boolean;
		tags?: string[];
		[key: string]: any;
	};

	let { data } = $props<{ data: PageData }>();

	const toasts = getToastMessages();
	let isRefreshing = $state(false);

	// Dialog state for video details
	let detailVideo = $state<any | null>(null);

	function showDetails(film: any) {
		const fullData = data.submissionsWithReviews[film._id];
		detailVideo = fullData || film;
	}

	function closeDetails() {
		detailVideo = null;
	}

	// Filter state
	let selectedClusters = $state<Set<string>>(new Set());
	let selectedTags = $state<Set<string>>(new Set());
	let viewMode = $state<'grid' | 'compact'>('grid');

	// Deduplicate: filter out both highlights AND unanimous from other sections
	let excludedIds = $derived(
		new Set([...data.highlights.map((f: any) => f._id), ...data.unanimous.map((f: any) => f._id)])
	);

	let unanimousFiltered = $derived(
		data.unanimous.filter((f: any) => !new Set(data.highlights.map((h) => h._id)).has(f._id))
	);
	let selectedFiltered = $derived(data.selected.filter((f: any) => !excludedIds.has(f._id)));
	let maybeFiltered = $derived(data.maybe.filter((f: any) => !excludedIds.has(f._id)));

	// Collect all films for filter options
	let allFilmsForFiltering = $derived([
		...data.highlights,
		...unanimousFiltered,
		...selectedFiltered,
		...maybeFiltered
	]);

	// Extract tags with ≥2 occurrences
	let availableTags = $derived.by(() => {
		const tagMap = new Map<string, number>();
		allFilmsForFiltering.forEach((film: any) => {
			(film.tags || []).forEach((tag: string) => {
				tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
			});
		});
		return Array.from(tagMap.entries())
			.filter(([_, count]) => count >= 2)
			.sort((a, b) => b[1] - a[1])
			.map(([tag, count]) => ({ label: tag, count }));
	});

	// Map films to their clusters
	let filmToClusterMap = $derived.by(() => {
		const map = new Map<string, string[]>();
		data.clusters.forEach((cluster: any) => {
			const allMovieIds = [
				...cluster.highlightedMovies.map((m: any) => m._id),
				...cluster.relevantMovies.map((m: any) => m._id)
			];
			allMovieIds.forEach((id: string) => {
				if (!map.has(id)) map.set(id, []);
				map.get(id)!.push(cluster.name);
			});
		});
		return map;
	});

	let availableClusters = $derived(data.clusters.map((c: any) => ({ label: c.name, id: c.id })));

	// Filter matching function
	function filmMatchesFilters(film: any): boolean {
		let matches = true;

		if (selectedClusters.size > 0) {
			const filmClusters = filmToClusterMap.get(film._id) || [];
			matches = matches && filmClusters.some((c) => selectedClusters.has(c));
		}

		if (selectedTags.size > 0) {
			const filmTags = film.tags || [];
			matches = matches && filmTags.some((t: string) => selectedTags.has(t));
		}

		return matches;
	}

	// Apply filters - add isVisible property to each film
	let highlightsWithVisibility = $derived(addVisibilityToFilms(data.highlights, filmMatchesFilters));
	let unanimousWithVisibility = $derived(
		addVisibilityToFilms(unanimousFiltered, filmMatchesFilters)
	);
	let selectedWithVisibility = $derived(addVisibilityToFilms(selectedFiltered, filmMatchesFilters));
	let maybeWithVisibility = $derived(addVisibilityToFilms(maybeFiltered, filmMatchesFilters));

	// Calculate stats for each section
	let highlightsStats = $derived(calculateSectionStats(highlightsWithVisibility));
	let unanimousStats = $derived(calculateSectionStats(unanimousWithVisibility));
	let selectedStats = $derived(calculateSectionStats(selectedWithVisibility));
	let maybeStats = $derived(calculateSectionStats(maybeWithVisibility));

	let hasActiveFilters = $derived(selectedClusters.size > 0 || selectedTags.size > 0);

	// Calculate stats
	let totalFilms = $derived(
		new Set([...data.highlights, ...data.selected, ...data.maybe].map((f: Film) => f._id)).size
	);
	let totalRuntime = $derived(
		[...data.highlights, ...data.selected].reduce(
			(sum: number, f: Film) => sum + (f.length || 0),
			0
		)
	);

	async function refreshSelection() {
		isRefreshing = true;
		try {
			const response = await fetch('/api/update-selection', { method: 'POST' });
			const result = await response.json();
			if (result.success) {
				toasts.add({ message: 'Selection data updated!', type: 'success' });
				await invalidateAll();
			} else {
				throw new Error(result.error || 'Failed to update');
			}
		} catch (error: any) {
			toasts.add({ message: `Error: ${error.message}`, type: 'error' });
		} finally {
			isRefreshing = false;
		}
	}
</script>

<!-- Dev Refresh Button -->
{#if data.isDev}
	<div class="fixed top-4 right-4 z-50">
		<button
			onclick={refreshSelection}
			disabled={isRefreshing}
			class="px-4 py-2 bg-gallery-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-gallery-800 disabled:opacity-50 shadow-lg transition-all"
		>
			{isRefreshing ? 'Refreshing...' : '⟳ Refresh Selection'}
		</button>
	</div>
{/if}

<div class="space-y-12 pb-20">
	<!-- Stats Bar -->
	<section class="grid gap-4 md:grid-cols-5">
		<StatCard label="Total Films" value={totalFilms} />
		<StatCard label="Highlights" value={data.highlights.length} />
		<StatCard label="Selected" value={data.selected.length} />
		<StatCard label="Maybe" value={data.maybe.length} />
		<StatCard label="Total Runtime">
			<p class="text-lg font-semibold">{formatTime(totalRuntime)}</p>
		</StatCard>
	</section>

	<!-- Editorial Summary
	<section class="space-y-6">
		<details class="group">
			<summary class="cursor-pointer list-none">
				<div
					class="flex items-center gap-2 text-xl font-bold text-gallery-900 hover:text-black transition-colors"
				>
					<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
					Editorial Summary
				</div>
				<p class="text-sm text-gallery-500 mt-1 ml-6">Overview of the selection</p>
			</summary>

			<div class="mt-6 bg-white rounded-xl border border-gallery-200 p-8">
				<div class="prose prose-sm max-w-none text-gallery-700 leading-relaxed space-y-4">
					<p>
						This year's selection showcases a diverse range of voices and perspectives from filmmakers
						around the world. The curated films explore themes of identity, social justice, and human
						connection through innovative storytelling techniques.
					</p>
					<p>
						Our jury has carefully reviewed each submission to identify works that push creative
						boundaries while maintaining strong narrative and technical execution.
					</p>
				</div>
			</div>
		</details>
	</section> -->

	<!-- Filters and View Toggle -->
	<section class="flex flex-wrap items-center justify-between gap-4">
		<SelectionFilters
			bind:selectedClusters
			bind:selectedTags
			{availableClusters}
			{availableTags}
			onClear={() => {
				selectedClusters = new Set();
				selectedTags = new Set();
			}}
		/>

		<!-- View Mode Toggle -->
		<div class="flex items-center gap-1 bg-gallery-100 p-1 rounded-lg border border-gallery-200">
			<button
				onclick={() => (viewMode = 'grid')}
				class="p-1.5 rounded-md transition-all {viewMode === 'grid'
					? 'bg-white shadow-sm text-gallery-900'
					: 'text-gallery-500 hover:text-gallery-700'}"
				aria-label="Grid View"
			>
				<LayoutGrid size={16} />
			</button>
			<button
				onclick={() => (viewMode = 'compact')}
				class="p-1.5 rounded-md transition-all {viewMode === 'compact'
					? 'bg-white shadow-sm text-gallery-900'
					: 'text-gallery-500 hover:text-gallery-700'}"
				aria-label="Compact List View"
			>
				<List size={16} />
			</button>
		</div>
	</section>

	<!-- Highlights Section -->
	<FilmSection
		title="Highlights"
		description="Hand-picked favorites from our curators"
		films={highlightsWithVisibility}
		{viewMode}
		totalCount={highlightsStats.totalCount}
		visibleCount={highlightsStats.visibleCount}
		totalMinutes={highlightsStats.totalMinutes}
		visibleMinutes={highlightsStats.visibleMinutes}
		{hasActiveFilters}
		onFilmClick={showDetails}
		open={true}
		emptyMessage="No highlights yet."
	/>

	<!-- 100% Approval Section -->
	{#if unanimousFiltered.length > 0}
		<FilmSection
			title="100% Approval"
			description="Films unanimously approved by all reviewers"
			films={unanimousWithVisibility}
			{viewMode}
			totalCount={unanimousStats.totalCount}
			visibleCount={unanimousStats.visibleCount}
			totalMinutes={unanimousStats.totalMinutes}
			visibleMinutes={unanimousStats.visibleMinutes}
			{hasActiveFilters}
			onFilmClick={showDetails}
		/>
	{/if}

	<!-- Selected Section -->
	<FilmSection
		title="Selected (≥65%)"
		description="Films with strong curator support (65%+ approval)"
		films={selectedWithVisibility}
		{viewMode}
		totalCount={selectedStats.totalCount}
		visibleCount={selectedStats.visibleCount}
		totalMinutes={selectedStats.totalMinutes}
		visibleMinutes={selectedStats.visibleMinutes}
		{hasActiveFilters}
		onFilmClick={showDetails}
		emptyMessage="No selected films yet."
	/>

	<!-- Maybe Section -->
	<FilmSection
		title="Maybe (35-65%)"
		description="Films under consideration for final selection"
		films={maybeWithVisibility}
		{viewMode}
		totalCount={maybeStats.totalCount}
		visibleCount={maybeStats.visibleCount}
		totalMinutes={maybeStats.totalMinutes}
		visibleMinutes={maybeStats.visibleMinutes}
		{hasActiveFilters}
		onFilmClick={showDetails}
		emptyMessage="No maybe films yet."
	/>
</div>

<!-- Video Detail Dialog -->
<FilmDetailDialog film={detailVideo} onClose={closeDetails} />

<style>
	:global(body) {
		background-color: var(--color-gallery-50);
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	/* Smooth details animation */
	details summary {
		user-select: none;
	}

	details[open] summary ~ * {
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
