<!-- src/lib/components/selection/MoviesTable.svelte -->
<script lang="ts">
	import ApprovalBar from "./ApprovalBar.svelte";

  let { movies, sortKey, sortDir, setSort } = $props();
  const approvalRateThresholds = {
	high: 75,
	medium: 50
  };
  const getScoreColor = (score: number) => {
		if (score >= 75) return 'bg-green-500';
		if (score >= 50) return 'bg-yellow-500';
		return 'bg-red-500';
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
				<th
					class="py-3 px-2 w-32 cursor-pointer hover:text-gray-900"
					onclick={() => setSort('approvalRate')}
				>
					Approval {sortKey === 'approvalRate' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</th>
				<th
					class="py-3 px-2 w-24 cursor-pointer hover:text-gray-900"
					onclick={() => setSort('averageRating')}
				>
					Avg Rating {sortKey === 'averageRating' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</th>
				<th class="py-3 px-2">Categories & Tags</th>
				<th class="py-3 px-2 w-24">Flags</th>
				<th class="py-3 px-2 w-24">Action</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-100">
			{#each movies as movie (movie._id)}
				<tr
					class="hover:bg-gray-50/80 transition-colors"
					class:bg-green-50={movie.reviewsCount >= 2 &&
						movie.approvalRate >= approvalRateThresholds.high}
					class:bg-orange-50={movie.reviewsCount >= 2 &&
						movie.approvalRate >= approvalRateThresholds.medium &&
						movie.approvalRate < approvalRateThresholds.high}
					class:bg-red-50={movie.reviewsCount >= 2 &&
						movie.approvalRate < approvalRateThresholds.medium}
				>
					<!-- Title -->
					<td class="py-3 pl-4 pr-2 font-medium text-gray-900 align-top">
						<div class="truncate" title={movie.englishTitle}>
							{movie.englishTitle}
						</div>
						<div class="text-xs text-gray-400 font-normal mt-0.5">
							{movie.filmLanguage} · {movie.length}m
						</div>
					</td>

					<!-- Reviews Count -->
					<td class="py-3 px-2 align-top pt-3.5">
						<span
							class="inline-flex items-center justify-center px-2 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700"
						>
							{movie.reviewsCount}
						</span>
					</td>

					<!-- Approval -->
					<td class="py-3 px-2 align-top pt-3.5">
						<!-- Pass the raw reviews array to the new component -->
						<ApprovalBar reviews={movie.reviews} />
					</td>

					<!-- Rating -->
					<td class="py-3 px-2 align-top pt-3">
						{#if movie.averageRating > 0}
							<span
								class="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-[11px] font-semibold text-gray-700 border border-gray-200"
							>
								★ {movie.averageRating.toFixed(1)}
							</span>
						{:else}
							<span class="text-xs text-gray-400 pl-1">-</span>
						{/if}
					</td>

					<!-- Combined Categories & Tags Display -->
					<td class="py-3 px-2 align-top">
						<div class="flex flex-col gap-1.5">
							<!-- Genre -->
							<div class="flex flex-wrap gap-1 max-w-75">
								{#each movie.displayCategories as cat}
									<span
										class="inline-flex items-center rounded-sm bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
									>
										{cat}
									</span>
								{/each}
							</div>
							<!-- Curator Tags -->
							{#if movie.curatorTags.length > 0}
								<div class="flex flex-wrap gap-1 max-w-75">
									{#each movie.curatorTags as tag}
										<span
											class="inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10"
										>
											#{tag}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</td>
					<td class="py-3 px-2 align-top pt-2">
						{#if movie.flags.length > 0}
							<div class="flex flex-col gap-1 items-start">
								{#each movie.flags as flag}
									<div class="group relative inline-flex" title={flag.details}>
										<span
											class="cursor-help px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border {flag.color}"
										>
											{flag.label}
										</span>

										<!-- Optional: Custom Tooltip if you don't want standard browser 'title' -->
										<!-- 
											<div class="absolute left-0 bottom-full mb-1 hidden group-hover:block w-48 bg-gray-900 text-white text-xs p-2 rounded z-10 shadow-lg">
												{flag.details}
											</div> 
											-->
									</div>
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
							class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
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
