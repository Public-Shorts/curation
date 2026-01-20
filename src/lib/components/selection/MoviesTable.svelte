<!-- src/lib/components/selection/MoviesTable.svelte -->
<script lang="ts">
	import type { Movie } from '$lib/utils/types';
	import VoteBreakdown from './VoteBreakdown.svelte';
	import FlagBadge from '$lib/components/ui/FlagBadge.svelte';

	let { movies, sortKey, sortDir, setSort } = $props<{
		movies: Movie[];
		sortKey: string;
		sortDir: 'asc' | 'desc';
		setSort: (key: string) => void;
	}>();

	// Thresholds for visual indication
	const scoreThresholds = {
		selected: 65,
		maybe: 35
	};
</script>

<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
	<table class="w-full text-left text-sm">
		<thead
			class="bg-gray-50 border-b border-gray-200 text-[10px] uppercase text-gray-500 font-medium"
		>
			<tr>
				<th
					class="py-3 pl-4 cursor-pointer hover:text-gray-900"
					onclick={() => setSort('englishTitle')}
				>
					Title {sortKey === 'englishTitle' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</th>
				<th
					class="py-3 px-2 w-20 cursor-pointer hover:text-gray-900"
					onclick={() => setSort('reviewsCount')}
				>
					Reviews {sortKey === 'reviewsCount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</th>
				<th class="py-3 px-2 w-24">Votes</th>
				<th
					class="py-3 px-2 w-32 cursor-pointer hover:text-gray-900"
					onclick={() => setSort('score')}
				>
					Weighted Vote {sortKey === 'score' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</th>
				<th class="py-3 px-2 w-24">Flags</th>
				<th class="py-3 px-2 w-24">Action</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-100">
			{#each movies as movie (movie._id)}
				<tr
					class="hover:bg-gray-50/80 transition-colors"
					class:bg-green-50={(movie.score || 0) >= scoreThresholds.selected}
					class:bg-amber-50={(movie.score || 0) >= scoreThresholds.maybe &&
						(movie.score || 0) < scoreThresholds.selected}
					class:bg-red-50={(movie.reviewsCount || 0) > 0 &&
						(movie.score || 0) < scoreThresholds.maybe}
				>
					<!-- Title -->
					<td class="py-3 pl-4 pr-2 font-medium text-gray-900 align-top">
						<div class="truncate" title={movie.englishTitle}>
							{movie.englishTitle}
						</div>
						<div class="text-xs text-gray-400 font-normal mt-0.5">
							{movie.directorName} · {movie.length}m
						</div>
					</td>

					<!-- Reviews Count -->
					<td class="py-3 px-2 align-top pt-3.5">
						<span
							class="inline-flex items-center justify-center px-2 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700"
						>
							{movie.reviewsCount}
						</span>
					</td>

					<!-- Votes Breakdown -->
					<td class="py-3 px-2 align-top pt-3.5">
						<VoteBreakdown reviews={movie.reviews || []} />
					</td>

					<!-- Score -->
					<td class="py-3 px-2 align-top pt-3.5">
						{#if (movie.reviewsCount || 0) > 0}
							<div class="flex items-center gap-2">
								<span class="text-sm font-bold w-12 text-right">
									{movie.score?.toFixed(0)}%
								</span>
								<!-- Mini visual indicator -->
								<div class="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
									<div
										class="h-full {(movie.score || 0) >= scoreThresholds.selected
											? 'bg-green-500'
											: (movie.score || 0) >= scoreThresholds.maybe
												? 'bg-amber-400'
												: 'bg-red-400'}"
										style="width: {movie.score}%"
									></div>
								</div>
							</div>
						{:else}
							<span class="text-xs text-gray-300 ml-2">-</span>
						{/if}
					</td>

					<!-- Flags -->
					<td class="py-3 px-2 align-top pt-2">
						{#if movie.flags && movie.flags.length > 0}
							<div class="flex flex-col gap-1 items-start">
								{#each movie.flags as flag}
									<FlagBadge {flag} />
								{/each}
							</div>
						{:else}
							<span class="text-xs text-gray-300">-</span>
						{/if}
					</td>

					<!-- Action Button -->
					<td class="py-3 px-2 align-top pt-3">
						<a
							href="/review/{movie._id}"
							class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-black rounded transition-colors shadow-sm"
						>
							Review
						</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if movies.length === 0}
		<div class="p-12 text-center text-gray-500">No movies match the selected filters.</div>
	{/if}
</div>
