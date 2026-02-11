<script lang="ts">
	import type { LayoutData } from './$types';
	import FilmSection from '$lib/components/selection/FilmSection.svelte';
	import ScreeningDropZone from '$lib/components/screenings/ScreeningDropZone.svelte';
	import FilmDetailDialog from '$lib/components/selection/FilmDetailDialog.svelte';
	import FilmCardCompact from '$lib/components/selection/FilmCardCompact.svelte';
	import FilmCardGrid from '$lib/components/selection/FilmCardGrid.svelte';
	import DraggableSelectionCard from '$lib/components/screenings/DraggableSelectionCard.svelte';
	import JurySelector from '$lib/components/screenings/JurySelector.svelte';
	import SelectionFilters from '$lib/components/selection/SelectionFilters.svelte';
	import { addVisibilityToFilms, calculateSectionStats } from '$lib/utils/selectionStats';
	import { ChevronDown, ChevronRight, X, LayoutGrid, List, Users } from 'lucide-svelte';

	let { data } = $props<{ data: LayoutData }>();

	let viewMode = $state<'grid' | 'compact'>('grid');
	let selectedFilm = $state<any | null>(null);
	let draggingFilmId = $state<string | null>(null);
	let dragOverScreeningId = $state<string | null>(null);

	// Filters
	let selectedClusters = $state<Set<string>>(new Set());
	let selectedTags = $state<Set<string>>(new Set());

	// Edit State
	let showEditModal = $state(false);
	let editingScreening = $state<any | null>(null);
	let editTitle = $state('');
	let editDate = $state('');
	let editLocation = $state('');
	let editJuryIds = $state<string[]>([]);

	import { onMount } from 'svelte';

	// Collapse state for each section
	let collapsedSections = $state<Record<string, boolean>>({
		highlights: true,
		unanimous: true,
		selected: true,
		maybes: true
	});

	let collapsedScreenings = $state<Record<string, boolean>>({});

	const STORAGE_KEY_SECTIONS = 'screenings_maker_sections_collapsed';
	const STORAGE_KEY_SCREENINGS = 'screenings_maker_screenings_collapsed';

	onMount(() => {
		try {
			const savedSections = localStorage.getItem(STORAGE_KEY_SECTIONS);
			if (savedSections) {
				collapsedSections = { ...collapsedSections, ...JSON.parse(savedSections) };
			}
			const savedScreenings = localStorage.getItem(STORAGE_KEY_SCREENINGS);
			if (savedScreenings) {
				collapsedScreenings = JSON.parse(savedScreenings);
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

	// Available tags from unassigned films for filtering (simplified source)
	let availableTags = $derived.by(() => {
		const tagMap = new Map<string, number>();
		allSubmissions.forEach((film: any) => {
			if (!film.assignedScreening) {
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

	// Prepare lists
	let highlights = $derived(
		data.selectionData.highlights
			.filter((f: any) => {
				const submission = data.submissions.find((s: any) => s._id === f._id);
				return submission && !submission.assignedScreening;
			})
			.map(prepareFilm)
	);

	let unanimous = $derived(
		data.selectionData.unanimous
			.filter((f: any) => {
				const submission = data.submissions.find((s: any) => s._id === f._id);
				return submission && !submission.assignedScreening;
			})
			.filter((f: any) => !highlights.some((h: any) => h._id === f._id))
			.map(prepareFilm)
	);

	let selected = $derived(
		data.selectionData.selected
			.filter((f: any) => {
				const submission = data.submissions.find((s: any) => s._id === f._id);
				return submission && !submission.assignedScreening;
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
				return submission && !submission.assignedScreening;
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

	function getScreeningFilms(screeningId: string) {
		return data.submissions
			.filter((s: any) => s.assignedScreening?._ref === screeningId)
			.map((s: any) => ({
				...s,
				title: s.englishTitle,
				director: s.directorName,
				tags: s.curatorTags || [],
				isVisible: true,
				score: s.score // Ensure score is passed if available
			}));
	}

	// Drag and Drop
	function handleDragStart(event: DragEvent, filmId: string) {
		draggingFilmId = filmId;
		event.dataTransfer!.effectAllowed = 'move';
		event.dataTransfer!.setData('text/plain', filmId);
	}

	function handleDragEnd() {
		draggingFilmId = null;
		dragOverScreeningId = null;
	}

	function handleDragOver(event: DragEvent, screeningId: string) {
		event.preventDefault();
		dragOverScreeningId = screeningId;
		event.dataTransfer!.dropEffect = 'move';
	}

	function handleDragLeave(screeningId: string) {
		if (dragOverScreeningId === screeningId) {
			dragOverScreeningId = null;
		}
	}

	async function handleDrop(event: DragEvent, screeningId: string) {
		event.preventDefault();
		const filmId = event.dataTransfer!.getData('text/plain');
		if (filmId) {
			await assignFilmToScreening(filmId, screeningId);
		}
		draggingFilmId = null;
		dragOverScreeningId = null;
	}

	// Actions
	async function assignFilmToScreening(filmId: string, screeningId: string) {
		try {
			const res = await fetch('/api/screenings-maker', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'assign-video', videoId: filmId, screeningId })
			});
			const result = await res.json();
			if (result.success) window.location.reload();
		} catch (e) {
			console.error('Failed to assign film:', e);
			alert('Failed to assign film');
		}
	}

	async function unassignFilm(filmId: string) {
		try {
			const res = await fetch('/api/screenings-maker', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'unassign-video',
					videoId: filmId
				})
			});
			const result = await res.json();
			if (result.success) window.location.reload();
		} catch (e) {
			console.error('Failed to unassign film:', e);
			alert('Failed to remove film from screening');
		}
	}

	function openEditModal(screening: any, event: Event) {
		event.stopPropagation();
		editingScreening = screening;
		editTitle = screening.title;
		editDate = screening.date ? new Date(screening.date).toISOString().slice(0, 16) : '';
		editLocation = screening.location || '';
		editJuryIds = screening.juryMembers?.map((j: any) => j._id) || [];
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editingScreening = null;
	}

	async function saveScreening() {
		if (!editingScreening) return;
		try {
			const res = await fetch('/api/screenings-maker', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'update-screening',
					id: editingScreening._id,
					title: editTitle,
					date: editDate ? new Date(editDate).toISOString() : editingScreening.date,
					location: editLocation,
					juryMembers: editJuryIds.map((id) => ({ _type: 'reference', _ref: id }))
				})
			});
			const result = await res.json();
			if (result.success) {
				window.location.reload();
			}
		} catch (e) {
			console.error('Failed to update screening:', e);
			alert('Failed to update screening');
		}
	}

	async function deleteScreening(screeningId: string, screeningTitle: string, event: Event) {
		event.stopPropagation();
		if (!confirm(`Delete screening "${screeningTitle}"? All assigned films will be unassigned.`))
			return;
		try {
			const res = await fetch('/api/screenings-maker', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'delete-screening', id: screeningId })
			});
			const result = await res.json();
			if (result.success) window.location.reload();
		} catch (e) {
			console.error('Failed to delete screening:', e);
			alert('Failed to delete screening');
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

	function toggleScreening(screeningId: string) {
		collapsedScreenings[screeningId] = !collapsedScreenings[screeningId];
		localStorage.setItem(STORAGE_KEY_SCREENINGS, JSON.stringify(collapsedScreenings));
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

		<!-- Right: Screenings (40% = 2 cols) -->
		<div class="col-span-2 space-y-4 overflow-y-auto max-h-screen pb-20">
			{#each data.screenings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) as screening (screening._id)}
				{@const films = getScreeningFilms(screening._id)}
				<div class="bg-white rounded-lg border border-gallery-200 shadow-sm">
					<div
						class="px-4 py-3 flex items-center justify-between hover:bg-gallery-50 transition-colors border-b border-gallery-100"
					>
						<button
							onclick={() => toggleScreening(screening._id)}
							class="flex items-center gap-2 flex-1 min-w-0 text-left"
						>
							{#if collapsedScreenings[screening._id]}
								<ChevronRight class="w-4 h-4 text-gallery-500 shrink-0" />
							{:else}
								<ChevronDown class="w-4 h-4 text-gallery-500 shrink-0" />
							{/if}
							<div class="flex-1 min-w-0">
								<h2 class="font-semibold text-gallery-900 truncate text-lg">{screening.title}</h2>
								<div class="flex flex-wrap gap-2 text-xs text-gallery-500 mt-0.5">
									<span>{films.length} films</span>
									<span>•</span>
									<span
										>{films.reduce((acc: number, f: any) => acc + (f.length || 0), 0)}m total</span
									>
									{#if screening.date}
										<span>•</span>
										<span>{new Date(screening.date).toLocaleDateString()}</span>
									{/if}
								</div>
								{#if screening.juryMembers && screening.juryMembers.length > 0}
									<div class="flex -space-x-1 mt-2 overflow-hidden py-0.5">
										{#each screening.juryMembers as jury}
											<div
												class="h-6 w-6 rounded-full ring-2 ring-white bg-gallery-200 flex items-center justify-center text-[10px] font-bold text-gallery-600"
												title={jury.name}
											>
												{jury.name.slice(0, 2).toUpperCase()}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</button>
						<div class="flex gap-1 shrink-0">
							<button
								onclick={(e) => openEditModal(screening, e)}
								class="p-1.5 hover:bg-gallery-200 rounded text-gallery-600"
								title="Assign Jury"
							>
								<Users class="w-4 h-4" />
							</button>
							<button
								onclick={(e) => openEditModal(screening, e)}
								class="p-1.5 hover:bg-gallery-200 rounded text-gallery-600"
								title="Edit"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</button>
							<button
								onclick={(e) => deleteScreening(screening._id, screening.title, e)}
								class="p-1.5 hover:bg-red-100 text-red-600 rounded"
								title="Delete"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					</div>
					{#if !collapsedScreenings[screening._id]}
						<div
							ondragover={(e) => handleDragOver(e, screening._id)}
							ondragleave={() => handleDragLeave(screening._id)}
							ondrop={(e) => handleDrop(e, screening._id)}
							class="p-4 pt-4 min-h-32 transition-colors bg-gallery-50/50"
							class:bg-accent-50={dragOverScreeningId === screening._id}
							class:border-2={dragOverScreeningId === screening._id}
							class:border-accent-500={dragOverScreeningId === screening._id}
							class:border-dashed={dragOverScreeningId === screening._id}
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
											onRemove={() => unassignFilm(film._id)}
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

<!-- Edit Modal -->
{#if showEditModal}
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onclick={closeEditModal}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && closeEditModal()}
	>
		<div
			class="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			role="button"
			tabindex="0"
			onkeydown={() => {}}
		>
			<div class="px-6 py-4 border-b border-gallery-100 flex justify-between items-center">
				<h3 class="text-lg font-bold text-gallery-900">Edit Screening</h3>
				<button onclick={closeEditModal} class="text-gallery-400 hover:text-gallery-600">
					<X class="w-5 h-5" />
				</button>
			</div>

			<div class="p-6 space-y-4">
				<div>
					<label class="block text-sm font-medium text-gallery-700 mb-1">Title</label>
					<input
						type="text"
						bind:value={editTitle}
						class="w-full rounded-md border-gallery-300 focus:border-gallery-500 focus:ring-gallery-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gallery-700 mb-1">Date & Time</label>
					<input
						type="datetime-local"
						bind:value={editDate}
						class="w-full rounded-md border-gallery-300 focus:border-gallery-500 focus:ring-gallery-500"
					/>
				</div>

				<div>
					<label class="block text-sm font-medium text-gallery-700 mb-1">Location</label>
					<input
						type="text"
						bind:value={editLocation}
						class="w-full rounded-md border-gallery-300 focus:border-gallery-500 focus:ring-gallery-500"
					/>
				</div>

				<JurySelector
					availableCurators={data.curatorsList || []}
					selectedJuryIds={editJuryIds}
					onUpdate={(ids) => (editJuryIds = ids)}
				/>
			</div>

			<div class="px-6 py-4 bg-gallery-50 flex justify-end gap-3">
				<button
					onclick={closeEditModal}
					class="px-4 py-2 text-sm font-medium text-gallery-600 hover:bg-gallery-100 rounded-md transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={saveScreening}
					class="px-4 py-2 text-sm font-medium text-white bg-gallery-900 hover:bg-black rounded-md transition-colors shadow-sm"
				>
					Save Changes
				</button>
			</div>
		</div>
	</div>
{/if}
