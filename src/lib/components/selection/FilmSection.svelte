<script lang="ts">
	import { formatTime } from '$lib/utils/formatting';
	import FilmCardGrid from './FilmCardGrid.svelte';
	import FilmCardCompact from './FilmCardCompact.svelte';

	interface Props {
		title: string;
		description: string;
		films: any[];
		viewMode: 'grid' | 'compact';
		totalCount: number;
		visibleCount: number;
		totalMinutes: number;
		visibleMinutes: number;
		hasActiveFilters: boolean;
		onFilmClick: (film: any) => void;
		open?: boolean;
		emptyMessage?: string;
	}

	let {
		title,
		description,
		films,
		viewMode,
		totalCount,
		visibleCount,
		totalMinutes,
		visibleMinutes,
		hasActiveFilters,
		onFilmClick,
		open = false,
		emptyMessage = 'No films in this category yet.'
	}: Props = $props();
</script>

<section class="space-y-6">
	<details {open} class="group">
		<summary class="cursor-pointer list-none">
			<div
				class="flex items-center gap-2 text-xl font-bold text-gallery-900 hover:text-black transition-colors"
			>
				<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
				{title}
				{#if hasActiveFilters}
					<span class="text-gallery-600">({visibleCount} / {totalCount})</span>
				{:else}
					<span class="text-gallery-600">({totalCount})</span>
				{/if}
				<span class="text-sm font-normal text-gallery-400 ml-2">
					{#if hasActiveFilters}
						{formatTime(visibleMinutes)} / {formatTime(totalMinutes)}
					{:else}
						{formatTime(totalMinutes)}
					{/if}
				</span>
			</div>
			<p class="text-sm text-gallery-500 mt-1 ml-6">
				{description}
			</p>
		</summary>

		{#if films.length === 0}
			<div class="mt-6 p-8 bg-gallery-50 rounded-lg text-center">
				<p class="text-gallery-500">{emptyMessage}</p>
			</div>
		{:else if viewMode === 'compact'}
			<div class="space-y-2 mt-6">
				{#each films as film (film._id)}
					<FilmCardCompact {film} onclick={() => onFilmClick(film)} />
				{/each}
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
				{#each films as film (film._id)}
					<FilmCardGrid {film} onclick={() => onFilmClick(film)} />
				{/each}
			</div>
		{/if}
	</details>
</section>
