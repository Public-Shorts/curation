<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	interface Props {
		film: any;
		onClose: () => void;
	}

	let { film, onClose }: Props = $props();

	let allReviews = $derived(film?.reviews || []);
	let reviews = $derived(allReviews.filter((r: any) => !r.isJury));
	let juryReviews = $derived(allReviews.filter((r: any) => r.isJury));
	let selectedCount = $derived(reviews.filter((r: any) => r.selection === 'selected').length);
	let maybeCount = $derived(reviews.filter((r: any) => r.selection === 'maybe').length);
	let rejectedCount = $derived(reviews.filter((r: any) => r.selection === 'notSelected').length);

	let ratingsWithValue = $derived(reviews.filter((r: any) => r.rating != null));
	let avgRating = $derived(
		ratingsWithValue.length > 0
			? ratingsWithValue.reduce((sum: number, r: any) => sum + r.rating, 0) /
					ratingsWithValue.length
			: null
	);

	let allTags = $derived(
		[...new Set(allReviews.flatMap((r: any) => (r.tags || []).map((t: any) => t.label || t)))].slice(
			0,
			8
		)
	);

	let reviewsWithNotes = $derived(
		reviews.filter(
			(r: any) =>
				r.additionalComments ||
				(r.contentNotes?.length > 0 && !r.contentNotes.every((n: string) => n === 'none'))
		)
	);

	let juryReviewsWithNotes = $derived(
		juryReviews.filter(
			(r: any) =>
				r.additionalComments ||
				(r.contentNotes?.length > 0 && !r.contentNotes.every((n: string) => n === 'none'))
		)
	);
</script>

