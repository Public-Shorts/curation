<script lang="ts">
	import { enhance } from '$app/forms';
	import { getToastMessages } from '$lib/toast/toastMessages.svelte';
	import TagSelector from './TagSelector.svelte';
	import type { Tag } from '$lib/utils/types';

	let { review, allTags, submission } = $props();
	let submitting = $state(false);

	const toastMessages = getToastMessages();

	let selectedTags = $state<Tag[]>(review.tags ?? []);

    // 1. Create local state for the input
    let currentSelection = $state(review.selection);

    // 2. Derive status from the LOCAL state, not the prop
    let reviewStatus = $derived.by(() => {
        if (currentSelection === 'selected') return 'Selected';
        if (currentSelection === 'maybe') return 'Maybe'; // Assuming 'maybe' maps to 'Maybe' in UI
        if (currentSelection === 'notSelected') return 'Not Selected';
        return 'No Selection Made';
    });

    let isAdult = $state(!!submission?.adult);
</script>

<section class="mt-8 sm:mt-12 border-t pt-6 sm:pt-8">
	<h2 class="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Your Review</h2>

	<form
		method="POST"
		class="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8"
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
		<div class="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
			<label class="flex items-center gap-3 cursor-pointer">
				<input
					type="checkbox"
					name="adult"
					class="h-5 w-5 rounded border-red-300 text-red-600 focus:ring-red-600"
					bind:checked={isAdult}
				/>
				<div class="flex flex-col">
					<span class="font-semibold text-red-900">Mark as Adult Content</span>
					<span class="text-sm text-red-700">Video will only be scheduled during night hours</span>
				</div>
			</label>
		</div>

		<div class="grid gap-6 sm:gap-8 md:grid-cols-2">
			<!-- Left Column -->
			<div class="space-y-6">
				<div>
					<label
						for="selection"
						class="flex gap-2 items-center text-sm font-medium text-gray-700 mb-2"
					>
						<p>Selection Status</p>
					</label>

					<select
						id="selection"
						name="selection"
						class="w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm sm:text-base py-2.5"
						class:text-green-600={reviewStatus === 'Selected'}
						class:text-yellow-600={reviewStatus === 'Maybe'}
						class:text-red-600={reviewStatus === 'Not Selected'}
						bind:value={currentSelection}
						required
					>
						<!-- Ensure this matches your schema value -->
						<option value="notSelected">Not selected</option>
						<option value="maybe">Maybe</option>
						<option value="selected">Selected</option>
					</select>
				</div>

				<div>
					<label for="suggestedGenre" class="block text-sm font-medium text-gray-700 mb-2"
						>Suggested Genre</label
					>
					<select
						id="suggestedGenre"
						name="suggestedGenre"
						class="w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm sm:text-base py-2.5"
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
						class="w-24 rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm sm:text-base py-2.5"
						value={review.rating}
						required
					/>
				</div>
			</div>

			<!-- Right Column -->
			<div class="space-y-6">
				<div>
					<span class="block text-sm font-medium text-gray-700 mb-3">Content Notes</span>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
						{#each [{ val: 'violence', label: 'Violence' }, { val: 'sexualContent', label: 'Sexual Content' }, { val: 'strongLanguage', label: 'Strong Language' }, { val: 'drugAlcoholUse', label: 'Drug/Alcohol' }, { val: 'horrorDisturbingImages', label: 'Horror/Disturbing' }, { val: 'sensitiveThemes', label: 'Sensitive Themes' }] as item}
							<label
								class="flex items-center gap-3 p-2.5 sm:p-2 rounded border border-gray-100 bg-gray-50/50 hover:bg-gray-50 cursor-pointer"
							>
								<input
									type="checkbox"
									name="contentNotes"
									value={item.val}
									class="h-4 w-4 rounded border-gray-300 text-black focus:ring-black shrink-0"
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
			<TagSelector name="tags" bind:selectedTags {allTags} />
		</div>

		<div>
			<label for="additionalComments" class="block text-sm font-medium text-gray-700 mb-2">
				Additional Comments
			</label>
			<textarea
				id="additionalComments"
				name="additionalComments"
				rows="4"
				class="w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm sm:text-base p-3"
				placeholder="Private notes for the team...">{review.additionalComments}</textarea
			>
		</div>

		<div class="pt-4 flex items-center justify-end border-t border-gray-100">
			<button
				type="submit"
				class="w-full sm:w-auto inline-flex justify-center rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
				disabled={submitting}
			>
				{submitting ? 'Saving Review...' : 'Save Review'}
			</button>
		</div>
	</form>
</section>
