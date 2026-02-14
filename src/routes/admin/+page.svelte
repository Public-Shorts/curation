<script lang="ts">
	import FilmSection from '$lib/components/selection/FilmSection.svelte';
	import FilmDetailDialog from '$lib/components/selection/FilmDetailDialog.svelte';
	import FilmCardCompact from '$lib/components/selection/FilmCardCompact.svelte';
	import FilmCardGrid from '$lib/components/selection/FilmCardGrid.svelte';
	import DraggableSelectionCard from '$lib/components/screenings/DraggableSelectionCard.svelte';
	import SelectionFilters from '$lib/components/selection/SelectionFilters.svelte';
	import {addVisibilityToFilms, calculateSectionStats} from '$lib/utils/selectionStats';
	import {ChevronDown, ChevronRight, LayoutGrid, List, Lock} from 'lucide-svelte';
	import {invalidateAll} from '$app/navigation';
	import {onMount} from 'svelte';
	import {page} from '$app/stores';

	let {data} = $props();

	// Tab state
	let activeTab = $state<'meta-categories' | 'vetoed'>('meta-categories');

	onMount(() => {
		const urlTab = $page.url.searchParams.get('tab');
		if (urlTab === 'vetoed') activeTab = 'vetoed';
	});

	// ─── Manual Meta-Categories State ───

	let viewMode = $state<'grid' | 'compact'>('grid');
	let selectedFilm = $state<any | null>(null);
	let draggingFilmId = $state<string | null>(null);
	let dragOverMetaCategoryId = $state<string | null>(null);

	let selectedClusters = $state<Set<string>>(new Set());
	let selectedTags = $state<Set<string>>(new Set());

	let collapsedSections = $state<Record<string, boolean>>({
		highlights: true,
		unanimous: true,
		selected: true,
		maybes: true,
	});

	let collapsedMetaCategories = $state<Record<string, boolean>>({});

	const STORAGE_KEY_SECTIONS = 'admin_sections_collapsed';
	const STORAGE_KEY_META_CATEGORIES = 'admin_meta_categories_collapsed';

	onMount(() => {
		try {
			const savedSections = localStorage.getItem(STORAGE_KEY_SECTIONS);
			if (savedSections) {
				collapsedSections = {...collapsedSections, ...JSON.parse(savedSections)};
			}
			const savedMetaCategories = localStorage.getItem(STORAGE_KEY_META_CATEGORIES);
			if (savedMetaCategories) {
				collapsedMetaCategories = JSON.parse(savedMetaCategories);
			}
		} catch (e) {
			console.error('Failed to load collapse state', e);
		}
	});

	let filmToClusterMap = $derived.by(() => {
		const map = new Map<string, string[]>();
		data.clusters.forEach((cluster: any) => {
			const allMovieIds = [
				...(cluster.highlightedMovieIds || []),
				...(cluster.relevantMovieIds || []),
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
			isVisible: true,
		};
	}

	let availableTags = $derived.by(() => {
		const tagMap = new Map<string, number>();
		data.submissions.forEach((film: any) => {
			if (film.assignedMetaCategories.length === 0) {
				(film.curatorTags || []).forEach((tag: string) => {
					tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
				});
			}
		});
		return Array.from(tagMap.entries())
			.filter(([_, count]) => count >= 2)
			.sort((a, b) => b[1] - a[1])
			.map(([tag, count]) => ({label: tag, count}));
	});

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

	let highlightsWithVisibility = $derived(addVisibilityToFilms(highlights, filmMatchesFilters));
	let unanimousWithVisibility = $derived(addVisibilityToFilms(unanimous, filmMatchesFilters));
	let selectedWithVisibility = $derived(addVisibilityToFilms(selected, filmMatchesFilters));
	let maybesWithVisibility = $derived(addVisibilityToFilms(maybes, filmMatchesFilters));

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
					isVisible: true,
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

	async function assignFilmToMetaCategory(filmId: string, metaCategoryId: string) {
		try {
			const res = await fetch('/api/meta-categories-manual', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({action: 'assign-film', filmId, metaCategoryId}),
			});
			const result = await res.json();
			if (result.success) window.location.reload();
			else if (result.error) alert(result.error);
		} catch (e) {
			console.error('Failed to assign film:', e);
			alert('Failed to assign film');
		}
	}

	async function unassignFilm(filmId: string, metaCategoryId: string) {
		try {
			const res = await fetch('/api/meta-categories-manual', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({action: 'unassign-film', filmId, metaCategoryId}),
			});
			const result = await res.json();
			if (result.success) window.location.reload();
			else if (result.error) alert(result.error);
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
		localStorage.setItem(
			STORAGE_KEY_META_CATEGORIES,
			JSON.stringify(collapsedMetaCategories)
		);
	}

	// ─── Vetoed Submissions State ───

	let vetoFilterType = $state<'all' | 'cinema' | 'tv' | 'both'>('all');
	let editDialogOpen = $state(false);
	let removeDialogOpen = $state(false);
	let selectedVeto = $state<any>(null);
	let editFromCinema = $state(false);
	let editFromTV = $state(false);
	let editReason = $state('');
	let vetoLoading = $state(false);
	let vetoError = $state('');

	let filteredVetoes = $derived.by(() => {
		if (vetoFilterType === 'all') return data.vetoedSubmissions;
		if (vetoFilterType === 'cinema')
			return data.vetoedSubmissions.filter(
				(v: any) => v.vetoedFromCinema && !v.vetoedFromTV
			);
		if (vetoFilterType === 'tv')
			return data.vetoedSubmissions.filter(
				(v: any) => v.vetoedFromTV && !v.vetoedFromCinema
			);
		if (vetoFilterType === 'both')
			return data.vetoedSubmissions.filter(
				(v: any) => v.vetoedFromCinema && v.vetoedFromTV
			);
		return data.vetoedSubmissions;
	});

	function openEditDialog(veto: any) {
		selectedVeto = veto;
		editFromCinema = veto.vetoedFromCinema;
		editFromTV = veto.vetoedFromTV;
		editReason = veto.reason;
		vetoError = '';
		editDialogOpen = true;
	}

	function openRemoveDialog(veto: any) {
		selectedVeto = veto;
		vetoError = '';
		removeDialogOpen = true;
	}

	function closeDialogs() {
		editDialogOpen = false;
		removeDialogOpen = false;
		selectedVeto = null;
		vetoError = '';
	}

	async function submitEdit() {
		if (!editFromCinema && !editFromTV) {
			vetoError = 'Must veto from at least cinema or TV';
			return;
		}
		if (!editReason || editReason.trim().length < 5) {
			vetoError = 'Reason must be at least 5 characters';
			return;
		}

		vetoLoading = true;
		vetoError = '';

		try {
			const response = await fetch('/api/veto', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					submissionId: selectedVeto.submission._id,
					reason: editReason,
					vetoedFromCinema: editFromCinema,
					vetoedFromTV: editFromTV,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				vetoError = data.error || 'Failed to update veto';
				vetoLoading = false;
				return;
			}

			closeDialogs();
			await invalidateAll();
		} catch (err) {
			vetoError = 'Failed to update veto';
			vetoLoading = false;
		}
	}

	async function submitRemove() {
		vetoLoading = true;
		vetoError = '';

		try {
			const response = await fetch('/api/veto', {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({submissionId: selectedVeto.submission._id}),
			});

			if (!response.ok) {
				const data = await response.json();
				vetoError = data.error || 'Failed to remove veto';
				vetoLoading = false;
				return;
			}

			closeDialogs();
			await invalidateAll();
		} catch (err) {
			vetoError = 'Failed to remove veto';
			vetoLoading = false;
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

{#snippet draggableCard(film: any)}
	<DraggableSelectionCard
		filmId={film._id}
		ondragstart={handleDragStart}
		ondragend={handleDragEnd}
	>
		{#if viewMode === 'compact'}
			<FilmCardCompact {film} onclick={() => openFilmDetail(film)} />
		{:else}
			<FilmCardGrid {film} onclick={() => openFilmDetail(film)} />
		{/if}
	</DraggableSelectionCard>
{/snippet}

<div class="w-full px-6 py-6">
	<!-- Header -->
	<header class="mb-6">
		<h1 class="text-3xl font-bold mb-1">Admin</h1>
		<p class="text-gallery-600 text-sm">Manual meta-category management and veto controls</p>
	</header>

	<!-- Tabs -->
	<div class="flex gap-1 mb-6 bg-gallery-50 p-1 rounded-lg border border-gallery-100 w-fit">
		<button
			onclick={() => (activeTab = 'meta-categories')}
			class="px-4 py-2 rounded-md text-sm font-semibold transition-all {activeTab ===
			'meta-categories'
				? 'bg-white shadow-sm text-gallery-900'
				: 'text-gallery-600 hover:bg-white/50'}"
		>
			Manual Meta-Categories
		</button>
		<button
			onclick={() => (activeTab = 'vetoed')}
			class="px-4 py-2 rounded-md text-sm font-semibold transition-all {activeTab === 'vetoed'
				? 'bg-white shadow-sm text-gallery-900'
				: 'text-gallery-600 hover:bg-white/50'}"
		>
			Vetoed Submissions ({data.vetoedSubmissions.length})
		</button>
	</div>

	<!-- Tab Content -->
	{#if activeTab === 'meta-categories'}
		<!-- Manual Meta-Categories Tab -->
		<div class="grid grid-cols-5 gap-6">
			<!-- Left: Unassigned Films (60% = 3 cols) -->
			<div class="col-span-3 space-y-6 overflow-y-auto max-h-screen pb-20">
				<section class="flex flex-wrap items-center justify-between gap-4">
					<SelectionFilters
						availableClusters={data.clusters.map((c: any) => ({label: c.name, id: c.id}))}
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
					{@const isLocked = metaCategory.locked}
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
									<div class="flex items-center gap-2">
										<h2 class="font-semibold text-gallery-900 truncate text-lg">
											{metaCategory.name}
										</h2>
										{#if isLocked}
											<Lock class="w-4 h-4 text-amber-500 shrink-0" />
										{/if}
									</div>
									<div class="flex flex-wrap gap-2 text-xs text-gallery-500 mt-0.5">
										<span>{films.length} films</span>
										<span>•</span>
										<span
											>{films.reduce(
												(acc: number, f: any) => acc + (f.length || 0),
												0
											)}m total</span
										>
									</div>
									{#if metaCategory.description}
										<p class="text-xs text-gallery-600 mt-1 line-clamp-2">
											{metaCategory.description}
										</p>
									{/if}
									{#if metaCategory.tags && metaCategory.tags.length > 0}
										<div class="flex flex-wrap gap-1 mt-1.5">
											{#each metaCategory.tags as tag}
												<span
													class="text-[10px] px-1.5 py-0.5 bg-gallery-100 text-gallery-600 rounded-full"
												>
													{tag}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							</button>
						</div>
						{#if !collapsedMetaCategories[metaCategory._id]}
							{#if isLocked}
								<!-- Locked state: show films but no drop zone -->
								<div class="p-4 bg-gallery-50/50">
									{#if metaCategory.summary}
										<p class="text-xs text-gallery-600 italic mb-3">
											{metaCategory.summary}
										</p>
									{/if}
									{#if films.length === 0}
										<div
											class="h-full flex items-center justify-center text-gallery-400 text-sm italic py-8"
										>
											No films assigned
										</div>
									{:else}
										<div class="space-y-2">
											{#each films as film}
												<FilmCardCompact
													{film}
													onclick={() => openFilmDetail(film)}
												/>
											{/each}
										</div>
									{/if}
								</div>
							{:else}
								<!-- Unlocked: drop zone + remove buttons -->
								<div
									ondragover={(e) => handleDragOver(e, metaCategory._id)}
									ondragleave={() => handleDragLeave(metaCategory._id)}
									ondrop={(e) => handleDrop(e, metaCategory._id)}
									class="p-4 pt-4 min-h-32 transition-colors bg-gallery-50/50"
									class:bg-accent-50={dragOverMetaCategoryId === metaCategory._id}
									class:border-2={dragOverMetaCategoryId === metaCategory._id}
									class:border-accent-500={dragOverMetaCategoryId ===
										metaCategory._id}
									class:border-dashed={dragOverMetaCategoryId === metaCategory._id}
								>
									{#if metaCategory.summary}
										<p class="text-xs text-gallery-600 italic mb-3">
											{metaCategory.summary}
										</p>
									{/if}
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
													onRemove={() =>
														unassignFilm(film._id, metaCategory._id)}
												/>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<!-- Vetoed Submissions Tab -->
		<div class="max-w-7xl space-y-8">
			{#if data.vetoedSubmissions.length > 0}
				<div class="flex gap-2">
					<button
						onclick={() => (vetoFilterType = 'all')}
						class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {vetoFilterType ===
						'all'
							? 'bg-gallery-900 text-white'
							: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
					>
						All ({data.vetoedSubmissions.length})
					</button>
					<button
						onclick={() => (vetoFilterType = 'cinema')}
						class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {vetoFilterType ===
						'cinema'
							? 'bg-gallery-900 text-white'
							: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
					>
						Cinema Only
					</button>
					<button
						onclick={() => (vetoFilterType = 'tv')}
						class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {vetoFilterType ===
						'tv'
							? 'bg-gallery-900 text-white'
							: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
					>
						TV Only
					</button>
					<button
						onclick={() => (vetoFilterType = 'both')}
						class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {vetoFilterType ===
						'both'
							? 'bg-gallery-900 text-white'
							: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
					>
						Both
					</button>
				</div>
			{/if}

			<div class="space-y-4">
				{#if filteredVetoes.length === 0}
					<div class="rounded-lg bg-gallery-50 p-12 text-center">
						<p class="text-gallery-500">
							{#if vetoFilterType !== 'all'}
								No submissions match this filter.
							{:else}
								No vetoed submissions yet.
							{/if}
						</p>
					</div>
				{:else}
					{#each filteredVetoes as veto}
						<div class="bg-white rounded-lg border border-gallery-200 p-4 shadow-sm">
							<div class="flex gap-4">
								<div
									class="h-24 w-32 rounded bg-gallery-100 flex-shrink-0 overflow-hidden"
								>
									{#if veto.submission.poster?.asset}
										<img
											src={`${veto.submission.poster.asset.url}?w=200&h=150&fit=crop`}
											alt={veto.submission.englishTitle}
											class="h-full w-full object-cover"
										/>
									{:else if veto.submission.screenshots?.[0]?.asset}
										<img
											src={`${veto.submission.screenshots[0].asset.url}?w=200&h=150&fit=crop`}
											alt={veto.submission.englishTitle}
											class="h-full w-full object-cover"
										/>
									{:else}
										<div
											class="h-full w-full flex items-center justify-center text-2xl"
										>
											🎬
										</div>
									{/if}
								</div>

								<div class="flex-1 min-w-0 space-y-2">
									<div>
										<h3 class="font-bold text-lg text-gallery-900">
											{veto.submission.englishTitle}
										</h3>
										<p class="text-sm text-gallery-600">
											{veto.submission.directorName}
											{#if veto.submission.length}
												<span class="text-gallery-300 mx-1.5">•</span>
												<span>{veto.submission.length} min</span>
											{/if}
											{#if veto.submission.categories?.length > 0}
												<span class="text-gallery-300 mx-1.5">•</span>
												<span
													>{veto.submission.categories.join(', ')}</span
												>
											{/if}
										</p>
									</div>

									<div class="flex gap-2">
										{#if veto.vetoedFromCinema}
											<span
												class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full border border-purple-200"
											>
												<span>🎬</span>
												Cinema
											</span>
										{/if}
										{#if veto.vetoedFromTV}
											<span
												class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200"
											>
												<span>📺</span>
												TV
											</span>
										{/if}
									</div>

									<div class="text-sm">
										<span class="font-medium text-gallery-700">Reason:</span>
										<span class="text-gallery-600">{veto.reason}</span>
									</div>

									<div class="text-xs text-gallery-500">
										Vetoed by {veto.vetoedBy?.name || 'Unknown'} on {formatDate(
											veto.vetoedAt
										)}
									</div>
								</div>

								<div class="flex flex-col gap-2 justify-center">
									<button
										onclick={() => openEditDialog(veto)}
										class="px-3 py-1.5 text-xs font-medium text-gallery-700 bg-gallery-100 hover:bg-gallery-200 rounded-lg transition-colors"
									>
										Edit Veto
									</button>
									<button
										onclick={() => openRemoveDialog(veto)}
										class="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
									>
										Remove Veto
									</button>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if selectedFilm}
	<FilmDetailDialog film={selectedFilm} onClose={closeFilmDetail} />
{/if}

<!-- Edit Veto Dialog -->
{#if editDialogOpen && selectedVeto}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/50" onclick={closeDialogs}></div>

		<div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
			<h2 class="text-xl font-bold mb-1">Edit Veto</h2>
			<p class="text-sm text-gallery-600 mb-4">{selectedVeto.submission.englishTitle}</p>

			<div class="mb-4">
				<p class="text-sm font-medium mb-2">Select contexts to veto from:</p>
				<div class="space-y-2">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={editFromCinema}
							class="w-4 h-4 rounded border-gallery-300"
						/>
						<span class="text-sm">Cinema Screenings</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={editFromTV}
							class="w-4 h-4 rounded border-gallery-300"
						/>
						<span class="text-sm">TV Display</span>
					</label>
				</div>
			</div>

			<div class="mb-4">
				<label class="block text-sm font-medium mb-2">Reason (required)</label>
				<textarea
					bind:value={editReason}
					class="w-full px-3 py-2 border border-gallery-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gallery-900 resize-none"
					rows="3"
				></textarea>
			</div>

			{#if vetoError}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p class="text-sm text-red-600">{vetoError}</p>
				</div>
			{/if}

			<div class="flex gap-3 justify-end">
				<button
					onclick={closeDialogs}
					class="px-4 py-2 text-sm font-medium text-gallery-700 hover:text-gallery-900 transition-colors"
					disabled={vetoLoading}
				>
					Cancel
				</button>
				<button
					onclick={submitEdit}
					class="px-4 py-2 text-sm font-medium text-white bg-gallery-900 hover:bg-black rounded-lg transition-colors disabled:opacity-50"
					disabled={vetoLoading}
				>
					{vetoLoading ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Remove Veto Dialog -->
{#if removeDialogOpen && selectedVeto}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/50" onclick={closeDialogs}></div>

		<div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
			<h2 class="text-xl font-bold mb-1">Remove Veto</h2>
			<p class="text-sm text-gallery-600 mb-4">
				Are you sure you want to remove the veto from "{selectedVeto.submission
					.englishTitle}"? This will allow it to appear in highlights again.
			</p>

			{#if vetoError}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p class="text-sm text-red-600">{vetoError}</p>
				</div>
			{/if}

			<div class="flex gap-3 justify-end">
				<button
					onclick={closeDialogs}
					class="px-4 py-2 text-sm font-medium text-gallery-700 hover:text-gallery-900 transition-colors"
					disabled={vetoLoading}
				>
					Cancel
				</button>
				<button
					onclick={submitRemove}
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
					disabled={vetoLoading}
				>
					{vetoLoading ? 'Removing...' : 'Remove Veto'}
				</button>
			</div>
		</div>
	</div>
{/if}