{#if film}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		tabindex="-1"
	>
		<div
			class="absolute inset-0 bg-black/60 backdrop-blur-sm"
			transition:fade={{ duration: 150 }}
		></div>

		<div
			class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header with Image -->
			<div class="relative h-48 bg-gallery-900">
				{#if film.poster?.asset?.url}
					<img
						src={`${film.poster.asset.url}?w=800&h=400&fit=crop`}
						alt={film.englishTitle || film.title}
						class="w-full h-full object-cover"
					/>
				{:else if film.screenshots?.[0]?.asset?.url}
					<img
						src={`${film.screenshots[0].asset.url}?w=800&h=400&fit=crop`}
						alt={film.englishTitle || film.title}
						class="w-full h-full object-cover"
					/>
				{/if}
				<div
					class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
				></div>

				<!-- Close button -->
				<button
					onclick={onClose}
					class="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
				>
					<span class="text-lg leading-none">&times;</span>
				</button>

				<!-- Title overlay -->
				<div class="absolute bottom-0 left-0 right-0 p-6">
					<h2 class="text-2xl font-black text-white leading-tight">
						{film.englishTitle || film.title}
					</h2>
					<p class="text-white/70 text-sm mt-1">
						{film.directorName || film.director}
						{#if film.length}
							<span class="mx-2">•</span>
							{film.length} min
						{/if}
					</p>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
				<!-- Quick Stats Row -->
				<div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-xs">
					{#if film.country}
						<span class="text-gallery-500">{film.country}</span>
					{/if}
					{#if film.filmLanguage}
						<span class="text-gallery-400">{film.filmLanguage}</span>
					{/if}
					{#if film._createdAt}
						<span class="text-gallery-400">•</span>
						<span class="text-gallery-500">
							Submitted {new Date(film._createdAt).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
						</span>
					{/if}
					{#if reviews.length > 0}
						<span class="text-gallery-400">•</span>
						<span class="font-medium text-gallery-600">
							{selectedCount}<span class="text-green-500 ml-0.5">✓</span>
							{maybeCount}<span class="text-yellow-500 ml-0.5">~</span>
							{rejectedCount}<span class="text-red-400 ml-0.5">✗</span>
						</span>
					{/if}
					{#if avgRating}
						<span class="font-bold text-gallery-700">★ {avgRating.toFixed(1)}</span>
					{/if}
				</div>

				<!-- Tags -->
				{#if allTags.length > 0}
					<div class="flex flex-wrap gap-1.5 mb-5">
						{#each allTags as tag}
							<span class="text-[10px] px-2 py-0.5 bg-gallery-100 text-gallery-600 rounded-full">
								{tag}
							</span>
						{/each}
					</div>
				{/if}

				<!-- Synopsis -->
				{#if film.synopsis}
					<div class="mb-5 pt-4 border-t border-gallery-100">
						<h3 class="text-[10px] font-bold uppercase tracking-wider text-gallery-500 mb-2">
							Synopsis
						</h3>
						<p class="text-sm text-gallery-700 leading-relaxed">{film.synopsis}</p>
					</div>
				{/if}

				<!-- Curator Notes -->
				{#if reviewsWithNotes.length > 0}
					<div class="mb-5 pt-4 border-t border-gallery-100">
						<h3 class="text-[10px] font-bold uppercase tracking-wider text-gallery-500 mb-3">
							Curator Notes
						</h3>
						<div class="space-y-3 max-h-48 overflow-y-auto">
							{#each reviewsWithNotes as review}
								<div class="p-3 bg-gallery-50 rounded-lg">
									{#if review.additionalComments}
										<p class="text-sm text-gallery-700">{review.additionalComments}</p>
									{/if}
									{#if review.contentNotes?.length > 0 && !review.contentNotes.every((n: string) => n === 'none')}
										<p class="text-xs text-gallery-500 mt-1 italic">
											Content warnings: {review.contentNotes
												.filter((n: string) => n !== 'none')
												.join(', ')}
										</p>
									{/if}
									<p class="text-xs text-gallery-400 mt-2">— {review.curatorName}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Jury Notes -->
				{#if juryReviewsWithNotes.length > 0}
					<div class="mb-5 pt-4 border-t border-indigo-100">
						<div class="flex items-center justify-between mb-3">
							<h3 class="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
								Jury Notes
							</h3>
							<span class="text-[10px] text-indigo-400">Not included in score</span>
						</div>
						<div class="space-y-3 max-h-48 overflow-y-auto">
							{#each juryReviewsWithNotes as review}
								<div class="p-3 bg-indigo-50 rounded-lg">
									{#if review.additionalComments}
										<p class="text-sm text-indigo-700">{review.additionalComments}</p>
									{/if}
									{#if review.contentNotes?.length > 0 && !review.contentNotes.every((n: string) => n === 'none')}
										<p class="text-xs text-indigo-500 mt-1 italic">
											Content warnings: {review.contentNotes
												.filter((n: string) => n !== 'none')
												.join(', ')}
										</p>
									{/if}
									<p class="text-xs text-indigo-400 mt-2">— {review.curatorName}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Screenshots -->
				{#if film.screenshots?.length > 1}
					<div class="mb-5 pt-4 border-t border-gallery-100">
						<h3 class="text-[10px] font-bold uppercase tracking-wider text-gallery-500 mb-3">
							Screenshots
						</h3>
						<div class="grid grid-cols-3 gap-2">
							{#each film.screenshots.slice(0, 6) as screenshot}
								{#if screenshot.asset?.url}
									<div class="aspect-video rounded-lg overflow-hidden bg-gallery-100">
										<img
											src={`${screenshot.asset.url}?w=300&h=169&fit=crop`}
											alt="Screenshot"
											class="w-full h-full object-cover"
										/>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				<!-- Links -->
				<div class="pt-4 border-t border-gallery-100 space-y-3">
					{#if film.linkPassword}
						<div
							class="flex items-center gap-2 bg-gallery-50 rounded-lg px-3 py-2 border border-gallery-100"
						>
							<span class="text-lg">🔑</span>
							<span class="text-xs text-gallery-500">Password:</span>
							<code
								class="text-sm font-mono text-gallery-700 bg-white px-2 py-1 rounded border border-gallery-200"
							>
								{film.linkPassword}
							</code>
						</div>
					{/if}
					<div class="flex items-center gap-3">
						<a
							href="/review/{film._id}"
							class="px-4 py-2 bg-gallery-100 text-gallery-700 rounded-lg text-sm font-semibold hover:bg-gallery-200 transition-colors"
						>
							Review
						</a>
						{#if film.linkToWatch}
							<a
								href={film.linkToWatch}
								target="_blank"
								rel="noopener noreferrer"
								class="px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-semibold hover:bg-accent-600 transition-colors"
							>
								Watch Film
							</a>
						{/if}
						{#if film.linkToDownload}
							<a
								href={film.linkToDownload}
								target="_blank"
								rel="noopener noreferrer"
								class="px-4 py-2 bg-gallery-700 text-white rounded-lg text-sm font-semibold hover:bg-gallery-800 transition-colors"
							>
								Download
							</a>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
