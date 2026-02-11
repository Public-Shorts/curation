<script lang="ts">
	import DraggableFilmCard from './DraggableFilmCard.svelte';

	interface Props {
		title: string;
		films: any[];
		viewMode: 'grid' | 'compact';
		draggingFilmId: string | null;
		onfilmclick: (film: any) => void;
		ondragstart: (e: DragEvent, filmId: string) => void;
		ondragend: () => void;
		hideHeader?: boolean;
	}

	let {
		title,
		films,
		viewMode,
		draggingFilmId,
		onfilmclick,
		ondragstart,
		ondragend,
		hideHeader = false
	}: Props = $props();

	let totalDuration = $derived(films.reduce((sum, f) => sum + (f.length || 0), 0));
</script>

<section class="mb-8">
	{#if !hideHeader && title}
		<div class="mb-4">
			<h3 class="text-lg font-black text-gallery-900 uppercase tracking-tight">{title}</h3>
			<p class="text-xs text-gallery-500 mt-0.5">
				{films.length} films • {totalDuration} min
			</p>
		</div>
	{/if}

	{#if films.length === 0}
		<div class="text-center py-8 text-gallery-400">
			<p class="text-sm">No films in this section</p>
		</div>
	{:else if viewMode === 'grid'}
		<div class="grid gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
			{#each films as film (film._id)}
				<DraggableFilmCard
					{film}
					{viewMode}
					{draggingFilmId}
					onclick={() => onfilmclick(film)}
					ondragstart={(e) => ondragstart(e, film._id)}
					{ondragend}
				/>
			{/each}
		</div>
	{:else}
		<div class="space-y-2">
			{#each films as film (film._id)}
				<DraggableFilmCard
					{film}
					{viewMode}
					{draggingFilmId}
					onclick={() => onfilmclick(film)}
					ondragstart={(e) => ondragstart(e, film._id)}
					{ondragend}
				/>
			{/each}
		</div>
	{/if}
</section>
