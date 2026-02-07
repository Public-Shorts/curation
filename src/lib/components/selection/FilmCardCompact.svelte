<script lang="ts">
	interface Props {
		film: any;
		onclick?: () => void;
	}

	let { film, onclick }: Props = $props();
</script>

<button
	{onclick}
	class="flex items-center gap-3 bg-white p-3 rounded-lg border border-gallery-100 hover:border-gallery-300 hover:shadow-md transition-all w-full text-left cursor-pointer"
	class:opacity-30={!film.isVisible}
	class:grayscale={!film.isVisible}
	class:pointer-events-none={!film.isVisible}
>
	<!-- Thumbnail -->
	<div class="h-12 w-20 rounded bg-gallery-100 flex-shrink-0 overflow-hidden">
		{#if film.poster?.asset}
			<img
				src={`${film.poster.asset.url}?w=200&h=120&fit=crop`}
				alt={film.title}
				class="h-full w-full object-cover"
			/>
		{:else if film.screenshots?.[0]?.asset}
			<img
				src={`${film.screenshots[0].asset.url}?w=200&h=120&fit=crop`}
				alt={film.title}
				class="h-full w-full object-cover"
			/>
		{:else}
			<div class="h-full w-full flex items-center justify-center text-xs text-gallery-400">🎬</div>
		{/if}
	</div>

	<!-- Info -->
	<div class="flex-1 min-w-0">
		<h4 class="font-bold text-sm text-gallery-900 truncate">
			{film.title}
		</h4>
		<p class="text-xs text-gallery-500">{film.director}</p>
	</div>

	<!-- Duration -->
	<div class="w-16 text-center">
		<span class="text-xs font-medium text-gallery-500">{film.length}m</span>
	</div>

	<!-- Score -->
	<div class="w-16 text-right">
		{#if film.score !== undefined}
			<span
				class="text-lg font-black"
				class:text-gallery-900={film.score < 100}
				class:text-green-600={film.score === 100}
			>
				{film.score.toFixed(0)}%
			</span>
		{/if}
	</div>
</button>
