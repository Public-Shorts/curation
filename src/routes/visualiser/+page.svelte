<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
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
	});

	let searchQuery = $state('');
	let hoveredNode = $state<GraphNode | null>(null);
	let mousePos = $state({ x: 0, y: 0 });
	let selectedFilm = $state<any>(null);
	let graphViewRef: GraphView;
	let rightCollapsed = $state(false);

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

	// Apply search highlighting to graph data
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
