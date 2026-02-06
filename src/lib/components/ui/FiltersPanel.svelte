<script lang="ts">
	import { Filter } from 'lucide-svelte';

	type FilterState = {
		reviewStatus: 'all' | 'reviewed' | 'not-reviewed';
		selectionStatus: 'all' | 'selected' | 'maybe' | 'rejected' | 'no-reviews';
		hasFlags: 'all' | 'yes' | 'no';
		languages: Set<string>;
		categories: Set<string>;
	};

	let {
		filters = $bindable(),
		availableLanguages,
		availableCategories
	} = $props<{
		filters: FilterState;
		availableLanguages: string[];
		availableCategories: string[];
	}>();

	let showFilters = $state(false);

	function toggleLanguage(lang: string) {
		if (filters.languages.has(lang)) {
			filters.languages.delete(lang);
		} else {
			filters.languages.add(lang);
		}
		filters.languages = new Set(filters.languages);
	}

	function toggleCategory(cat: string) {
		if (filters.categories.has(cat)) {
			filters.categories.delete(cat);
		} else {
			filters.categories.add(cat);
		}
		filters.categories = new Set(filters.categories);
	}

	function clearFilters() {
		filters = {
			reviewStatus: 'all',
			selectionStatus: 'all',
			hasFlags: 'all',
			languages: new Set(),
			categories: new Set()
		};
	}

	let activeFilterCount = $derived(() => {
		let count = 0;
		if (filters.reviewStatus !== 'all') count++;
		if (filters.selectionStatus !== 'all') count++;
		if (filters.hasFlags !== 'all') count++;
		if (filters.languages.size > 0) count++;
		if (filters.categories.size > 0) count++;
		return count;
	});
</script>

<div class="space-y-3">
	<div class="flex items-center gap-3">
		<button
			type="button"
			onclick={() => (showFilters = !showFilters)}
			class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<Filter class="w-4 h-4" />
			Filters
			{#if activeFilterCount() > 0}
				<span
					class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full"
				>
					{activeFilterCount()}
				</span>
			{/if}
		</button>

		{#if activeFilterCount() > 0}
			<button
				type="button"
				onclick={clearFilters}
				class="text-sm text-gray-500 hover:text-gray-700"
			>
				Clear all
			</button>
		{/if}
	</div>

	{#if showFilters}
		<div class="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
			<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
				<!-- Review Status -->
				<div class="space-y-2">
					<label for="filter-review" class="block text-xs font-semibold text-gray-500 uppercase"
						>My Review</label
					>
					<select
						id="filter-review"
						bind:value={filters.reviewStatus}
						class="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all">All</option>
						<option value="reviewed">Reviewed</option>
						<option value="not-reviewed">Not reviewed</option>
					</select>
				</div>

				<!-- Selection Status -->
				<div class="space-y-2">
					<label for="filter-score" class="block text-xs font-semibold text-gray-500 uppercase"
						>Score Status</label
					>
					<select
						id="filter-score"
						bind:value={filters.selectionStatus}
						class="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all">All</option>
						<option value="selected">Selected (≥65%)</option>
						<option value="maybe">Maybe (35-64%)</option>
						<option value="rejected">Rejected (&lt;35%)</option>
						<option value="no-reviews">No reviews</option>
					</select>
				</div>

				<!-- Flags -->
				<div class="space-y-2">
					<label for="filter-flags" class="block text-xs font-semibold text-gray-500 uppercase"
						>Flags</label
					>
					<select
						id="filter-flags"
						bind:value={filters.hasFlags}
						class="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="all">All</option>
						<option value="yes">Has flags</option>
						<option value="no">No flags</option>
					</select>
				</div>

				<!-- Languages -->
				<div class="space-y-2">
					<label for="filter-lang" class="block text-xs font-semibold text-gray-500 uppercase">
						Languages
						{#if filters.languages.size > 0}
							<span class="text-blue-600">({filters.languages.size})</span>
						{/if}
					</label>
					<div class="relative">
						<select
							id="filter-lang"
							class="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
							onchange={(e) => {
								const target = e.target as HTMLSelectElement;
								if (target.value) {
									toggleLanguage(target.value);
									target.value = '';
								}
							}}
						>
							<option value="">Select...</option>
							{#each availableLanguages as lang}
								<option value={lang} disabled={filters.languages.has(lang)}>{lang}</option>
							{/each}
						</select>
					</div>
					{#if filters.languages.size > 0}
						<div class="flex flex-wrap gap-1 mt-1">
							{#each [...filters.languages] as lang}
								<button
									type="button"
									onclick={() => toggleLanguage(lang)}
									class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
								>
									{lang}
									<span class="text-blue-500">×</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Categories -->
				<div class="space-y-2">
					<label for="filter-cat" class="block text-xs font-semibold text-gray-500 uppercase">
						Categories
						{#if filters.categories.size > 0}
							<span class="text-blue-600">({filters.categories.size})</span>
						{/if}
					</label>
					<div class="relative">
						<select
							id="filter-cat"
							class="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
							onchange={(e) => {
								const target = e.target as HTMLSelectElement;
								if (target.value) {
									toggleCategory(target.value);
									target.value = '';
								}
							}}
						>
							<option value="">Select...</option>
							{#each availableCategories as cat}
								<option value={cat} disabled={filters.categories.has(cat)}>{cat}</option>
							{/each}
						</select>
					</div>
					{#if filters.categories.size > 0}
						<div class="flex flex-wrap gap-1 mt-1">
							{#each [...filters.categories] as cat}
								<button
									type="button"
									onclick={() => toggleCategory(cat)}
									class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
								>
									{cat}
									<span class="text-blue-500">×</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
