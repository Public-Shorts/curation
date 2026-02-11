<script lang="ts">
	import FilmCardGrid from '$lib/components/selection/FilmCardGrid.svelte';
	import FilmCardCompact from '$lib/components/selection/FilmCardCompact.svelte';

	interface Props {
		film: any;
		viewMode: 'grid' | 'compact';
		draggingFilmId: string | null;
		onclick?: () => void;
		ondragstart?: (e: DragEvent) => void;
		ondragend?: () => void;
	}

	let { film, viewMode, draggingFilmId, onclick, ondragstart, ondragend }: Props = $props();
</script>

<div
	draggable="true"
	{ondragstart}
	{ondragend}
	class="cursor-move transition-opacity"
	class:opacity-50={draggingFilmId === film._id}
>
	{#if viewMode === 'grid'}
		<FilmCardGrid {film} {onclick} />
	{:else}
		<FilmCardCompact {film} {onclick} />
	{/if}
</div>
