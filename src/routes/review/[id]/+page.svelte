<script lang="ts">
	import { enhance } from '$app/forms';
	import { getToastMessages } from '$lib/toast/toastMessages.svelte';

	const toastMessages = getToastMessages();
	let submitting = $state(false);
	
	let { data } = $props();
	const submission = data.submission;
	const review = data.myReview ?? {};
	const otherReviews = data.otherReviews ?? [];
	
	const approvals = otherReviews.filter(
		(r: typeof otherReviews[number]) => r.selection === 'selected'
	);
	const maybes = otherReviews.filter(
		(r: typeof otherReviews[number]) => r.selection === 'maybe'
	);
	const rejections = otherReviews.filter(
		(r: typeof otherReviews[number]) => r.selection === 'notSelected'
	);
	
	type Tag = {
		_type?: 'tag';
		_key?: string;
		label: string;
		value: string;
	};

	const allTags: Tag[] = data.allTags ?? [];

	const selectedTags = $state<Tag[]>(data.myReview?.tags ?? []);
	let search = $state('');
	let isOpen = $state(false);

	const filteredTags = $derived(
		allTags
			// remove already selected
			.filter((t) => !selectedTags.some((s) => s.value === t.value))
			// if search empty, show everything; otherwise filter
			.filter((t) =>
				search
					? t.label.toLowerCase().includes(search.toLowerCase())
					: true
			)
			.slice(0, 50)
	);

	function addTag(tag: Tag) {
		if (!selectedTags.some((t) => t.value === tag.value)) {
			selectedTags.push(tag);
		}
		search = '';
		isOpen = false;
	}

	function addNewTagFromSearch() {
		const label = search.trim();
		if (!label) return;

		const value = label.toLowerCase().replace(/\W/g, '-');

		if (!selectedTags.some((t) => t.value === value)) {
			selectedTags.push({ label, value });
		}
		search = '';
		isOpen = false;
	}

	function removeTag(tag: Tag) {
		const i = selectedTags.findIndex((t) => t.value === tag.value);
		if (i !== -1) selectedTags.splice(i, 1);
	}
</script>

