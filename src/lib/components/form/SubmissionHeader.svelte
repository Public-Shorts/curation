<script lang="ts">
    import { urlFor } from '$lib/utils/sanityImage'; // Assuming you set this up
    let { submission } = $props();
</script>

<header class="space-y-6 pb-6 border-b border-gray-100">
	<div class="flex flex-col sm:flex-row gap-6">
		<!-- Left Column: Poster Image -->
		{#if submission.poster}
			<div class="shrink-0">
				<div
					class="relative w-32 sm:w-40 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 shadow-sm ring-1 ring-gray-900/5"
				>
					<img
						src={urlFor(submission.poster).width(320).height(480).fit('crop').auto('format').url()}
						alt="Poster for {submission.englishTitle}"
						class="absolute inset-0 h-full w-full object-cover"
						loading="eager"
					/>
				</div>
			</div>
		{/if}

		<!-- Right Column: Text Content -->
		<div class="flex-1 space-y-3">
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
		</div>
	</div>
</header>
