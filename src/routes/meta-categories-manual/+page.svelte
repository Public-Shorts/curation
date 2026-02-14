<script lang="ts">
	import type { LayoutData } from './$types';
	import FilmSection from '$lib/components/films/FilmSection.svelte';
	import FilmDetailDialog from '$lib/components/films/FilmDetailDialog.svelte';
	import FilmCardCompact from '$lib/components/films/FilmCardCompact.svelte';
	import FilmCardGrid from '$lib/components/films/FilmCardGrid.svelte';
	import DraggableSelectionCard from '$lib/components/screenings/DraggableSelectionCard.svelte';
	import SelectionFilters from '$lib/components/films/SelectionFilters.svelte';
	import { addVisibilityToFilms, calculateSectionStats } from '$lib/utils/selectionStats';
	import { ChevronDown, ChevronRight, LayoutGrid, List } from 'lucide-svelte';

	let { data } = $props<{ data: LayoutData }>();

	let viewMode = $state<'grid' | 'compact'>('grid');
	let selectedFilm = $state<any | null>(null);
	let draggingFilmId = $state<string | null>(null);
	let dragOverMetaCategoryId = $state<string | null>(null);

	// Filters
	let selectedClusters = $state<Set<string>>(new Set());
	let selectedTags = $state<Set<string>>(new Set());

	import { onMount } from 'svelte';

	// Collapse state for each section
	let collapsedSections = $state<Record<string, boolean>>({
		highlights: true,
		unanimous: true,
		selected: true,
		maybes: true
	});

	let collapsedMetaCategories = $state<Record<string, boolean>>({});

	const STORAGE_KEY_SECTIONS = 'meta_categories_manual_sections_collapsed';
	const STORAGE_KEY_META_CATEGORIES = 'meta_categories_manual_collapsed';

	onMount(() => {
		try {
			const savedSections = localStorage.getItem(STORAGE_KEY_SECTIONS);
			if (savedSections) {
				collapsedSections = { ...collapsedSections, ...JSON.parse(savedSections) };
			}
			const savedMetaCategories = localStorage.getItem(STORAGE_KEY_META_CATEGORIES);
			if (savedMetaCategories) {
				collapsedMetaCategories = JSON.parse(savedMetaCategories);
			}
		} catch (e) {
			console.error('Failed to load collapse state', e);
		}
	});

	// Map films to their clusters (same logic as /selection)
	let filmToClusterMap = $derived.by(() => {
		const map = new Map<string, string[]>();
		data.clusters.forEach((cluster: any) => {
			const allMovieIds = [
				...(cluster.highlightedMovieIds || []),
				...(cluster.relevantMovieIds || [])
			];
			allMovieIds.forEach((id: string) => {
				if (!map.has(id)) map.set(id, []);
				map.get(id)!.push(cluster.name);
			});
		});
		return map;
	});

	function prepareFilm(film: any) {
		const submission = data.submissions.find((s: any) => s._id === film._id);
		const filmClusters = filmToClusterMap.get(film._id) || [];
		return {
			...film,
			...submission,
			title: submission?.englishTitle || film.title,
			director: submission?.directorName || film.director,
			tags: submission?.curatorTags || film.tags || [],
			clusters: filmClusters,
			isVisible: true
		};
	}

	let allSubmissions = $derived(
		data.submissions.map((s: any) => ({
			...s,
			title: s.englishTitle,
			tags: s.curatorTags
		}))
	);

	// Available tags from unassigned films for filtering
	let availableTags = $derived.by(() => {
		const tagMap = new Map<string, number>();
		allSubmissions.forEach((film: any) => {
			if (film.assignedMetaCategories.length === 0) {
				(film.tags || []).forEach((tag: string) => {
					tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
				});
			}
		});
		return Array.from(tagMap.entries())
			.filter(([_, count]) => count >= 2)
			.sort((a, b) => b[1] - a[1])
			.map(([tag, count]) => ({ label: tag, count }));
	});

	// Filter Logic
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

	// Prepare lists - only show films not assigned to any manual meta-category
	let highlights = $derived(
		data.selectionData.highlights
			.filter((f: any) => {
				const submission = data.submissions.find((s: any) => s._id === f._id);
				return submission && submission.assignedMetaCategories.length === 0;
			})
			.map(prepareFilm)
	);

	let unanimous = $derived(
		data.selectionData.unanimous
			.filter((f: any) => {
				const submission = data.submissions.find((s: any) => s._id === f._id);
				return submission && submission.assignedMetaCategories.length === 0;
			})
			.filter((f: any) => !highlights.some((h: any) => h._id === f._id))
			.map(prepareFilm)
	);

	let selected = $derived(
		data.selectionData.selected
			.filter((f: any) => {
				const submission = data.submissions.find((s: any) => s._id === f._id);
				return submission && submission.assignedMetaCategories.length === 0;
			})
			.filter(
				(f: any) =>
					!highlights.some((h: any) => h._id === f._id) &&
					!unanimous.some((u: any) => u._id === f._id)
			)
			.map(prepareFilm)
	);

	let maybes = $derived(
		data.selectionData.maybe
			.filter((f: any) => {
				const submission = data.submissions.find((s: any) => s._id === f._id);
				return submission && submission.assignedMetaCategories.length === 0;
			})
			.filter(
				(f: any) =>
					!highlights.some((h: any) => h._id === f._id) &&
					!unanimous.some((u: any) => u._id === f._id) &&
					!selected.some((s: any) => s._id === f._id)
			)
			.map(prepareFilm)
	);

	// Apply visibility
	let highlightsWithVisibility = $derived(addVisibilityToFilms(highlights, filmMatchesFilters));
	let unanimousWithVisibility = $derived(addVisibilityToFilms(unanimous, filmMatchesFilters));
	let selectedWithVisibility = $derived(addVisibilityToFilms(selected, filmMatchesFilters));
	let maybesWithVisibility = $derived(addVisibilityToFilms(maybes, filmMatchesFilters));

	// Calculate stats
	let highlightsStats = $derived(calculateSectionStats(highlightsWithVisibility));
	let unanimousStats = $derived(calculateSectionStats(unanimousWithVisibility));
	let selectedStats = $derived(calculateSectionStats(selectedWithVisibility));
	let maybesStats = $derived(calculateSectionStats(maybesWithVisibility));

	function getMetaCategoryFilms(metaCategoryId: string) {
		const metaCategory = data.metaCategories.find((mc: any) => mc._id === metaCategoryId);
		if (!metaCategory?.films) return [];

		return metaCategory.films
			.map((film: any) => {
				const submission = data.submissions.find((s: any) => s._id === film._id);
				if (!submission) return null;
				return {
					...submission,
					title: submission.englishTitle,
					director: submission.directorName,
					tags: submission.curatorTags || [],
					isVisible: true
				};
			})
			.filter(Boolean);
	}

	// Drag and Drop
	function handleDragStart(event: DragEvent, filmId: string) {
		draggingFilmId = filmId;
		event.dataTransfer!.effectAllowed = 'move';
		event.dataTransfer!.setData('text/plain', filmId);
	}

	function handleDragEnd() {
		draggingFilmId = null;
		dragOverMetaCategoryId = null;
	}

	function handleDragOver(event: DragEvent, metaCategoryId: string) {
		event.preventDefault();
		dragOverMetaCategoryId = metaCategoryId;
		event.dataTransfer!.dropEffect = 'move';
	}

	function handleDragLeave(metaCategoryId: string) {
		if (dragOverMetaCategoryId === metaCategoryId) {
			dragOverMetaCategoryId = null;
		}
	}

	async function handleDrop(event: DragEvent, metaCategoryId: string) {
		event.preventDefault();
		const filmId = event.dataTransfer!.getData('text/plain');
		if (filmId) {
			await assignFilmToMetaCategory(filmId, metaCategoryId);
		}
		draggingFilmId = null;
		dragOverMetaCategoryId = null;
	}

	// Actions
	async function assignFilmToMetaCategory(filmId: string, metaCategoryId: string) {
		try {
			const res = await fetch('/api/meta-categories-manual', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'assign-film', filmId, metaCategoryId })
			});
			const result = await res.json();
			if (result.success) window.location.reload();
		} catch (e) {
			console.error('Failed to assign film:', e);
			alert('Failed to assign film');
		}
	}

	async function unassignFilm(filmId: string, metaCategoryId: string) {
		try {
			const res = await fetch('/api/meta-categories-manual', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'unassign-film',
					filmId,
					metaCategoryId
				})
			});
			const result = await res.json();
			if (result.success) window.location.reload();
		} catch (e) {
			console.error('Failed to unassign film:', e);
			alert('Failed to remove film from meta-category');
		}
	}

	function openFilmDetail(film: any) {
		selectedFilm = film;
	}

	function closeFilmDetail() {
		selectedFilm = null;
	}

	function toggleSection(section: string) {
		collapsedSections[section] = !collapsedSections[section];
		localStorage.setItem(STORAGE_KEY_SECTIONS, JSON.stringify(collapsedSections));
	}

	function toggleMetaCategory(metaCategoryId: string) {
		collapsedMetaCategories[metaCategoryId] = !collapsedMetaCategories[metaCategoryId];
		localStorage.setItem(STORAGE_KEY_META_CATEGORIES, JSON.stringify(collapsedMetaCategories));
	}
