<script lang="ts">
	import { ChevronLeft, ChevronRight, Save, Trash2, Loader2 } from 'lucide-svelte';
	import { page } from '$app/stores';
	import GraphView from '$lib/components/visualiser/GraphView.svelte';
	import GraphControls from '$lib/components/visualiser/GraphControls.svelte';
	import GraphTooltip from '$lib/components/visualiser/GraphTooltip.svelte';
	import FilmDetailDialog from '$lib/components/films/FilmDetailDialog.svelte';
	import {
		buildGraphData,
		collectTags,
		formatDuration,
		type GraphToggles,
		type DisplayOptions,
		type GraphNode,
		type FilmNodeData,
	} from '$lib/components/visualiser/graphUtils';

	let { data } = $props();

	// Build toggle item lists from server data
	let metaCategoryItems = $derived(
		data.metaCategories
			.filter((mc: any) => mc.filmIds.length > 0)
			.map((mc: any) => ({
				id: mc._id,
				label: mc.name,
				count: mc.filmIds.length,
			}))
	);

	let clusterItems = $derived(
		data.clusters
			.filter((c: any) => c.highlightedFilmIds.length + c.relevantFilmIds.length > 0)
			.map((c: any) => ({
				id: c._id,
				label: c.name,
				count: c.highlightedFilmIds.length + c.relevantFilmIds.length,
			}))
	);

	let tagItems = $derived(collectTags(data.films));
	let tagToggleItems = $derived(
		tagItems.map((t) => ({ id: t.name, label: t.name, count: t.count }))
	);

	// Initialize toggles — all meta-categories and clusters ON by default
	let toggles = $state<GraphToggles>({
		metaCategories: Object.fromEntries(
			data.metaCategories
				.filter((mc: any) => mc.filmIds.length > 0)
				.map((mc: any) => [mc._id, true])
		),
		clusters: Object.fromEntries(
			data.clusters
				.filter((c: any) => c.highlightedFilmIds.length + c.relevantFilmIds.length > 0)
				.map((c: any) => [c._id, true])
		),
		tags: {},
	});

	let displayOptions = $state<DisplayOptions>({
		sizeMode: 'connections',
		labelMode: 'hover',
		forceStrength: 10,
		filterMode: 'union',
		showMetaCategories: true,
		showClusters: true,
		showTags: false,
	});

	let searchQuery = $state('');
	let hoveredNode = $state<GraphNode | null>(null);
	let mousePos = $state({ x: 0, y: 0 });
	let selectedFilm = $state<any>(null);
	let graphViewRef: GraphView;
	let rightCollapsed = $state(false);

	// Jury selection save/load
	let canSaveSelections = $derived($page.data.isJury || $page.data.isAdmin);
	let savedSelections = $state<any[]>(data.jurySelections || []);
	let selectionName = $state('');
	let saving = $state(false);
	let loadingId = $state<string | null>(null);
	let showSaveInput = $state(false);

	function getEnabledIds(toggleMap: Record<string, boolean>): string[] {
		return Object.entries(toggleMap)
			.filter(([, enabled]) => enabled)
			.map(([id]) => id);
	}

	async function saveSelection() {
		if (!selectionName.trim() || saving) return;
		saving = true;
		try {
			const res = await fetch('/api/jury-selections', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: selectionName.trim(),
					filterMode: displayOptions.filterMode,
					enabledMetaCategories: getEnabledIds(toggles.metaCategories),
					enabledClusters: getEnabledIds(toggles.clusters),
					enabledTags: getEnabledIds(toggles.tags),
					activeFilmIds: [...graphData.activeFilmIds],
				}),
			});
			const result = await res.json();
			if (result.success) {
				savedSelections = [
					{
						_id: result.id,
						name: selectionName.trim(),
						savedAt: new Date().toISOString(),
						filterMode: displayOptions.filterMode,
						activeFilmCount: graphData.activeFilmIds.size,
						savedByName: 'You',
					},
					...savedSelections,
				];
				selectionName = '';
				showSaveInput = false;
			}
		} catch (e) {
			console.error('Failed to save selection:', e);
		} finally {
			saving = false;
		}
	}

	async function loadSelection(id: string) {
		loadingId = id;
		try {
			const res = await fetch(`/api/jury-selections/${id}`);
			const { selection } = await res.json();
			if (!selection) return;

			const newMcToggles: Record<string, boolean> = {};
			for (const item of metaCategoryItems) {
				newMcToggles[item.id] = (selection.enabledMetaCategories || []).includes(item.id);
			}

			const newClToggles: Record<string, boolean> = {};
			for (const item of clusterItems) {
				newClToggles[item.id] = (selection.enabledClusters || []).includes(item.id);
			}

			const newTagToggles: Record<string, boolean> = {};
			for (const item of tagToggleItems) {
				newTagToggles[item.id] = (selection.enabledTags || []).includes(item.id);
			}

			toggles = {
				metaCategories: newMcToggles,
				clusters: newClToggles,
				tags: newTagToggles,
			};

			displayOptions = {
				...displayOptions,
				filterMode: selection.filterMode || 'union',
			};
		} catch (e) {
			console.error('Failed to load selection:', e);
		} finally {
			loadingId = null;
		}
	}

	async function deleteSelection(id: string) {
		try {
			const res = await fetch('/api/jury-selections', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id }),
			});
			const result = await res.json();
			if (result.success) {
				savedSelections = savedSelections.filter((s) => s._id !== id);
			}
		} catch (e) {
			console.error('Failed to delete selection:', e);
		}
	}

	let graphData = $derived.by(() => {
		return buildGraphData(
			data.films,
			data.metaCategories,
			data.clusters,
			toggles,
			displayOptions
		);
	});

	// Active films: those in the activeFilmIds set
	let activeFilms = $derived.by(() => {
		return data.films
			.filter((f: FilmNodeData) => graphData.activeFilmIds.has(f._id))
			.sort((a: FilmNodeData, b: FilmNodeData) => b.score - a.score);
	});

	let activeScreenTime = $derived(
		activeFilms.reduce((sum: number, f: FilmNodeData) => sum + (f.length || 0), 0)
	);

	// Apply search highlighting — dims non-matching nodes via active flag
	let displayedGraphData = $derived.by(() => {
		if (!searchQuery.trim()) return graphData;
		const q = searchQuery.toLowerCase();
		return {
			nodes: graphData.nodes.map((n) => ({
				...n,
				active: n.active && n.label.toLowerCase().includes(q),
			})),
			links: graphData.links,
			activeFilmIds: graphData.activeFilmIds,
		};
	});
