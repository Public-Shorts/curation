<script lang="ts">
	let { data } = $props();
	const submission = data.submission;
	const review = data.myReview ?? {};
	const otherReviews = data.otherReviews ?? [];

	const approvals = otherReviews.filter((r) => r.selection === 'selected');
	const maybes = otherReviews.filter((r) => r.selection === 'maybe');
	const rejections = otherReviews.filter((r) => r.selection === 'notSelected');
</script>

<div class="space-y-8">
	<header class="space-y-1">
		<h1 class="text-2xl font-semibold">{submission.englishTitle}</h1>
		{#if submission.originalTitle}
			<p class="text-sm text-gray-500 italic">{submission.originalTitle}</p>
		{/if}
		<p class="text-sm text-gray-500">
			Year: {submission.yearOfCompletion} · Length: {submission.length} · Language:
			{submission.filmLanguage}
		</p>
		<p class="text-xs text-gray-500">
			Categories:
			{submission.categories
				?.join(', ') +
				(submission.categories?.includes('other') && submission.categoryOther
					? `, ${submission.categoryOther}`
					: '')}
		</p>
	</header>
	<section class="space-y-2 border-t pt-4">
	<h2 class="text-xs font-semibold uppercase text-gray-500">Other curators</h2>

	{#if otherReviews.length === 0}
		<p class="text-sm text-gray-500">No other reviews yet.</p>
	{:else}
		<p class="text-sm text-gray-600">
			{otherReviews.length} review(s) from other curators ·
			<span class="text-green-700">{approvals.length} selected</span>,
			<span class="text-yellow-700">{maybes.length} maybe</span>,
			<span class="text-red-700">{rejections.length} not selected</span>
		</p>

		<ul class="text-xs text-gray-600 space-y-1">
			{#each otherReviews as r}
				<li>
					<strong>{r.curator?.name ?? 'Curator'}</strong>:
					{r.selection || '—'}
					{#if r.rating != null}
						· rating {r.rating}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

	<section class="grid gap-6 md:grid-cols-2">
		<div class="space-y-3">
			<h2 class="text-xs font-semibold uppercase text-gray-500">Credits</h2>
			<p class="text-sm">
				<span class="font-medium">Director: </span>{submission.directorName}
			</p>
			{#if submission.castAndCrew}
				<p class="text-sm">
					<span class="font-medium">Cast & crew: </span>{submission.castAndCrew}
				</p>
			{/if}
			{#if submission.socialMedia}
				<p class="text-sm">
					<span class="font-medium">Social media: </span>{submission.socialMedia}
				</p>
			{/if}
			{#if submission.website}
				<p class="text-sm">
					<span class="font-medium">Website: </span>{submission.website}
				</p>
			{/if}
			{#if submission.thanks}
				<p class="text-sm">
					<span class="font-medium">Thanks: </span>{submission.thanks}
				</p>
			{/if}
		</div>

		<div class="space-y-3">
			<h2 class="text-xs font-semibold uppercase text-gray-500">Screenings & links</h2>
			{#if submission.previousScreenings}
				<p class="text-sm">
					<span class="font-medium">Previous screenings: </span>{submission.previousScreenings}
				</p>
			{/if}
			{#if submission.previousScreeningLocations}
				<p class="text-sm">
					<span class="font-medium">Screening locations: </span>
					{submission.previousScreeningLocations}
				</p>
			{/if}
			{#if submission.linkToWatch}
				<p class="text-sm">
					<span class="font-medium">Link to watch: </span>
					<a
						href={submission.linkToWatch}
						target="_blank"
						rel="noreferrer"
						class="text-blue-600 underline"
						>Open</a
					>
				</p>
			{/if}
			{#if submission.linkToDownload}
				<p class="text-sm">
					<span class="font-medium">Link to download: </span>
					<a
						href={submission.linkToDownload}
						target="_blank"
						rel="noreferrer"
						class="text-blue-600 underline"
						>Open</a
					>
				</p>
			{/if}
		</div>
	</section>

	{#if submission.synopsis}
		<section class="max-w-2xl space-y-1">
			<h2 class="text-xs font-semibold uppercase text-gray-500">Synopsis</h2>
			<p class="text-sm leading-snug">{submission.synopsis}</p>
		</section>
	{/if}

	<section class="grid gap-6 md:grid-cols-2">
		<div class="space-y-2">
			<h2 class="text-xs font-semibold uppercase text-gray-500">Content notes</h2>
			<p class="text-sm">
				<span class="font-medium">Explicit content: </span>
				{submission.explicit ? 'Yes' : 'No'}
			</p>
			{#if submission.explicitDetails}
				<p class="text-sm">{submission.explicitDetails}</p>
			{/if}
			<p class="text-sm">
				<span class="font-medium">AI used: </span>{submission.aiUsed ? 'Yes' : 'No'}
			</p>
			{#if submission.aiExplanation}
				<p class="text-sm">{submission.aiExplanation}</p>
			{/if}
		</div>

		<div class="space-y-2">
			<h2 class="text-xs font-semibold uppercase text-gray-500">Additional info</h2>
			{#if submission.additionalInfo}
				<p class="text-sm">{submission.additionalInfo}</p>
			{/if}
			{#if submission.specialRequirements}
				<p class="text-sm">
					<span class="font-medium">Special requirements: </span>
					{submission.specialRequirements}
				</p>
			{/if}
		</div>
	</section>

	
	{#if submission.screenshots?.length || submission.poster}
		<section class="space-y-2">
			<h2 class="text-xs font-semibold uppercase text-gray-500">Materials</h2>
			{#if submission.poster}
				<p class="text-sm">
					<span class="font-medium">Poster:</span> {JSON.stringify(submission.poster)}
				</p>
			{/if}
			{#if submission.screenshots?.length}
				<p class="text-sm">
					<span class="font-medium">Screenshots:</span>
					{' '}
					{submission.screenshots.length} file(s)
				</p>
			{/if}
		</section>
	{/if}

	<section class="max-w-xl space-y-4 border-t pt-6">
		<h2 class="text-xs font-semibold uppercase text-gray-500">Your review</h2>

		<form method="POST" class="space-y-4">
			<div>
				<label class="mb-1 block text-sm font-medium">Selection</label>
				<select name="selection" class="w-full rounded border px-2 py-1" value={review.selection}>
					<option value="">–</option>
					<option value="selected">Selected</option>
					<option value="maybe">Maybe</option>
					<option value="notSelected">Not selected</option>
				</select>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium">Rating (1–5)</label>
				<input
					name="rating"
					type="number"
					min="1"
					max="5"
					class="w-20 rounded border px-2 py-1"
					value={review.rating}
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium">Tags (comma separated)</label>
				<input
					name="tags"
					type="text"
					class="w-full rounded border px-2 py-1"
					value={review.tags?.join(', ')}
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium">Additional comments</label>
				<textarea
					name="additionalComments"
					rows="4"
					class="w-full rounded border px-2 py-1"
				>{review.additionalComments}</textarea>
			</div>

			<button
				type="submit"
				class="rounded bg-black px-3 py-2 text-sm font-semibold text-white"
			>
				Save review
			</button>
		</form>
	</section>
</div>
