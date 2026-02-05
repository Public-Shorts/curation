<script lang="ts">
	import { urlFor } from '$lib/utils/sanityImage';

	type HighlightCurator = {
		_id: string;
		name: string;
	};

	let { submission, highlightedBy = [] }: { submission: any; highlightedBy?: HighlightCurator[] } =
		$props();
</script>

<header class="relative">
	<!-- Main Header Card -->
	<div
		class="rounded-2xl bg-linear-to-br from-white to-gallery-50 p-5 sm:p-8 shadow-sm ring-1 ring-gallery-200/60"
	>
		<div class="flex flex-col sm:flex-row gap-6 sm:gap-8">
			<!-- Left Column: Poster Image -->
			{#if submission.poster}
				<div class="shrink-0">
					<div
						class="relative w-36 sm:w-44 aspect-2/3 rounded-xl overflow-hidden bg-gallery-100 shadow-md ring-1 ring-gallery-900/10 transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
					>
						<img
							src={urlFor(submission.poster).width(352).height(528).fit('crop').auto('format').url()}
							alt="Poster for {submission.englishTitle}"
							class="absolute inset-0 h-full w-full object-cover"
							loading="eager"
						/>
					</div>
				</div>
			{/if}

			<!-- Right Column: Text Content -->
			<div class="flex-1 space-y-4">
				<!-- Title Section -->
				<div class="space-y-1">
					<div class="flex flex-wrap items-start gap-3">
						<h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gallery-900">
							{submission.englishTitle}
						</h1>

						<!-- Highlight Badge -->
						{#if highlightedBy.length > 0}
							<div class="group/highlight relative shrink-0 mt-1">
								<span
									class="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/30 shadow-sm"
								>
									<svg class="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
										<path
											d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
										/>
									</svg>
									{highlightedBy.length} Highlight{highlightedBy.length > 1 ? 's' : ''}
								</span>

								<!-- Tooltip -->
								<div
									class="absolute left-0 top-full mt-2 w-56 p-3 bg-gallery-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/highlight:opacity-100 group-hover/highlight:visible transition-all duration-200 z-50"
								>
									<p class="font-semibold text-amber-300 mb-1.5">Highlighted by:</p>
									<p class="text-gallery-300 leading-relaxed">
										{highlightedBy.map((c) => c.name).join(', ')}
									</p>
									<div
										class="absolute -top-1.5 left-4 w-3 h-3 bg-gallery-900 rotate-45"
									></div>
								</div>
							</div>
						{/if}
					</div>

					{#if submission.originalTitle && submission.originalTitle !== submission.englishTitle}
						<p class="text-gallery-500 italic text-base sm:text-lg">{submission.originalTitle}</p>
					{/if}
				</div>

				<!-- Metadata Pills -->
				<div
					class="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gallery-600 pt-1"
				>
					<span
						class="inline-flex items-center gap-1.5 bg-gallery-100 px-3 py-1.5 rounded-lg font-medium"
					>
						<svg
							class="w-4 h-4 text-gallery-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						{submission.yearOfCompletion}
					</span>
					<span
						class="inline-flex items-center gap-1.5 bg-gallery-100 px-3 py-1.5 rounded-lg font-medium"
					>
						<svg
							class="w-4 h-4 text-gallery-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						{submission.length} min
					</span>
					<span
						class="inline-flex items-center gap-1.5 bg-gallery-100 px-3 py-1.5 rounded-lg font-medium"
					>
						<svg
							class="w-4 h-4 text-gallery-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
							/>
						</svg>
						{submission.filmLanguage}
					</span>
				</div>

				<!-- Categories -->
				{#if submission.categories && submission.categories.length > 0}
					<div class="flex flex-wrap gap-2 pt-2">
						{#each submission.categories as cat}
							<span
								class="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-gallery-700 ring-1 ring-inset ring-gallery-300 shadow-sm"
							>
								{cat}
							</span>
						{/each}
						{#if submission.categories?.includes('other') && submission.categoryOther}
							<span
								class="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-gallery-700 ring-1 ring-inset ring-gallery-300 shadow-sm"
							>
								{submission.categoryOther}
							</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>
