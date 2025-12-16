<!-- src/routes/review/[id]/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { getToastMessages } from '$lib/toast/toastMessages.svelte';

	type Tag = {
		_type?: 'tag';
		_key?: string;
		label: string;
		value: string;
	};

	let { data } = $props();
	const submission = data.submission;
	const review = data.myReview ?? {};
	const otherReviews = data.otherReviews ?? [];

	const approvals = otherReviews.filter(
		(r: any) => r.selection === 'selected'
	);
	const maybes = otherReviews.filter(
		(r: any) => r.selection === 'maybe'
	);
	const rejections = otherReviews.filter(
		(r: any) => r.selection === 'notSelected'
	);

	const allTags: Tag[] = data.allTags ?? [];
	const toastMessages = getToastMessages();

	let submitting = $state(false);

	// Tag state
	const selectedTags = $state<Tag[]>(review.tags ?? []);
	let search = $state('');
	let isOpen = $state(false);

	const filteredTags = $derived(
		allTags
			.filter((t) => !selectedTags.some((s) => s.value === t.value))
			.filter((t) =>
				search ? t.label.toLowerCase().includes(search.toLowerCase()) : true
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

<div class="max-w-4xl mx-auto space-y-8 p-6">
	<!-- Header Section -->
	<header class="space-y-3 pb-6 border-b border-gray-100">
		<div>
			<h1 class="text-3xl font-semibold tracking-tight text-gray-900">{submission.englishTitle}</h1>
			{#if submission.originalTitle}
				<p class="text-gray-500 italic mt-1">{submission.originalTitle}</p>
			{/if}
		</div>

		<div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
			<span class="inline-flex items-center gap-1.5">
				<span class="text-gray-400">Year:</span>
				{submission.yearOfCompletion}
			</span>
			<span class="inline-flex items-center gap-1.5">
				<span class="text-gray-400">Length:</span>
				{submission.length} min
			</span>
			<span class="inline-flex items-center gap-1.5">
				<span class="text-gray-400">Language:</span>
				{submission.filmLanguage}
			</span>
		</div>

		<div class="flex flex-wrap gap-2 pt-1">
			{#if submission.categories}
				{#each submission.categories as cat}
					<span
						class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
					>
						{cat}
					</span>
				{/each}
			{/if}
			{#if submission.categories?.includes('other') && submission.categoryOther}
				<span
					class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10"
				>
					{submission.categoryOther}
				</span>
			{/if}
		</div>
	</header>

	<!-- Other Curators Card -->
	<section class="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
		<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Review Status</h2>

		{#if otherReviews.length === 0}
			<p class="text-sm text-gray-500 italic">No other reviews yet.</p>
		{:else}
			<div class="flex items-center gap-4 text-sm mb-4">
				<span class="font-medium text-gray-900">{otherReviews.length} Total</span>
				<span class="h-4 w-px bg-gray-200"></span>
				<span class="text-green-700 font-medium">{approvals.length} selected</span>
				<span class="text-yellow-700 font-medium">{maybes.length} maybe</span>
				<span class="text-red-700 font-medium">{rejections.length} rejected</span>
			</div>

			<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each otherReviews as r}
					<div
						class="flex items-center justify-between rounded border border-gray-100 bg-gray-50/50 px-3 py-2 text-xs"
					>
						<span class="font-medium text-gray-900">{r.curator?.name ?? 'Curator'}</span>
						<div class="flex items-center gap-2">
							<span
								class={r.selection === 'selected'
									? 'text-green-700'
									: r.selection === 'maybe'
										? 'text-yellow-700'
										: r.selection === 'notSelected'
											? 'text-red-700'
											: 'text-gray-500'}
							>
								{r.selection === 'notSelected' ? 'Rejected' : r.selection || '—'}
							</span>
							{#if r.rating != null}
								<span class="text-gray-400">·</span>
								<span class="font-medium text-gray-700">{r.rating}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Info Grid -->
	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Credits -->
		<section class="space-y-4">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b pb-2">
				Credits
			</h2>
			<dl class="space-y-3 text-sm">
				<div>
					<dt class="font-medium text-gray-900">Director</dt>
					<dd class="text-gray-600 mt-0.5">{submission.directorName}</dd>
				</div>
				{#if submission.castAndCrew}
					<div>
						<dt class="font-medium text-gray-900">Cast & Crew</dt>
						<dd class="text-gray-600 mt-0.5">{submission.castAndCrew}</dd>
					</div>
				{/if}
				{#if submission.thanks}
					<div>
						<dt class="font-medium text-gray-900">Thanks</dt>
						<dd class="text-gray-600 mt-0.5">{submission.thanks}</dd>
					</div>
				{/if}
				{#if submission.socialMedia || submission.website}
					<div class="pt-2 flex flex-col gap-1">
						{#if submission.socialMedia}
							<a href={submission.socialMedia} target="_blank" class="text-blue-600 hover:underline"
								>Social Media</a
							>
						{/if}
						{#if submission.website}
							<a href={submission.website} target="_blank" class="text-blue-600 hover:underline"
								>Website</a
							>
						{/if}
					</div>
				{/if}
			</dl>
		</section>

		<!-- Screenings & Links -->
		<section class="space-y-4">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b pb-2">
				Screenings & Links
			</h2>
			<dl class="space-y-3 text-sm">
				{#if submission.previousScreenings}
					<div>
						<dt class="font-medium text-gray-900">Previous Screenings</dt>
						<dd class="text-gray-600 mt-0.5">{submission.previousScreenings}</dd>
					</div>
				{/if}
				{#if submission.previousScreeningLocations}
					<div>
						<dt class="font-medium text-gray-900">Locations</dt>
						<dd class="text-gray-600 mt-0.5">{submission.previousScreeningLocations}</dd>
					</div>
				{/if}

				<div class="flex gap-4 pt-2">
					{#if submission.linkToWatch}
						<a
							href={submission.linkToWatch}
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 ring-1 ring-inset ring-blue-700/10 transition-colors"
						>
							Watch Film ↗
						</a>
					{/if}
					{#if submission.linkToDownload}
						<a
							href={submission.linkToDownload}
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 ring-1 ring-inset ring-gray-600/10 transition-colors"
						>
							Download ↗
						</a>
					{/if}
				</div>
			</dl>
		</section>
	</div>

	<!-- Synopsis -->
	{#if submission.synopsis}
		<section class="space-y-3">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b pb-2">
				Synopsis
			</h2>
			<p class="text-sm leading-relaxed text-gray-700 max-w-3xl">{submission.synopsis}</p>
		</section>
	{/if}

	<!-- Technical / Content -->
	<div class="grid gap-8 lg:grid-cols-2 rounded-lg bg-gray-50 p-6 border border-gray-100">
		<div class="space-y-3">
			<h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Content Notes</h3>
			<dl class="space-y-2 text-sm">
				<div class="flex gap-2">
					<dt class="font-medium text-gray-900 min-w-24">Explicit:</dt>
					<dd class="text-gray-600">{submission.explicit ? 'Yes' : 'No'}</dd>
				</div>
				{#if submission.explicitDetails}
					<dd class="text-gray-500 italic pl-26 text-xs">{submission.explicitDetails}</dd>
				{/if}

				<div class="flex gap-2 mt-2">
					<dt class="font-medium text-gray-900 min-w-24">AI Used:</dt>
					<dd class="text-gray-600">{submission.aiUsed ? 'Yes' : 'No'}</dd>
				</div>
				{#if submission.aiExplanation}
					<dd class="text-gray-500 italic pl-26 text-xs">{submission.aiExplanation}</dd>
				{/if}
			</dl>
		</div>

		<div class="space-y-3">
			<h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Additional Info</h3>
			<div class="text-sm text-gray-600 space-y-2">
				{#if submission.additionalInfo}
					<p>{submission.additionalInfo}</p>
				{/if}
				{#if submission.specialRequirements}
					<p>
						<span class="font-medium text-gray-900">Requirements:</span>
						{submission.specialRequirements}
					</p>
				{/if}
				{#if !submission.additionalInfo && !submission.specialRequirements}
					<p class="italic text-gray-400">None provided</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Review Form -->
	<section class="mt-12 border-t pt-8">
		<h2 class="text-xl font-semibold mb-6">Your Review</h2>

		<form
			method="POST"
			class="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6 md:p-8 space-y-8"
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
			<div class="grid gap-8 md:grid-cols-2">
				<!-- Left Column -->
				<div class="space-y-6">
					<div>
						<label for="selection" class="block text-sm font-medium text-gray-700 mb-2"
							>Selection Status</label
						>
						<select
							id="selection"
							name="selection"
							class="w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm py-2.5"
							value={review.selection}
							required
						>
							<option value="selected">Selected</option>
							<option value="maybe">Maybe</option>
							<option value="notSelected">Not selected</option>
						</select>
					</div>

					<div>
						<label for="suggestedGenre" class="block text-sm font-medium text-gray-700 mb-2"
							>Suggested Genre</label
						>
						<select
							id="suggestedGenre"
							name="suggestedGenre"
							class="w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm py-2.5"
							value={review.suggestedGenre}
						>
							<option selected value="">– Select Genre –</option>
							<option value="Fiction/Narrative">Fiction/Narrative</option>
							<option value="Documentary">Documentary</option>
							<option value="Animation">Animation</option>
							<option value="Experimental">Experimental</option>
							<option value="Essay Film">Essay Film</option>
							<option value="Hybrid">Hybrid</option>
						</select>
					</div>

					<div>
						<label for="rating" class="block text-sm font-medium text-gray-700 mb-2"
							>Rating (0–5)</label
						>
						<input
							id="rating"
							name="rating"
							type="number"
							step="0.5"
							min="0"
							max="5"
							class="w-24 rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm py-2.5"
							value={review.rating}
							required
						/>
					</div>
				</div>

				<!-- Right Column -->
				<div class="space-y-6">
					<div>
						<span class="block text-sm font-medium text-gray-700 mb-3">Content Notes</span>
						<div class="grid grid-cols-2 gap-3">
							{#each [{ val: 'violence', label: 'Violence' }, { val: 'sexualContent', label: 'Sexual Content' }, { val: 'strongLanguage', label: 'Strong Language' }, { val: 'drugAlcoholUse', label: 'Drug/Alcohol' }, { val: 'horrorDisturbingImages', label: 'Horror/Disturbing' }, { val: 'sensitiveThemes', label: 'Sensitive Themes' }] as item}
								<label
									class="flex items-center gap-3 p-2 rounded border border-gray-100 bg-gray-50/50 hover:bg-gray-50 cursor-pointer"
								>
									<input
										type="checkbox"
										name="contentNotes"
										value={item.val}
										class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
										checked={review.contentNotes?.includes(item.val)}
									/>
									<span class="text-sm text-gray-700">{item.label}</span>
								</label>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<!-- Full Width Fields -->
			<div>
				<label for="tagsInput" class="block text-sm font-medium text-gray-700 mb-2">Tags</label>
				<div
					class="rounded-lg border border-gray-300 bg-white p-2 focus-within:ring-1 focus-within:ring-black focus-within:border-black"
				>
					<div class="flex flex-wrap gap-2 mb-2">
						{#each selectedTags as tag}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800"
							>
								{tag.label}
								<button
									type="button"
									onclick={() => removeTag(tag)}
									class="ml-1 text-gray-500 hover:text-black focus:outline-none"
								>
									×
								</button>
							</span>
							<input type="hidden" name="tags" value={tag.label} />
						{/each}
					</div>

					<div class="relative">
						<input
							id="tagsInput"
							type="text"
							placeholder={selectedTags.length ? 'Add another tag...' : 'Search or create tags...'}
							class="w-full border-0 p-0 text-sm focus:ring-0 placeholder:text-gray-400"
							bind:value={search}
							onfocus={() => (isOpen = true)}
							onblur={() => setTimeout(() => (isOpen = false), 150)}
							autocomplete="off"
						/>

						{#if isOpen && (filteredTags.length > 0 || search)}
							<ul
								class="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
							>
								{#each filteredTags as tag}
									<li>
										<button
											type="button"
											class="w-full text-left px-4 py-2 hover:bg-gray-100"
											onmousedown={() => addTag(tag)}
										>
											{tag.label}
										</button>
									</li>
								{/each}
								{#if search && !filteredTags.length}
									<li>
										<button
											type="button"
											class="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium"
											onmousedown={addNewTagFromSearch}
										>
											Create "{search}"
										</button>
									</li>
								{/if}
							</ul>
						{/if}
					</div>
				</div>
			</div>

			<div>
				<label for="additionalComments" class="block text-sm font-medium text-gray-700 mb-2">
					Additional Comments
				</label>
				<textarea
					id="additionalComments"
					name="additionalComments"
					rows="4"
					class="w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3"
					placeholder="Private notes for the team...">{review.additionalComments}</textarea
				>
			</div>

			<div class="pt-4 flex items-center justify-end border-t border-gray-100">
				<button
					type="submit"
					class="inline-flex justify-center rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
					disabled={submitting}
				>
					{submitting ? 'Saving Review...' : 'Save Review'}
				</button>
			</div>
		</form>
	</section>
</div>
