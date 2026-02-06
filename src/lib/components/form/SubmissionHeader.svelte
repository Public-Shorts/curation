<script lang="ts">
	import { urlFor } from '$lib/utils/sanityImage';
	import { Calendar, Clock, Languages, Star } from 'lucide-svelte';

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
									<Star class="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
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
						<Calendar class="w-4 h-4 text-gallery-400" />
						{submission.yearOfCompletion}
					</span>
					<span
						class="inline-flex items-center gap-1.5 bg-gallery-100 px-3 py-1.5 rounded-lg font-medium"
					>
						<Clock class="w-4 h-4 text-gallery-400" />
						{submission.length} min
					</span>
					<span
						class="inline-flex items-center gap-1.5 bg-gallery-100 px-3 py-1.5 rounded-lg font-medium"
					>
						<Languages class="w-4 h-4 text-gallery-400" />
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