</script>

<div class="flex" style="height: calc(100dvh - 57px); background: #1c1917;">
	<GraphControls
		{toggles}
		{displayOptions}
		{searchQuery}
		onToggleChange={(t) => (toggles = t)}
		onDisplayChange={(o) => (displayOptions = o)}
		onSearchChange={(q) => (searchQuery = q)}
		onZoomToFit={() => graphViewRef?.zoomToFit()}
		{metaCategoryItems}
		{clusterItems}
		tagItems={tagToggleItems}
	/>

	<div class="relative min-w-0 flex-1">
		<GraphView
			bind:this={graphViewRef}
			graphData={displayedGraphData}
			{displayOptions}
			onNodeHover={(node, pos) => {
				hoveredNode = node;
				mousePos = pos;
			}}
			onNodeClick={(node) => {
				if (node.type === 'film') {
					selectedFilm = node.data;
				} else if (node.type === 'meta-category') {
					const id = node.id.replace('mc-', '');
					const allOn = metaCategoryItems.every((i) => toggles.metaCategories[i.id]);
					if (allOn) {
						// Solo: enable only this one
						const solo: Record<string, boolean> = {};
						for (const i of metaCategoryItems) solo[i.id] = i.id === id;
						toggles = { ...toggles, metaCategories: solo };
					} else {
						toggles = { ...toggles, metaCategories: { ...toggles.metaCategories, [id]: !toggles.metaCategories[id] } };
					}
				} else if (node.type === 'cluster') {
					const id = node.id.replace('cl-', '');
					const allOn = clusterItems.every((i) => toggles.clusters[i.id]);
					if (allOn) {
						const solo: Record<string, boolean> = {};
						for (const i of clusterItems) solo[i.id] = i.id === id;
						toggles = { ...toggles, clusters: solo };
					} else {
						toggles = { ...toggles, clusters: { ...toggles.clusters, [id]: !toggles.clusters[id] } };
					}
				} else if (node.type === 'tag') {
					const name = node.id.replace('tag-', '');
					const allOn = tagToggleItems.every((i) => toggles.tags[i.id]);
					if (allOn) {
						const solo: Record<string, boolean> = {};
						for (const i of tagToggleItems) solo[i.id] = i.id === name;
						toggles = { ...toggles, tags: solo };
					} else {
						toggles = { ...toggles, tags: { ...toggles.tags, [name]: !toggles.tags[name] } };
					}
				}
			}}
		/>
		<GraphTooltip node={hoveredNode} x={mousePos.x} y={mousePos.y} />
	</div>

	<!-- Right panel: Active Selection -->
	<aside
		class="
			shrink-0 overflow-y-auto border-l border-gallery-800 bg-gallery-900 text-gallery-300
			transition-all duration-200
			{rightCollapsed ? 'w-10' : 'w-72'}
			hidden md:block
		"
	>
		{#if !rightCollapsed}
			<div class="flex flex-col gap-3 p-4">
				<div class="flex items-center justify-between">
					<h2 class="text-xs font-bold uppercase tracking-wider text-gallery-400">Active Selection</h2>
					<button
						class="text-gallery-500 hover:text-gallery-300"
						onclick={() => (rightCollapsed = true)}
					>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>

				<div class="flex items-baseline gap-3">
					<span class="text-2xl font-bold text-gallery-100">{activeFilms.length}</span>
					<span class="text-[11px] text-gallery-400">
						films / {formatDuration(activeScreenTime)}
					</span>
				</div>
				{#if activeFilms.length < data.films.length}
					<p class="text-[10px] text-gallery-600">
						{data.films.length - activeFilms.length} inactive
					</p>
				{/if}

				{#if canSaveSelections}
					<section class="border-t border-gallery-800 pt-3">
						{#if showSaveInput}
							<div class="flex gap-1">
								<input
									type="text"
									placeholder="Selection name..."
									bind:value={selectionName}
									onkeydown={(e) => e.key === 'Enter' && saveSelection()}
									class="min-w-0 flex-1 rounded border border-gallery-700 bg-gallery-800 px-2 py-1 text-[11px] text-gallery-200 placeholder-gallery-500 outline-none focus:border-gallery-600"
								/>
								<button
									onclick={saveSelection}
									disabled={saving || !selectionName.trim()}
									class="shrink-0 rounded bg-gallery-700 px-2 py-1 text-[10px] text-gallery-300 hover:bg-gallery-600 disabled:opacity-40"
								>
									{#if saving}
										<Loader2 class="h-3 w-3 animate-spin" />
									{:else}
										Save
									{/if}
								</button>
								<button
									onclick={() => { showSaveInput = false; selectionName = ''; }}
									class="shrink-0 text-[10px] text-gallery-500 hover:text-gallery-300"
								>
									Cancel
								</button>
							</div>
						{:else}
							<button
								onclick={() => (showSaveInput = true)}
								class="flex w-full items-center justify-center gap-1.5 rounded border border-gallery-700 bg-gallery-800 px-2 py-1.5 text-[11px] text-gallery-300 hover:border-gallery-600 hover:text-gallery-200"
							>
								<Save class="h-3 w-3" />
								Save Selection
							</button>
						{/if}

						{#if savedSelections.length > 0}
							<div class="mt-2 flex flex-col gap-0.5">
								<h3 class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gallery-500">
									Saved ({savedSelections.length})
								</h3>
								{#each savedSelections as sel (sel._id)}
									<div class="group flex items-center justify-between rounded px-2 py-1 text-[11px] hover:bg-gallery-800">
										<button
											onclick={() => loadSelection(sel._id)}
											class="min-w-0 flex-1 truncate text-left text-gallery-300"
											title="{sel.name} — {sel.activeFilmCount} films — {sel.savedByName}"
											disabled={loadingId === sel._id}
										>
											{#if loadingId === sel._id}
												<Loader2 class="mr-1 inline h-3 w-3 animate-spin" />
											{/if}
											{sel.name}
											<span class="ml-1 text-gallery-600">{sel.activeFilmCount}</span>
										</button>
										<button
											onclick={() => deleteSelection(sel._id)}
											class="ml-1 shrink-0 text-gallery-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
											title="Delete"
										>
											<Trash2 class="h-3 w-3" />
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</section>
				{/if}

				{#if activeFilms.length > 0}
					<div class="flex flex-col gap-0.5 overflow-y-auto" style="max-height: calc(100dvh - 200px);">
						{#each activeFilms as film}
							<button
								class="flex items-center justify-between rounded px-2 py-1.5 text-[11px] text-left hover:bg-gallery-800 transition-colors"
								onclick={() => (selectedFilm = film)}
							>
								<span class="truncate text-gallery-300" title={film.englishTitle}>
									{film.englishTitle}
								</span>
								<span class="shrink-0 text-gallery-600 ml-2">{film.length}m</span>
							</button>
						{/each}
					</div>
				{:else}
					<p class="text-xs text-gallery-600">No films match the current filters.</p>
				{/if}
			</div>
		{:else}
			<div class="flex h-full flex-col items-center pt-3">
				<button
					class="text-gallery-500 hover:text-gallery-300"
					onclick={() => (rightCollapsed = false)}
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
			</div>
		{/if}
	</aside>
</div>

{#if selectedFilm}
	<FilmDetailDialog film={selectedFilm} onClose={() => (selectedFilm = null)} />
{/if}
