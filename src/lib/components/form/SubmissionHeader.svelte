<script lang="ts">
	let { submission } = $props();
</script>

<header class="space-y-3 pb-6 border-b border-gray-100">
	<div>
		<h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
			{submission.englishTitle}
		</h1>
		{#if submission.originalTitle}
			<p class="text-gray-500 italic mt-1 text-sm sm:text-base">{submission.originalTitle}</p>
		{/if}
	</div>

	<div class="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-600">
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
