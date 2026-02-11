<script lang="ts">
	import FilmCardGrid from '$lib/components/selection/FilmCardGrid.svelte';
	import FilmCardCompact from '$lib/components/selection/FilmCardCompact.svelte';

	interface Props {
		screening: any;
		films: any[];
		viewMode: 'grid' | 'compact';
		dragOverScreeningId: string | null;
		onfilmclick: (film: any) => void;
		ondragover: (e: DragEvent) => void;
		ondragleave: () => void;
		ondrop: (e: DragEvent) => void;
		onedit?: (e: Event) => void;
		ondelete?: (e: Event) => void;
		hideHeader?: boolean;
	}

	let {
		screening,
		films,
		viewMode,
		dragOverScreeningId,
		onfilmclick,
		ondragover,
		ondragleave,
		ondrop,
		onedit,
		ondelete,
		hideHeader = false
	}: Props = $props();

	let totalDuration = $derived(films.reduce((sum, f) => sum + (f.length || 0), 0));
	let isDropTarget = $derived(dragOverScreeningId === screening._id);
</script>

<div
	{ondragover}
	{ondragleave}
	{ondrop}
	class="transition-all duration-200"
	class:bg-accent-50={isDropTarget}
	class:border-t-2={isDropTarget && hideHeader}
	class:border-accent-500={isDropTarget}
>
	<!-- Header -->
	{#if !hideHeader}
		<div class="mb-4 pb-3 border-b border-gallery-100">
			<div class="flex items-center justify-between mb-2">
				<h2 class="text-xl font-black text-gallery-900">{screening.title}</h2>
				<div class="flex items-center gap-2">
					{#if onedit}
						<button
							onclick={onedit}
							class="text-gallery-400 hover:text-gallery-600 transition-colors p-1"
							title="Edit screening"
						>
							<span class="text-sm">✏️</span>
						</button>
					{/if}
					{#if ondelete}
						<button
							onclick={ondelete}
							class="text-red-400 hover:text-red-600 transition-colors p-1"
							title="Delete screening"
						>
							<span class="text-sm">🗑️</span>
						</button>
					{/if}
				</div>
			</div>

			<div class="flex flex-col gap-1 text-xs text-gallery-500">
				{#if screening.date}
					<div class="flex items-center gap-1.5">
						<span>📅</span>
						<span>
							{new Date(screening.date).toLocaleDateString('en-US', {
								weekday: 'short',
								month: 'short',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}
						</span>
					</div>
				{/if}
				{#if screening.location}
					<div class="flex items-center gap-1.5">
						<span>📍</span>
						<span>{screening.location}</span>
					</div>
				{/if}
				{#if screening.juryMembers?.length > 0}
					<div class="flex items-center gap-1.5">
						<span>👥</span>
						<span>{screening.juryMembers.map((j) => j.name).join(', ')}</span>
					</div>
				{/if}
				<div class="flex items-center gap-1.5 font-medium text-gallery-600 mt-1">
					<span>{films.length} films • {totalDuration} min</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Drop zone indicator -->
	{#if isDropTarget && films.length === 0}
		<div class="flex items-center justify-center h-64 border-2 border-dashed border-accent-400 rounded-lg bg-accent-50">
			<p class="text-accent-600 font-medium">Drop film here</p>
		</div>
	{/if}

	<!-- Films -->
	{#if films.length > 0}
		{#if viewMode === 'grid'}
			<div class="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
				{#each films as film (film._id)}
					<FilmCardGrid {film} onclick={() => onfilmclick(film)} />
				{/each}
			</div>
		{:else}
			<div class="space-y-2">
				{#each films as film (film._id)}
					<FilmCardCompact {film} onclick={() => onfilmclick(film)} />
				{/each}
			</div>
		{/if}
	{:else if !isDropTarget}
		<div class="flex items-center justify-center h-32 text-gallery-400">
			<p class="text-sm">No films assigned yet</p>
		</div>
	{/if}
</div>
