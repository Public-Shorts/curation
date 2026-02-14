<script lang="ts">
	import {StatCard} from '$lib/components/ui';
	import MetaCategorySection from '$lib/components/meta-categories/MetaCategorySection.svelte';
	import FilmDetailDialog from '$lib/components/selection/FilmDetailDialog.svelte';
	import {onMount} from 'svelte';

	let {data} = $props();

	let isAdmin = $derived(data.isAdmin);
	let selectedFilm = $state<any | null>(null);

	let stats = $derived(data.stats);

	// Collapse state for each meta-category
	let collapsedSections = $state<Record<string, boolean>>({});

	const STORAGE_KEY = 'meta_categories_collapsed';

	onMount(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				collapsedSections = JSON.parse(saved);
			}
		} catch (e) {
			console.error('Failed to load collapse state', e);
		}
	});

	function toggleSection(metaCategoryId: string) {
		collapsedSections[metaCategoryId] = !collapsedSections[metaCategoryId];
		localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedSections));
	}

	let sortKey = $state('filmCount');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let typeFilter = $state<'all' | 'auto' | 'manual'>('all');

	let filteredMetaCategories = $derived.by(() => {
		let categories = data.metaCategories;
		if (typeFilter !== 'all') {
			categories = categories.filter((mc: any) => mc.type === typeFilter);
		}
		return categories;
	});

	let sortedMetaCategories = $derived.by(() => {
		return [...filteredMetaCategories].sort((a: any, b: any) => {
			let av, bv;

			if (sortKey === 'filmCount') {
				av = a.filmCount || 0;
				bv = b.filmCount || 0;
			} else if (sortKey === 'name') {
				av = a.name.toLowerCase();
				bv = b.name.toLowerCase();
			} else if (sortKey === 'totalMinutes') {
				av = a.totalMinutes || 0;
				bv = b.totalMinutes || 0;
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
			sortDir = key === 'name' ? 'asc' : 'desc';
		}
	}

	let removingFilms = $state<Record<string, boolean>>({});

	async function removeFilm(metaCategoryId: string, filmId: string, filmTitle: string) {
		const key = `${metaCategoryId}-${filmId}`;

		if (
			!confirm(
				`Are you sure you want to remove "${filmTitle}" from this meta-category?\n\nThis action cannot be undone.`
			)
		) {
			return;
		}

		removingFilms[key] = true;

		try {
			const response = await fetch(`/api/meta-categories/${metaCategoryId}/remove-film`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({filmId}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to remove film');
			}

			// Optimistically remove from UI
			data.metaCategories = data.metaCategories.map((mc: any) => {
				if (mc._id === metaCategoryId) {
					return {
						...mc,
						films: mc.films?.filter((f: any) => f._id !== filmId) || [],
						filmCount: (mc.filmCount || 0) - 1,
					};
				}
				return mc;
			});

			// Recalculate stats
			data.stats.totalFilms = data.metaCategories.reduce((sum: number, mc: any) => {
				const uniqueFilms = new Set(mc.films?.map((f: any) => f._id) || []);
				return sum + uniqueFilms.size;
			}, 0);
			data.stats.totalUniqueFilms = new Set(
				data.metaCategories.flatMap((mc: any) => mc.films?.map((f: any) => f._id) || [])
			).size;
		} catch (error) {
			console.error('Error removing film:', error);
			alert(`Failed to remove film: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			delete removingFilms[key];
		}
	}
</script>

<div class="w-full px-6 py-6">
	<div class="space-y-8">
		<!-- Stats Section -->
		<section class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<StatCard label="Meta Categories" value={stats.totalMetaCategories} />

			<StatCard label="Total Films" value={stats.totalFilms}>
				<p class="text-xs text-gallery-500 mt-1">({stats.totalUniqueFilms} unique)</p>
			</StatCard>

			<StatCard label="Total Time">
				<p class="text-lg font-semibold">
					{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
				</p>
			</StatCard>
		</section>

		<!-- Header with Sorting & Type Filter -->
		<header class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
			<div>
				<h1 class="text-3xl font-bold mb-1">Meta Categories</h1>
				<p class="text-gallery-600 text-sm">
					Curated film collections based on thematic descriptions and metadata
				</p>
			</div>

			<div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
				<!-- Type Filter -->
				<div class="flex items-center gap-1 bg-gallery-50 p-1 rounded-lg border border-gallery-100">
					<button
						onclick={() => (typeFilter = 'all')}
						class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {typeFilter ===
						'all'
							? 'bg-white shadow-sm text-gallery-900'
							: 'text-gallery-600 hover:bg-white/50'}"
					>
						All
					</button>
					<button
						onclick={() => (typeFilter = 'auto')}
						class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {typeFilter ===
						'auto'
							? 'bg-white shadow-sm text-gallery-900'
							: 'text-gallery-600 hover:bg-white/50'}"
					>
						Auto
					</button>
					<button
						onclick={() => (typeFilter = 'manual')}
						class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {typeFilter ===
						'manual'
							? 'bg-white shadow-sm text-gallery-900'
							: 'text-gallery-600 hover:bg-white/50'}"
					>
						Manual
					</button>
				</div>

				<!-- Sorting Controls -->
				<div
					class="flex items-center gap-2 bg-gallery-50 p-1 rounded-lg border border-gallery-100"
				>
					<span class="text-[10px] uppercase font-bold text-gallery-400 px-2">Sort by:</span>

					<button
						onclick={() => toggleSort('filmCount')}
						class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {sortKey ===
						'filmCount'
							? 'bg-white shadow-sm text-gallery-900'
							: 'text-gallery-600 hover:bg-white/50'}"
					>
						Film Count {sortKey === 'filmCount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</button>

					<button
						onclick={() => toggleSort('name')}
						class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {sortKey === 'name'
							? 'bg-white shadow-sm text-gallery-900'
							: 'text-gallery-600 hover:bg-white/50'}"
					>
						Name {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</button>

					<button
						onclick={() => toggleSort('totalMinutes')}
						class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all {sortKey ===
						'totalMinutes'
							? 'bg-white shadow-sm text-gallery-900'
							: 'text-gallery-600 hover:bg-white/50'}"
					>
						Total Time {sortKey === 'totalMinutes' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
					</button>
				</div>
			</div>
		</header>

		<!-- Meta Categories as Collapsible Sections -->
		{#if sortedMetaCategories.length === 0}
			<div class="text-center py-20">
				<p class="text-gallery-500 text-lg">No meta categories yet</p>
				<p class="text-gallery-400 text-sm mt-2">
					Create meta categories in Sanity Studio and run the categorization CLI
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each sortedMetaCategories as metaCategory (metaCategory._id)}
					<MetaCategorySection
						{metaCategory}
						{isAdmin}
						collapsed={collapsedSections[metaCategory._id] ?? false}
						{removingFilms}
						onToggle={() => toggleSection(metaCategory._id)}
						onRemoveFilm={removeFilm}
						onFilmClick={(film) => (selectedFilm = film)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Film Detail Dialog -->
{#if selectedFilm}
	<FilmDetailDialog film={selectedFilm} onClose={() => (selectedFilm = null)} />
{/if}