<div class="space-y-8">
	<header class="space-y-1">
		<h1 class="text-2xl font-semibold">{submission.englishTitle}</h1>
		{#if submission.originalTitle}
			<p class="text-sm text-gray-500 italic">{submission.originalTitle}</p>
		{/if}
		<p class="text-sm text-gray-500">
			Year: {submission.yearOfCompletion} · Length: {submission.length} minute(s) · Language:
			{submission.filmLanguage}
		</p>
		<p class="text-xs text-gray-500">
			Categories:
			{submission.categories?.join(', ') +
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
					<span class="font-medium">Social media: </span><a href={submission.socialMedia}
						>{submission.socialMedia}</a
					>
				</p>
			{/if}
			{#if submission.website}
				<p class="text-sm">
					<span class="font-medium">Website: </span><a href={submission.website}
						>{submission.website}</a
					>
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
					>
						Open
					</a>
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
					>
						Open
					</a>
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
	<section class="max-w-xl space-y-4 border-t pt-6">
		<h2 class="text-xs font-semibold uppercase text-gray-500">Your review</h2>
		<form
			method="POST"
			class="space-y-4"
			use:enhance={() => {
				submitting = true;
				return async ({ result }) => {
					if (result.type === 'success') {
						const data = result.data as { success?: boolean; message?: string };

						if (data?.success) {
							toastMessages.add({ message: data.message ?? 'Review saved.', type: 'success' });
						} else {
							toastMessages.add({
								message: data?.message ?? 'Could not save review.',
								type: 'error'
							});
						}
					}
					submitting = false;
				};
			}}
		>
			<label for="suggestedGenre" class="block text-sm font-medium">Suggested Genre</label>
			<select
				name="suggestedGenre"
				class="w-full rounded border px-2 py-1"
				value={review.suggestedGenre}
			>
				<option selected value="">–</option>
				<option value="Fiction/Narrative">Fiction/Narrative</option>
				<option value="Documentary">Documentary</option>
				<option value="Animation">Animation</option>
				<option value="Experimental">Experimental</option>
				<option value="Essay Film">Essay Film</option>
				<option value="Hybrid">Hybrid</option>
			</select>
			<label for="contentNotes" class="block text-sm font-medium">Content Notes</label>
			<div class="space-y-2">
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						name="contentNotes"
						value="violence"
						checked={review.contentNotes?.includes('violence')}
					/>
					<span class="text-sm">Violence</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						name="contentNotes"
						value="sexualContent"
						checked={review.contentNotes?.includes('sexualContent')}
					/>
					<span class="text-sm">Sexual Content</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						name="contentNotes"
						value="strongLanguage"
						checked={review.contentNotes?.includes('strongLanguage')}
					/>
					<span class="text-sm">Strong Language</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						name="contentNotes"
						value="drugAlcoholUse"
						checked={review.contentNotes?.includes('drugAlcoholUse')}
					/>
					<span class="text-sm">Drug/Alcohol Use</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						name="contentNotes"
						value="horrorDisturbingImages"
						checked={review.contentNotes?.includes('horrorDisturbingImages')}
					/>
					<span class="text-sm">Horror/Disturbing Images</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						name="contentNotes"
						value="sensitiveThemes"
						checked={review.contentNotes?.includes('sensitiveThemes')}
					/>
					<span class="text-sm">Sensitive Themes</span>
				</label>
			</div>

			<div>
				<label for="rating" class="mb-1 block text-sm font-medium">Rating (0–5)</label>
				<input
					id="rating"
					name="rating"
					type="number"
					min="0"
					max="5"
					class="w-20 rounded border px-2 py-1"
					value={review.rating}
				/>
			</div>

			<div>
				<label for="additionalComments" class="mb-1 block text-sm font-medium">
					Additional comments
				</label>
				<textarea
					id="additionalComments"
					name="additionalComments"
					rows="4"
					class="w-full rounded border px-2 py-1">{review.additionalComments}</textarea
				>
			</div>
			<div class="space-y-2">
				<label for="tagsInput" class="block text-sm font-medium">Tags</label>

				<div class="flex flex-wrap gap-2">
					{#each selectedTags as tag}
						<span class="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-1 text-xs">
							{tag.label}
							<button
								type="button"
								onclick={() => removeTag(tag)}
								class="text-[10px] text-gray-600 hover:text-black"
							>
								×
							</button>
						</span>
					{/each}

					{#each selectedTags as tag}
						<input type="hidden" name="tags" value={tag.label} />
					{/each}
				</div>

				<input
					id="tagsInput"
					type="text"
					placeholder="Search or add tag…"
					class="mt-2 w-full rounded border px-2 py-1 text-sm"
					bind:value={search}
					onfocus={() => (isOpen = true)}
					onblur={() => {
						// small delay if you want clicks on list items to register first
						setTimeout(() => (isOpen = false), 100);
					}}
				/>

				{#if isOpen && filteredTags.length > 0}
					<ul
						class="mt-1 max-h-40 space-y-1 overflow-auto rounded border bg-white p-2 text-xs shadow"
					>
						{#each filteredTags as tag}
							<li>
								<button
									type="button"
									class="w-full rounded px-1 py-1 text-left hover:bg-gray-100"
									onclick={() => addTag(tag)}
								>
									{tag.label}
								</button>
							</li>
						{/each}
					</ul>
				{/if}

				{#if isOpen && search && !filteredTags.length}
					<button
						type="button"
						class="mt-1 rounded border px-2 py-1 text-xs hover:bg-gray-50"
						onclick={addNewTagFromSearch}
					>
						Create “{search}”
					</button>
				{/if}
			</div>
			<div>
				<label for="selection" class="mb-1 block text-sm font-medium">Selection</label>
				<select
					id="selection"
					name="selection"
					class="w-full rounded border px-2 py-1"
					value={review.selection}
				>
					<option value="">–</option>
					<option value="selected">Selected</option>
					<option value="maybe">Maybe</option>
					<option value="notSelected">Not selected</option>
				</select>
			</div>

			<button
				type="submit"
				class="rounded bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
				disabled={submitting}
			>
				{submitting ? 'Saving…' : 'Save review'}
			</button>
		</form>
	</section>
</div>
