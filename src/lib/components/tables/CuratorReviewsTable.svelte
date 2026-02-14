<!-- src/lib/components/curator/CuratorReviewsTable.svelte -->
<script lang="ts">
    import SelectionTag from '$lib/components/SelectionTag.svelte';

    // 1. Give 'reviews' a default value of [] to prevent "undefined" errors
    let { reviews = [], onFilmClick }: { reviews: any[]; onFilmClick?: (id: string) => void } = $props();

    let isExpanded = $state(true);
    let sortField = $state('englishTitle');
    let sortDirection = $state(1);

    // 2. Add a safety check (|| []) inside the derived logic
    let sortedReviews = $derived([...(reviews || [])].sort((a, b) => {
        let valA, valB;

        if (sortField === 'selection') {
            valA = a.myReview?.selection || '';
            valB = b.myReview?.selection || '';
        } else {
            valA = a[sortField]?.toLowerCase() || '';
            valB = b[sortField]?.toLowerCase() || '';
        }

        if (valA < valB) return -1 * sortDirection;
        if (valA > valB) return 1 * sortDirection;
        return 0;
    }));

    function handleSort(field: string) {
        if (sortField === field) {
            sortDirection *= -1;
        } else {
            sortField = field;
            sortDirection = 1;
        }
    }
</script>

<section class="space-y-6 pb-12">
	<header
		class="flex cursor-pointer items-center justify-between"
		role="button"
		tabindex="0"
		onclick={() => (isExpanded = !isExpanded)}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (isExpanded = !isExpanded)}
	>
		<h2 class="text-2xl font-semibold">Reviews</h2>
		<div class="flex items-center gap-2">
			<!-- Safety check here too -->
			<p class="text-sm text-gray-500">
				Total: {reviews?.length || 0}
			</p>
			<span class="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
		</div>
	</header>

	{#if isExpanded}
		{#if (reviews || []).length === 0}
			<div class="rounded-lg bg-gray-50 p-8 text-center">
				<p class="text-gray-500">You haven't reviewed any submissions yet.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead class="border-b text-[10px] uppercase text-gray-500">
						<tr>
							<th
								class="cursor-pointer py-2 hover:text-gray-700 select-none"
								onclick={() => handleSort('englishTitle')}
							>
								Title {sortField === 'englishTitle' ? (sortDirection === 1 ? '↑' : '↓') : ''}
							</th>
							<th
								class="cursor-pointer py-2 hover:text-gray-700 select-none"
								onclick={() => handleSort('selection')}
							>
								Selection {sortField === 'selection' ? (sortDirection === 1 ? '↑' : '↓') : ''}
							</th>
							<th class="py-2">Review</th>
						</tr>
					</thead>
					<tbody>
						{#each sortedReviews as s (s._id)}
							<tr class="border-b align-top last:border-0 hover:bg-gray-50">
								<td
									class="truncate-cell py-2 pr-4 font-medium text-gray-900"
									title={s.englishTitle}
								>
									{#if onFilmClick}
										<button
											class="text-left hover:text-black transition-colors cursor-pointer"
											onclick={() => onFilmClick(s._id)}
										>
											{s.englishTitle}
										</button>
									{:else}
										{s.englishTitle}
									{/if}
								</td>

								<td class="truncate-cell py-2 pr-4">
									<SelectionTag selection={s.myReview?.selection} />
								</td>

								<td class="py-2 pr-2">
									<a
										href={`/review/${s._id}`}
										class="rounded border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-100"
									>
										Review
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</section>
