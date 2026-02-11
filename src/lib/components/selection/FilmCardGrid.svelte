<script lang="ts">
	interface Props {
		film: any;
		onclick?: () => void;
	}

	let { film, onclick }: Props = $props();
</script>

<button
	{onclick}
	class="flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group/card text-left cursor-pointer w-full h-full"
	class:opacity-30={!film.isVisible}
	class:grayscale={!film.isVisible}
	class:pointer-events-none={!film.isVisible}
>
	<!-- Poster/Screenshot -->
	{#if film.poster?.asset}
		<div class="relative aspect-video bg-gallery-100 overflow-hidden">
			<img
				src={`${film.poster.asset.url}?w=600&h=400&fit=crop`}
				alt={film.title}
				class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
			/>
			<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
			{#if film.tags?.length > 0}
				<div
					class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"
				>
					<div class="flex flex-wrap gap-1">
						{#each film.tags.slice(0, 5) as tag}
							<span class="text-xs px-2 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else if film.screenshots?.[0]?.asset}
		<div class="relative aspect-video bg-gallery-100 overflow-hidden">
			<img
				src={`${film.screenshots[0].asset.url}?w=600&h=400&fit=crop`}
				alt={film.title}
				class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
			/>
			<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
			{#if film.tags?.length > 0}
				<div
					class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"
				>
					<div class="flex flex-wrap gap-1">
						{#each film.tags.slice(0, 5) as tag}
							<span class="text-xs px-2 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
		>
			<span class="text-gallery-400 text-4xl">🎬</span>
		</div>
	{/if}

	<!-- Content -->
	<div class="p-5 flex-1 flex flex-col space-y-4">
		<div class="flex justify-between items-start gap-4">
			<div class="flex-1 min-w-0">
				<h3 class="font-bold text-lg leading-tight text-gallery-900 truncate">
					{film.title}
				</h3>
				<p class="text-sm text-gallery-600 font-medium mt-1">
					{film.director}
					{#if film.length}
						<span class="text-gallery-300 mx-1.5">•</span>
						<span>{film.length} min</span>
					{/if}
				</p>
			</div>
			<div class="flex flex-col items-end gap-1">
				{#if film.score !== undefined}
					<span
						class="text-xl font-black leading-none"
						class:text-gallery-900={film.score < 100}
						class:text-green-600={film.score === 100}
					>
						{film.score.toFixed(0)}%
					</span>
				{/if}
				{#if film.avgRating}
					<span class="text-xs font-bold text-gallery-400">★ {film.avgRating.toFixed(1)}</span>
				{/if}
			</div>
		</div>

		<!-- Footer -->
		{#if film.curatorCount || (film.flags && film.flags.length > 0)}
			<div class="mt-auto pt-3 border-t border-gallery-100 flex items-center justify-between">
				{#if film.curatorCount}
					<div class="flex items-center gap-1.5">
						<span class="text-xs" style="color: var(--color-highlight-500)">★</span>
						<span class="text-[10px] font-black text-gallery-600 uppercase tracking-widest">
							{film.curatorCount} Curator{film.curatorCount !== 1 ? 's' : ''}
						</span>
					</div>
				{/if}
				{#if film.flags && film.flags.length > 0}
					<div class="flex gap-1">
						{#each film.flags.slice(0, 3) as flag}
							<span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded {flag.color}">
								{flag.label}
							</span>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</button>
