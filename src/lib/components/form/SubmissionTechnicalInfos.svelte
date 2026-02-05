<script lang="ts">
	import { urlFor } from '$lib/utils/sanityImage';
	let { submission } = $props();
</script>

<div class="space-y-8">
	<!-- Synopsis -->
	{#if submission.synopsis}
		<section class="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gallery-200/60">
			<h2
				class="text-xs font-semibold uppercase tracking-wider text-gallery-500 mb-4 flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h16M4 18h7"
					/>
				</svg>
				Synopsis
			</h2>
			<p class="text-base leading-relaxed text-gallery-700 max-w-prose">{submission.synopsis}</p>
		</section>
	{/if}

	<!-- Screenshots -->
	{#if submission.screenshots && submission.screenshots.length > 0}
		<section class="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gallery-200/60">
			<h2
				class="text-xs font-semibold uppercase tracking-wider text-gallery-500 mb-4 flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
					/>
				</svg>
				Screenshots
				<span class="text-gallery-400 font-normal">({submission.screenshots.length})</span>
			</h2>

			<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
				{#each submission.screenshots as screen}
					<a
						href={urlFor(screen).width(1920).fit('max').auto('format').url()}
						target="_blank"
						rel="noopener noreferrer"
						class="group relative block aspect-video overflow-hidden rounded-xl bg-gallery-100 ring-1 ring-gallery-200 hover:ring-gallery-300 hover:ring-2 transition-all shadow-sm hover:shadow-md"
					>
						<img
							src={urlFor(screen).width(400).height(225).fit('crop').auto('format').url()}
							alt={screen.alt || 'Film screenshot'}
							class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
							loading="lazy"
						/>

						<!-- Hover Overlay -->
						<div
							class="absolute inset-0 flex items-center justify-center bg-gallery-900/0 group-hover:bg-gallery-900/20 transition-colors"
						>
							<div
								class="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
							>
								<svg
									class="w-5 h-5 text-gallery-700"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
									/>
								</svg>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Technical / Content Grid -->
	<div class="grid gap-4 sm:gap-6 lg:grid-cols-2">
		<!-- Content Notes Card -->
		<section class="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gallery-200/60">
			<h3
				class="text-xs font-semibold uppercase tracking-wider text-gallery-500 mb-4 flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				Content Notes
			</h3>
			<dl class="space-y-4">
				<div class="flex items-start gap-4">
					<dt class="text-sm font-medium text-gallery-800 min-w-24">Explicit:</dt>
					<dd>
						{#if submission.explicit}
							<span
								class="inline-flex items-center rounded-lg bg-red-50 px-2.5 py-1 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200"
							>
								Yes
							</span>
						{:else}
							<span
								class="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-200"
							>
								No
							</span>
						{/if}
					</dd>
				</div>
				{#if submission.explicitDetails}
					<p class="text-sm text-gallery-600 italic bg-gallery-50 rounded-lg p-3 border border-gallery-100">
						{submission.explicitDetails}
					</p>
				{/if}

				<div class="flex items-start gap-4 pt-2">
					<dt class="text-sm font-medium text-gallery-800 min-w-24">AI Used:</dt>
					<dd>
						{#if submission.aiUsed}
							<span
								class="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-200"
							>
								Yes
							</span>
						{:else}
							<span
								class="inline-flex items-center rounded-lg bg-gallery-50 px-2.5 py-1 text-sm font-medium text-gallery-600 ring-1 ring-inset ring-gallery-200"
							>
								No
							</span>
						{/if}
					</dd>
				</div>
				{#if submission.aiExplanation}
					<p class="text-sm text-gallery-600 italic bg-gallery-50 rounded-lg p-3 border border-gallery-100">
						{submission.aiExplanation}
					</p>
				{/if}
			</dl>
		</section>

		<!-- Additional Info Card -->
		<section class="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gallery-200/60">
			<h3
				class="text-xs font-semibold uppercase tracking-wider text-gallery-500 mb-4 flex items-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				Additional Info
			</h3>
			<div class="space-y-4">
				{#if submission.additionalInfo}
					<p class="text-sm text-gallery-700 leading-relaxed">{submission.additionalInfo}</p>
				{/if}
				{#if submission.specialRequirements}
					<div class="bg-amber-50 rounded-xl p-4 border border-amber-100">
						<p class="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
							Special Requirements
						</p>
						<p class="text-sm text-amber-800">{submission.specialRequirements}</p>
					</div>
				{/if}
				{#if !submission.additionalInfo && !submission.specialRequirements}
					<p class="text-sm text-gallery-400 italic">None provided</p>
				{/if}
			</div>
		</section>
	</div>
</div>
