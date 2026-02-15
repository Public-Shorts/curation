<script lang="ts">
	import FilmCardGrid from '$lib/components/films/FilmCardGrid.svelte';
	import {ChevronDown, ChevronRight, Star} from 'lucide-svelte';

	interface Props {
		cluster: any;
		collapsed: boolean;
		onToggle: () => void;
		onFilmClick?: (film: any) => void;
	}

	let {cluster, collapsed, onToggle, onFilmClick}: Props = $props();

	function prepareFilm(film: any) {
		const reviewTags = [
			...new Set(
				(film.reviews || []).flatMap((r: any) =>
					(r.tags || []).map((t: any) => t.label || t)
				)
			),
		];
		return {
			...film,
			title: film.englishTitle || film.title,
			director: film.directorName || film.director,
			curatorCount: film.highlightCount || 0,
			tags: reviewTags,
			isVisible: true,
		};
	}
</script>

<section class="rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden">
	<!-- Section Header -->
	<button
		onclick={onToggle}
		class="w-full px-6 py-4 flex flex-col gap-2 hover:bg-gallery-50 transition-colors text-left"
	>
		<!-- Top row -->
		<div class="flex items-center justify-between w-full">
			<div class="flex items-center gap-3 flex-1 min-w-0">
				{#if collapsed}
					<ChevronRight class="w-5 h-5 text-gallery-500 shrink-0" />
				{:else}
					<ChevronDown class="w-5 h-5 text-gallery-500 shrink-0" />
				{/if}

				<h2 class="text-xl font-bold text-gallery-900 truncate" title={cluster.name}>
					{cluster.name}
				</h2>

				<span
					class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 bg-emerald-50 text-emerald-600"
				>
					cluster
				</span>
			</div>

			<div class="flex items-center gap-6 text-sm text-gallery-500 ml-4">
				<div class="text-right">
					<span class="font-semibold text-gallery-900">{cluster.highlightedCount}</span>
					<span class="ml-1">highlighted</span>
				</div>
				<div class="text-right">
					<span class="font-semibold text-gallery-900">{cluster.relevantCount}</span>
					<span class="ml-1">relevant</span>
				</div>
				{#if cluster.totalHours !== undefined}
					<div class="text-right">
						<span class="font-semibold text-gallery-900">
							{cluster.totalHours}h {cluster.totalMins}m
						</span>
					</div>
				{/if}
				{#if cluster.lastUpdated}
					<div class="text-xs text-gallery-400">
						{new Date(cluster.lastUpdated).toLocaleDateString()}
					</div>
				{/if}
			</div>
		</div>

		<!-- Description -->
		{#if cluster.description}
			<p class="text-sm text-gallery-600 line-clamp-2 ml-8">
				{cluster.description}
			</p>
		{/if}

		<!-- Keywords -->
		{#if cluster.keywords?.length > 0}
			<div class="flex flex-wrap gap-1.5 ml-8">
				{#each cluster.keywords as keyword}
					<span
						class="text-[11px] px-2 py-0.5 rounded-full bg-gallery-100 text-gallery-600"
					>
						{keyword}
					</span>
				{/each}
			</div>
		{/if}
	</button>

	<!-- Expanded Content -->
	{#if !collapsed}
		<div class="border-t border-gallery-100 bg-gallery-50/50">
			<!-- Highlighted Films -->
			{#if cluster.highlightedFilms?.length > 0}
				<div class="px-6 pt-4 pb-2">
					<div class="flex items-center gap-2 mb-3">
						<Star class="w-4 h-4 text-amber-500" />
						<h3 class="text-sm font-semibold text-gallery-700">
							Highlighted Films ({cluster.highlightedFilms.length})
						</h3>
					</div>
					<div
						class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
					>
						{#each cluster.highlightedFilms as film}
							{@const preparedFilm = prepareFilm(film)}
							<FilmCardGrid
								film={preparedFilm}
								onclick={() => onFilmClick?.(preparedFilm)}
							/>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Relevant Films -->
			{#if cluster.relevantFilms?.length > 0}
				<div class="px-6 pt-4 pb-6">
					<h3 class="text-sm font-semibold text-gallery-700 mb-3">
						Relevant Films ({cluster.relevantFilms.length})
					</h3>
					<div
						class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
					>
						{#each cluster.relevantFilms as film}
							{@const preparedFilm = prepareFilm(film)}
							<FilmCardGrid
								film={preparedFilm}
								onclick={() => onFilmClick?.(preparedFilm)}
							/>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Empty state -->
			{#if !cluster.highlightedFilms?.length && !cluster.relevantFilms?.length}
				<div class="px-6 pb-6 pt-2">
					<p class="text-sm text-gallery-400 italic text-center py-8">
						No films in this cluster yet
					</p>
				</div>
			{/if}
		</div>
	{/if}
</section>
