<!-- src/lib/components/form/ReviewStatusCard.svelte -->
<script lang="ts">
	import { slide } from 'svelte/transition';
	import SelectionTag from '../../../routes/SelectionTag.svelte';

	let { allReviews = [] } = $props();

	// --- Derived Statistics ---

	// Status counts
	const approvals = $derived(allReviews.filter((r: any) => r.selection === 'selected'));
	const maybes = $derived(allReviews.filter((r: any) => r.selection === 'maybe'));
	const rejections = $derived(allReviews.filter((r: any) => r.selection === 'notSelected'));

	// Average Rating
	const averageRating = $derived.by(() => {
		const ratedReviews = allReviews.filter((r: any) => typeof r.rating === 'number');
		if (ratedReviews.length === 0) return null;
		const sum = ratedReviews.reduce((acc: number, curr: any) => acc + curr.rating, 0);
		return (sum / ratedReviews.length).toFixed(1);
	});

	// Unique Tags (deduplicated)
	const uniqueTags = $derived.by(() => {
		const tags = new Set<string>();
		for (const r of allReviews) {
			if (Array.isArray(r.tags)) {
				r.tags.forEach((t: any) => tags.add(t.label || t));
			}
		}
		return Array.from(tags).sort();
	});

	// Suggested Genres (with counts)
	const genreCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const r of allReviews) {
			if (r.suggestedGenre) {
				counts[r.suggestedGenre] = (counts[r.suggestedGenre] || 0) + 1;
			}
		}
		return Object.entries(counts).sort((a, b) => b[1] - a[1]);
	});

	// Content Notes (deduplicated)
	const allContentNotes = $derived.by(() => {
		const notes = new Set<string>();
		for (const r of allReviews) {
			if (Array.isArray(r.contentNotes)) {
				r.contentNotes.forEach((note: string) => notes.add(note));
			}
		}
		// Remove 'none' if other notes exist, or keep it if it's the only one
		if (notes.size > 1 && notes.has('none')) {
			notes.delete('none');
		}
		return Array.from(notes).sort();
	});

	// Reviews with comments
	const reviewsWithComments = $derived(
		allReviews.filter((r: any) => r.additionalComments && r.additionalComments.trim().length > 0)
	);

	let commentsOpen = $state(false);
</script>

<section class="rounded-lg bg-white p-4 sm:p-6 shadow-sm ring-1 ring-gray-900/5 space-y-6">
	<!-- HEADER: Status & Average -->
	<div>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Review Status</h2>
			{#if averageRating}
				<div
					class="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded text-xs font-medium text-yellow-800 border border-yellow-200"
				>
					<span>★</span>
					<span>{averageRating} Avg</span>
				</div>
			{/if}
		</div>

		{#if allReviews.length === 0}
			<p class="text-sm text-gray-500 italic">No reviews yet.</p>
		{:else}
			<div class="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm mb-4 flex-wrap">
				<span class="font-medium text-gray-900">{allReviews.length} Total</span>
				<span class="h-4 w-px bg-gray-200"></span>
				<span class="text-green-700 font-medium">{approvals.length} Selected</span>
				<span class="text-yellow-700 font-medium">{maybes.length} Maybe</span>
				<span class="text-red-700 font-medium">{rejections.length} Not Selected</span>
			</div>

			<!-- Reviewer Cards -->
			<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each allReviews as r}
					<div
						class="flex items-center justify-between rounded border border-gray-100 bg-gray-50/50 px-3 py-2 text-xs"
					>
						<span class="font-medium text-gray-900 truncate mr-2">
							{r.curator?.name ?? 'Curator'}
						</span>
						<div class="flex items-center gap-2 shrink-0">
							<SelectionTag selection={r.selection} />
							{#if r.rating != null}
								<span class="text-gray-400">·</span>
								<span class="font-medium text-gray-700">{r.rating}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if allReviews.length > 0}
		<div class="border-t border-gray-100 my-4"></div>

		<!-- TAGS & GENRES GRID -->
		<div class="grid gap-6 sm:grid-cols-2">
			<!-- Left: Genres & Content Notes -->
			<div class="space-y-4">
				{#if genreCounts.length > 0}
					<div>
						<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
							Suggested Genres
						</h3>
						<div class="flex flex-wrap gap-1.5">
							{#each genreCounts as [genre, count]}
								<span
									class="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
								>
									{genre}
									{#if count > 1}<span class="ml-1 text-gray-400">({count})</span>{/if}
								</span>
							{/each}
						</div>
					</div>
				{/if}

				{#if allContentNotes.length > 0}
					<div>
						<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
							Content Notes
						</h3>
						<div class="flex flex-wrap gap-1.5">
							{#if allContentNotes.length > 0}
								<!-- content here -->
								{#each allContentNotes as note}
									<span
										class="inline-flex items-center rounded border border-red-100 bg-red-50 px-2 py-1 text-xs text-red-700 capitalize"
									>
										{note.replace(/([A-Z])/g, ' $1').trim()}
									</span>
								{/each}
							{:else}
								<span class="text-xs text-gray-400 italic">No content notes assigned yet.</span>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Right: All Tags -->
			<div>
				{#if uniqueTags.length > 0}
					<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
						All Tags
					</h3>
					<div class="flex flex-wrap gap-1.5">
						{#each uniqueTags as tag}
							<span
								class="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600"
							>
								#{tag}
							</span>
						{/each}
					</div>
				{:else}
					<p class="text-xs text-gray-400 italic">No tags assigned yet.</p>
				{/if}
			</div>
		</div>

		<!-- COLLAPSIBLE COMMENTS -->
		{#if reviewsWithComments.length > 0}
			<div class="border-t border-gray-100 pt-4 mt-2">
				<button
					onclick={() => (commentsOpen = !commentsOpen)}
					class="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-800 transition-colors w-full text-left"
				>
					<span
						>{commentsOpen ? 'Hide' : 'Show'} Additional Comments ({reviewsWithComments.length})</span
					>
					<svg
						class="w-4 h-4 transition-transform duration-200 {commentsOpen ? 'rotate-180' : ''}"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{#if commentsOpen}
					<div transition:slide={{ duration: 200 }} class="mt-3 space-y-3">
						{#each reviewsWithComments as r}
							<div class="bg-gray-50 rounded p-3 text-sm text-gray-700">
								<div class="flex justify-between items-baseline mb-1">
									<span class="font-medium text-xs text-gray-900"
										>{r.curator?.name ?? 'Curator'}</span
									>
									<span class="text-[10px] text-gray-400 uppercase tracking-wide"
										>{r.selection}</span
									>
								</div>
								<p class="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
									{r.additionalComments}
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</section>
