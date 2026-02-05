<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import SelectionTag from '$lib/components/SelectionTag.svelte';
	import { getToastMessages } from '$lib/toast/toastMessages.svelte';

	let { data } = $props();
	const toastMessages = getToastMessages();

	// Derived state
	let stats = $derived(data.stats);
	let myReviews = $derived(data.myReviews);
	let highlightedIds = $derived(data.curator?.highlights?.map((h: any) => h._id) || []);

	// Helper to check if highlighted
	function isHighlighted(submissionId: string) {
		return highlightedIds.includes(submissionId);
	}
</script>

<div class="space-y-8">
	<!-- Header with Stats -->
	<header>
		<h1 class="text-3xl font-bold mb-4">My Reviews</h1>

		<div class="grid gap-4 md:grid-cols-3">
			<div class="rounded-lg bg-white p-4 shadow-sm border border-gallery-100">
				<p class="text-xs uppercase text-gallery-500">Total Reviews</p>
				<p class="mt-1 text-2xl font-semibold">{stats.totalReviews}</p>
			</div>

			<div class="rounded-lg bg-white p-4 shadow-sm border border-gallery-100">
				<p class="text-xs uppercase text-gallery-500">Highlight Quota</p>
				<div class="mt-1 flex items-baseline gap-2">
					<p class="text-2xl font-semibold">
						{highlightedIds.length}
						<span class="text-sm font-normal text-gallery-400">/ {stats.maxHighlights}</span>
					</p>
				</div>
				<div class="mt-2 w-full bg-gallery-100 rounded-full h-1.5 overflow-hidden">
					<div
						class="bg-black h-full transition-all"
						style="width: {Math.min(
							100,
							(highlightedIds.length / (stats.maxHighlights || 1)) * 100
						)}%"
					></div>
				</div>
			</div>

			<div class="rounded-lg bg-white p-4 shadow-sm border border-gallery-100">
				<p class="text-xs uppercase text-gallery-500">Next Slot</p>
				{#if stats.remainingQuota > 0}
					<p class="mt-1 text-sm text-green-600 font-medium">
						You have {stats.remainingQuota} slot/s available!
					</p>
				{:else}
					<p class="mt-1 text-sm text-gallery-600">
						Watch <span class="font-bold text-black">{stats.additionalReviewsNeeded}</span> more videos
						to unlock a new highlight slot.
					</p>
				{/if}
			</div>
		</div>
	</header>

	<!-- Reviews Table -->
	<section class="rounded-lg bg-white shadow-sm border border-gallery-100 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="bg-gallery-50 border-b text-[10px] uppercase text-gallery-500">
					<tr>
						<th class="py-3 px-4">Film</th>
						<th class="py-3 px-4">My Selection</th>
						<th class="py-3 px-4">Rating</th>
						<th class="py-3 px-4 text-center">Highlight</th>
						<th class="py-3 px-4 text-right">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each myReviews as review}
						<tr class="hover:bg-gallery-50/50 transition-colors">
							<td class="py-3 px-4">
								<div class="font-medium">{review.submission.englishTitle}</div>
								<div class="text-xs text-gallery-500">
									{review.submission.originalTitle !== review.submission.englishTitle
										? review.submission.originalTitle
										: ''}
								</div>
							</td>
							<td class="py-3 px-4">
								<SelectionTag selection={review.selection} />
							</td>
							<td class="py-3 px-4 font-mono">
								{review.rating ?? '-'} / 5
							</td>
							<td class="py-3 px-4 text-center">
								<form
									method="POST"
									action="?/toggleHighlight"
									use:enhance={() => {
										return async ({ result }) => {
											if (result.type === 'failure') {
												toastMessages.add({
													message: (result as any).data?.error || 'Failed to update highlight',
													type: 'error'
												});
											} else if (result.type === 'success') {
												toastMessages.add({
													message:
														(result as any).data?.status === 'added'
															? 'Added to highlights'
															: 'Removed from highlights',
													type: 'success'
												});
											}
											// Invalidate to reload data
											await invalidateAll();
										};
									}}
								>
									<input type="hidden" name="submissionId" value={review.submission._id} />
									<button
										class="p-2 rounded-full hover:bg-gallery-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black/5"
										title={isHighlighted(review.submission._id)
											? 'Remove Highlight'
											: 'Add Highlight'}
										type="submit"
									>
										{#if isHighlighted(review.submission._id)}
											<span class="text-lg" style="color: var(--color-highlight-500)">★</span>
										{:else}
											<span class="text-gallery-300 text-lg hover:text-gallery-400">☆</span>
										{/if}
									</button>
								</form>
							</td>
							<td class="py-3 px-4 text-right">
								<a
									href={`/review/${review.submission._id}`}
									class="inline-block rounded border border-gallery-200 px-3 py-1.5 text-xs font-medium hover:bg-gallery-50 hover:border-gallery-300 transition-all"
								>
									Edit Review
								</a>
							</td>
						</tr>
					{/each}
					{#if myReviews.length === 0}
						<tr>
							<td colspan="5" class="py-12 text-center text-gallery-500">
								You haven't made any reviews yet.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</section>
</div>