</script>

{#snippet draggableCard(film: any)}
	<DraggableSelectionCard filmId={film._id} ondragstart={handleDragStart} ondragend={handleDragEnd}>
		{#if viewMode === 'compact'}
			<FilmCardCompact {film} onclick={() => openFilmDetail(film)} />
		{:else}
			<FilmCardGrid {film} onclick={() => openFilmDetail(film)} />
		{/if}
	</DraggableSelectionCard>
{/snippet}

<div class="min-h-screen bg-gallery-50">
	<!-- Two Column Layout -->
	<div class="grid grid-cols-5 gap-6 p-6">
		<!-- Left: Unassigned Films (60% = 3 cols) -->
		<div class="col-span-3 space-y-6 overflow-y-auto max-h-screen pb-20">
			<!-- Filters & Controls -->
			<section class="flex flex-wrap items-center justify-between gap-4">
				<SelectionFilters
					availableClusters={data.clusters.map((c: any) => ({ label: c.name, id: c.id }))}
					{availableTags}
					bind:selectedClusters
					bind:selectedTags
					onClear={() => {
						selectedClusters = new Set();
						selectedTags = new Set();
					}}
				/>

				<div
					class="flex items-center gap-1 bg-gallery-100 p-1 rounded-lg border border-gallery-200"
				>
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

			<!-- Highlights -->
			<FilmSection
				title="★ Highlights"
				description="Top picks from curators"
				films={highlightsWithVisibility}
				{viewMode}
				totalCount={highlightsStats.totalCount}
				visibleCount={highlightsStats.visibleCount}
				totalMinutes={highlightsStats.totalMinutes}
				visibleMinutes={highlightsStats.visibleMinutes}
				hasActiveFilters={selectedClusters.size > 0 || selectedTags.size > 0}
				onFilmClick={openFilmDetail}
				cardSnippet={draggableCard}
				emptyMessage="No unassigned highlights."
				open={!collapsedSections.highlights}
			/>

			<!-- Unanimous -->
			<FilmSection
				title="100% Approval"
				description="Unanimously selected films"
				films={unanimousWithVisibility}
				{viewMode}
				totalCount={unanimousStats.totalCount}
				visibleCount={unanimousStats.visibleCount}
				totalMinutes={unanimousStats.totalMinutes}
				visibleMinutes={unanimousStats.visibleMinutes}
				hasActiveFilters={selectedClusters.size > 0 || selectedTags.size > 0}
				onFilmClick={openFilmDetail}
				cardSnippet={draggableCard}
				emptyMessage="No unassigned unanimous films."
				open={!collapsedSections.unanimous}
			/>

			<!-- Selected -->
			<FilmSection
				title={`Selected (≥${data.settings.selectedThreshold}%)`}
				description="Films meeting the selection threshold"
				films={selectedWithVisibility}
				{viewMode}
				totalCount={selectedStats.totalCount}
				visibleCount={selectedStats.visibleCount}
				totalMinutes={selectedStats.totalMinutes}
				visibleMinutes={selectedStats.visibleMinutes}
				hasActiveFilters={selectedClusters.size > 0 || selectedTags.size > 0}
				onFilmClick={openFilmDetail}
				cardSnippet={draggableCard}
				emptyMessage="No unassigned selected films."
				open={!collapsedSections.selected}
			/>

			<!-- Maybes -->
			<FilmSection
				title={`Maybes (${data.settings.maybeThreshold}-${data.settings.selectedThreshold - 1}%)`}
				description="Films in the consideration range"
				films={maybesWithVisibility}
				{viewMode}
				totalCount={maybesStats.totalCount}
				visibleCount={maybesStats.visibleCount}
				totalMinutes={maybesStats.totalMinutes}
				visibleMinutes={maybesStats.visibleMinutes}
				hasActiveFilters={selectedClusters.size > 0 || selectedTags.size > 0}
				onFilmClick={openFilmDetail}
				cardSnippet={draggableCard}
				emptyMessage="No unassigned maybe films."
				open={!collapsedSections.maybes}
			/>
		</div>

		<!-- Right: Meta-Categories (40% = 2 cols) -->
		<div class="col-span-2 space-y-4 overflow-y-auto max-h-screen pb-20">
			{#each data.metaCategories as metaCategory (metaCategory._id)}
				{@const films = getMetaCategoryFilms(metaCategory._id)}
				<div class="bg-white rounded-lg border border-gallery-200 shadow-sm">
					<div
						class="px-4 py-3 flex items-center justify-between hover:bg-gallery-50 transition-colors border-b border-gallery-100"
					>
						<button
							onclick={() => toggleMetaCategory(metaCategory._id)}
							class="flex items-center gap-2 flex-1 min-w-0 text-left"
						>
							{#if collapsedMetaCategories[metaCategory._id]}
								<ChevronRight class="w-4 h-4 text-gallery-500 shrink-0" />
							{:else}
								<ChevronDown class="w-4 h-4 text-gallery-500 shrink-0" />
							{/if}
							<div class="flex-1 min-w-0">
								<h2 class="font-semibold text-gallery-900 truncate text-lg">{metaCategory.name}</h2>
								<div class="flex flex-wrap gap-2 text-xs text-gallery-500 mt-0.5">
									<span>{films.length} films</span>
									<span>•</span>
									<span
										>{films.reduce((acc: number, f: any) => acc + (f.length || 0), 0)}m total</span
									>
								</div>
								{#if metaCategory.description}
									<p class="text-xs text-gallery-600 mt-1 line-clamp-2">{metaCategory.description}</p>
								{/if}
							</div>
						</button>
					</div>
					{#if !collapsedMetaCategories[metaCategory._id]}
						<div
							ondragover={(e) => handleDragOver(e, metaCategory._id)}
							ondragleave={() => handleDragLeave(metaCategory._id)}
							ondrop={(e) => handleDrop(e, metaCategory._id)}
							class="p-4 pt-4 min-h-32 transition-colors bg-gallery-50/50"
							class:bg-accent-50={dragOverMetaCategoryId === metaCategory._id}
							class:border-2={dragOverMetaCategoryId === metaCategory._id}
							class:border-accent-500={dragOverMetaCategoryId === metaCategory._id}
							class:border-dashed={dragOverMetaCategoryId === metaCategory._id}
						>
							{#if films.length === 0}
								<div
									class="h-full flex items-center justify-center text-gallery-400 text-sm italic"
								>
									Drag films here to assign
								</div>
							{:else}
								<div class="space-y-2">
									{#each films as film}
										<FilmCardCompact
											{film}
											onclick={() => openFilmDetail(film)}
											onRemove={() => unassignFilm(film._id, metaCategory._id)}
										/>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

{#if selectedFilm}
	<FilmDetailDialog film={selectedFilm} onClose={closeFilmDetail} />
{/if}
