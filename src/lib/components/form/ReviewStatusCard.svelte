<!-- src/lib/components/form/ReviewStatusCard.svelte -->
<script lang="ts">
	import { slide } from 'svelte/transition';
	import SelectionTag from '$lib/components/SelectionTag.svelte';
	import { Star, FileText, ChevronDown } from 'lucide-svelte';

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
		if (notes.size > 1 && (notes.has('none') || notes.has('None'))) {
			notes.delete('none');
			notes.delete('None');
		}
		return Array.from(notes).sort();
	});

	// Reviews with comments
	const reviewsWithComments = $derived(
		allReviews.filter((r: any) => r.additionalComments && r.additionalComments.trim().length > 0)
	);

	let commentsOpen = $state(false);
</script>

<section class="rounded-2xl bg-white shadow-sm ring-1 ring-gallery-200/60 overflow-hidden">
	<!-- Header with gradient -->
	<div class="bg-linear-to-r from-gallery-50 to-white px-5 py-4 sm:px-6 border-b border-gallery-100">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-semibold uppercase tracking-wider text-gallery-600">
				Curator Reviews
			</h2>
			{#if averageRating}
				<div
					class="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-200"
				>
					<Star class="w-4 h-4 text-amber-500" fill="currentColor" />
					<span>{averageRating}</span>
				</div>
			{/if}
		</div>
	</div>

	<div class="p-5 sm:p-6 space-y-6">
		{#if allReviews.length === 0}
			<div class="text-center py-8">
				<div class="w-12 h-12 rounded-full bg-gallery-100 flex items-center justify-center mx-auto mb-3">
					<FileText class="w-6 h-6 text-gallery-400" />
				</div>
				<p class="text-sm text-gallery-500">No reviews yet</p>
				<p class="text-xs text-gallery-400 mt-1">Be the first to review this film</p>
			</div>
		{:else}
			<!-- Stats Row -->
			<div class="flex flex-wrap items-center gap-3 sm:gap-4">
				<div class="flex items-center gap-2 bg-gallery-50 px-3 py-2 rounded-lg">
					<span class="text-lg font-bold text-gallery-900">{allReviews.length}</span>
					<span class="text-xs text-gallery-500 uppercase tracking-wide">Total</span>
				</div>
				<div class="h-6 w-px bg-gallery-200"></div>
				<div class="flex flex-wrap items-center gap-2 text-sm">
					<span class="inline-flex items-center gap-1.5 text-green-700 font-medium">
						<span class="w-2 h-2 rounded-full bg-green-500"></span>
						{approvals.length} Selected
					</span>
					<span class="inline-flex items-center gap-1.5 text-amber-700 font-medium">
						<span class="w-2 h-2 rounded-full bg-amber-500"></span>
						{maybes.length} Maybe
					</span>
					<span class="inline-flex items-center gap-1.5 text-red-700 font-medium">
						<span class="w-2 h-2 rounded-full bg-red-500"></span>
						{rejections.length} Not Selected
					</span>
				</div>
			</div>

			<!-- Reviewer Cards -->
			<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each allReviews as r}
					<div
						class="flex items-center justify-between rounded-xl border border-gallery-100 bg-gallery-50/50 px-4 py-3 text-sm transition-colors hover:bg-gallery-50 hover:border-gallery-200"
					>
						<span class="font-medium text-gallery-800 truncate mr-3">
							{r.curator?.name ?? 'Curator'}
						</span>
						<div class="flex items-center gap-2.5 shrink-0">
							<SelectionTag selection={r.selection} />
							{#if r.rating != null}
								<span class="text-gallery-300">·</span>
								<span class="font-semibold text-gallery-700 tabular-nums">{r.rating}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="border-t border-gallery-100"></div>

			<!-- TAGS & GENRES GRID -->
			<div class="grid gap-6 sm:grid-cols-2">
				<!-- Left: Genres & Content Notes -->
				<div class="space-y-5">
					{#if genreCounts.length > 0}
						<div>
							<h3 class="text-xs font-semibold text-gallery-500 uppercase tracking-wider mb-3">
								Suggested Genres
							</h3>
							<div class="flex flex-wrap gap-2">
								{#each genreCounts as [genre, count]}
									<span
										class="inline-flex items-center rounded-lg bg-gallery-100 px-3 py-1.5 text-sm text-gallery-700 font-medium"
									>
										{genre}
										{#if count > 1}
											<span class="ml-1.5 text-xs text-gallery-400 bg-white px-1.5 py-0.5 rounded">
												{count}
											</span>
										{/if}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					{#if allContentNotes.length > 0}
						<div>
							<h3 class="text-xs font-semibold text-gallery-500 uppercase tracking-wider mb-3">
								Content Notes
							</h3>
							<div class="flex flex-wrap gap-2">
								{#if allContentNotes && allContentNotes[0] != 'none' && allContentNotes.length > 0}
									{#each allContentNotes as note}
										<span
											class="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 font-medium capitalize"
										>
											{note.replace(/([A-Z])/g, ' $1').trim()}
										</span>
									{/each}
								{:else}
									<span class="text-sm text-gallery-400 italic">No content notes assigned yet.</span>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<!-- Right: All Tags -->
				<div>
					{#if uniqueTags.length > 0}
						<h3 class="text-xs font-semibold text-gallery-500 uppercase tracking-wider mb-3">
							All Tags
						</h3>
						<div class="flex flex-wrap gap-2">
							{#each uniqueTags as tag}
								<span
									class="inline-flex items-center rounded-full border border-gallery-200 bg-white px-3 py-1 text-sm text-gallery-600 transition-colors hover:border-gallery-300 hover:bg-gallery-50"
								>
									<span class="text-gallery-400 mr-1">#</span>{tag}
								</span>
							{/each}
						</div>
					{:else}
						<h3 class="text-xs font-semibold text-gallery-500 uppercase tracking-wider mb-3">
							All Tags
						</h3>
						<p class="text-sm text-gallery-400 italic">No tags assigned yet.</p>
					{/if}
				</div>
			</div>

			<!-- COLLAPSIBLE COMMENTS -->
			{#if reviewsWithComments.length > 0}
				<div class="border-t border-gallery-100 pt-5">
					<button
						onclick={() => (commentsOpen = !commentsOpen)}
						class="flex items-center gap-2 text-sm font-semibold text-gallery-600 uppercase tracking-wider hover:text-gallery-800 transition-colors w-full text-left group"
					>
						<span>{commentsOpen ? 'Hide' : 'Show'} Comments</span>
						<span class="text-gallery-400 font-normal normal-case">({reviewsWithComments.length})</span>
						<ChevronDown class="w-4 h-4 transition-transform duration-200 {commentsOpen ? 'rotate-180' : ''} ml-auto" />
					</button>

					{#if commentsOpen}
						<div transition:slide={{ duration: 200 }} class="mt-4 space-y-3">
							{#each reviewsWithComments as r}
								<div class="bg-gallery-50 rounded-xl p-4 border border-gallery-100">
									<div class="flex justify-between items-center mb-2">
										<span class="font-semibold text-sm text-gallery-800">
											{r.curator?.name ?? 'Curator'}
										</span>
										<SelectionTag selection={r.selection} />
									</div>
									<p class="whitespace-pre-wrap text-sm leading-relaxed text-gallery-600">
										{r.additionalComments}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</section>
