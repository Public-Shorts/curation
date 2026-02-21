<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { getToastMessages } from '$lib/toast/toastMessages.svelte';
	import TagSelector from './TagSelector.svelte';
	import type { Tag } from '$lib/utils/types';
	import { PenSquare, ChevronDown, Check, Loader2 } from 'lucide-svelte';

	let { review, allTags, submission } = $props();
	let submitting = $state(false);
	let togglingAdult = $state(false);

	const toastMessages = getToastMessages();

	let selectedTags = $state<Tag[]>(review.tags ?? []);
	let currentSelection = $state(review.selection);
	let adultChecked = $state(!!submission?.adult);

	let reviewStatus = $derived.by(() => {
		if (currentSelection === 'selected') return 'Selected';
		if (currentSelection === 'maybe') return 'Maybe';
		if (currentSelection === 'notSelected') return 'Not Selected';
		return 'No Selection Made';
	});

	let adultFormEl: HTMLFormElement;
</script>

<section class="mt-10 sm:mt-12">
	<!-- Adult Content Toggle (separate from review) -->
	<form
		method="POST"
		action="?/toggleAdult"
		bind:this={adultFormEl}
		class="bg-white rounded-2xl shadow-sm ring-1 ring-gallery-200/60 overflow-hidden mb-6"
		use:enhance={() => {
			togglingAdult = true;
			return async ({ result }) => {
				if (result.type === 'success') {
					const data = result.data as { success?: boolean; message?: string };
					if (data?.success) {
						toastMessages.add({ message: data.message ?? 'Updated.', type: 'success' });
						await invalidateAll();
					} else {
						toastMessages.add({
							message: data?.message ?? 'Could not update.',
							type: 'error'
						});
						adultChecked = !adultChecked;
					}
				} else {
					adultChecked = !adultChecked;
				}
				togglingAdult = false;
			};
		}}
	>
		<div class="bg-linear-to-r from-red-50 to-red-50/50 p-4 sm:p-5">
			<label class="flex items-center gap-4 cursor-pointer" class:opacity-60={togglingAdult}>
				<div class="relative">
					<input
						type="checkbox"
						name="adult"
						class="peer sr-only"
						bind:checked={adultChecked}
						onchange={() => adultFormEl.requestSubmit()}
						disabled={togglingAdult}
					/>
					<div
						class="w-11 h-6 bg-red-200 rounded-full peer-checked:bg-red-500 transition-colors"
					></div>
					<div
						class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5"
					></div>
				</div>
				<div class="flex-1">
					<span class="font-semibold text-red-900">Adult Content</span>
					<p class="text-sm text-red-700/80">Schedule during night hours only</p>
				</div>
				{#if togglingAdult}
					<Loader2 class="animate-spin w-4 h-4 text-red-400" />
				{/if}
			</label>
		</div>
	</form>

	<!-- Section Header -->
	<div class="flex items-center gap-3 mb-6">
		<div class="w-10 h-10 rounded-xl bg-gallery-900 flex items-center justify-center">
			<PenSquare class="w-5 h-5 text-white" />
		</div>
		<div>
			<h2 class="text-xl sm:text-2xl font-bold text-gallery-900">Your Review</h2>
			<p class="text-sm text-gallery-500">Rate and categorize this film</p>
		</div>
	</div>

	<form
		method="POST"
		action="?/saveReview"
		class="bg-white rounded-2xl shadow-sm ring-1 ring-gallery-200/60 overflow-hidden"
		use:enhance={() => {
			submitting = true;
			return async ({ result }) => {
				if (result.type === 'success') {
					const data = result.data as { success?: boolean; message?: string };
					if (data?.success) {
						toastMessages.add({ message: data.message ?? 'Review saved.', type: 'success' });
						await invalidateAll();
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
		<div class="p-5 sm:p-6 md:p-8 space-y-8">
			<!-- Main Form Grid -->
			<div class="grid gap-8 lg:grid-cols-2">
				<!-- Left Column: Selection & Rating -->
				<div class="space-y-6">
					<div>
						<label for="selection" class="block text-sm font-semibold text-gallery-800 mb-2">
							Selection Status
						</label>
						<div class="relative">
							<select
								id="selection"
								name="selection"
								class="w-full appearance-none rounded-xl border-gallery-200 bg-gallery-50 shadow-sm focus:border-gallery-400 focus:ring-gallery-400 text-base py-3 pl-4 pr-10 font-medium transition-colors hover:bg-gallery-100"
								class:text-green-600={reviewStatus === 'Selected'}
								class:bg-green-50={reviewStatus === 'Selected'}
								class:text-amber-600={reviewStatus === 'Maybe'}
								class:bg-amber-50={reviewStatus === 'Maybe'}
								class:text-red-600={reviewStatus === 'Not Selected'}
								class:bg-red-50={reviewStatus === 'Not Selected'}
								bind:value={currentSelection}
							>
								<option value="notSelected">Not Selected</option>
								<option value="maybe">Maybe</option>
								<option value="selected">Selected</option>
							</select>
				<ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gallery-400 pointer-events-none" />
						</div>
					</div>

					<div>
						<label for="suggestedGenre" class="block text-sm font-semibold text-gallery-800 mb-2">
							Suggested Genre
						</label>
						<div class="relative">
							<select
								id="suggestedGenre"
								name="suggestedGenre"
								class="w-full appearance-none rounded-xl border-gallery-200 bg-gallery-50 shadow-sm focus:border-gallery-400 focus:ring-gallery-400 text-base py-3 pl-4 pr-10 transition-colors hover:bg-gallery-100"
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
				<ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gallery-400 pointer-events-none" />
						</div>
					</div>

					<div>
						<label for="rating" class="block text-sm font-semibold text-gallery-800 mb-2">
							Rating
						</label>
						<div class="flex items-center gap-3">
							<input
								id="rating"
								name="rating"
								type="number"
								step="0.5"
								min="0"
								max="5"
								class="w-24 rounded-xl border-gallery-200 bg-gallery-50 shadow-sm focus:border-gallery-400 focus:ring-gallery-400 text-lg font-semibold py-3 text-center tabular-nums transition-colors hover:bg-gallery-100"
								value={review.rating}
							/>
							<span class="text-sm text-gallery-500">/ 5</span>
						</div>
					</div>
				</div>

				<!-- Right Column: Content Notes -->
				<div>
					<span class="block text-sm font-semibold text-gallery-800 mb-3">Content Notes</span>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each [{ val: 'violence', label: 'Violence', icon: '⚠️' }, { val: 'sexualContent', label: 'Sexual Content', icon: '🔞' }, { val: 'strongLanguage', label: 'Strong Language', icon: '🗣️' }, { val: 'drugAlcoholUse', label: 'Drug/Alcohol', icon: '🍺' }, { val: 'horrorDisturbingImages', label: 'Horror/Disturbing', icon: '👻' }, { val: 'sensitiveThemes', label: 'Sensitive Themes', icon: '💔' }] as item}
							<label
								class="group flex items-center gap-3 p-3 rounded-xl border border-gallery-100 bg-gallery-50/50 hover:bg-gallery-50 hover:border-gallery-200 cursor-pointer transition-all has-checked:bg-red-50 has-checked:border-red-200"
							>
								<input
									type="checkbox"
									name="contentNotes"
									value={item.val}
									class="sr-only peer"
									checked={review.contentNotes?.includes(item.val)}
								/>
								<div
									class="w-5 h-5 rounded-md border-2 border-gallery-300 flex items-center justify-center transition-all peer-checked:bg-red-500 peer-checked:border-red-500"
								>
						<Check class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
								</div>
								<span class="text-sm text-gallery-700 group-hover:text-gallery-900 peer-checked:text-red-700 transition-colors">
									{item.label}
								</span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<div class="border-t border-gallery-100"></div>

			<!-- Tags Section -->
			<div>
				<label for="tagsInput" class="block text-sm font-semibold text-gallery-800 mb-2">
					Tags
				</label>
				<TagSelector name="tags" bind:selectedTags {allTags} />
			</div>

			<!-- Comments Section -->
			<div>
				<label for="additionalComments" class="block text-sm font-semibold text-gallery-800 mb-2">
					Additional Comments
				</label>
				<textarea
					id="additionalComments"
					name="additionalComments"
					rows="4"
					class="w-full rounded-xl border-gallery-200 bg-gallery-50 shadow-sm focus:border-gallery-400 focus:ring-gallery-400 text-base p-4 transition-colors hover:bg-gallery-100 resize-none"
					placeholder="Private notes for the team...">{review.additionalComments}</textarea
				>
			</div>
		</div>

		<!-- Submit Footer -->
		<div class="bg-gallery-50 border-t border-gallery-100 px-5 py-4 sm:px-6 sm:py-5">
			<div class="flex items-center justify-between gap-4">
				<p class="text-sm text-gallery-500 hidden sm:block">
					Your review will be visible to other curators
				</p>
				<button
					type="submit"
					class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gallery-900 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-gallery-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gallery-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
					disabled={submitting}
				>
					{#if submitting}
			<Loader2 class="animate-spin w-5 h-5" />
						Saving...
					{:else}
			<Check class="w-5 h-5" />
						Save Review
					{/if}
				</button>
			</div>
		</div>
	</form>
</section>
