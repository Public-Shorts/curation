<script lang="ts">
	import { urlFor } from '$lib/utils/sanityImage';
	let { submission } = $props();
</script>

<!-- Synopsis -->
{#if submission.synopsis}
	<section class="space-y-3">
		<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b pb-2">
			Synopsis
		</h2>
		<p class="text-sm leading-relaxed text-gray-700">{submission.synopsis}</p>
	</section>
{/if}
{#if submission.screenshots && submission.screenshots.length > 0}
	<section class="space-y-3 pt-2">
		<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b pb-2">
			Screenshots
		</h2>

		<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
			{#each submission.screenshots as screen}
				<a
					href={urlFor(screen).width(1920).fit('max').auto('format').url()}
					target="_blank"
					rel="noopener noreferrer"
					class="group relative block aspect-video overflow-hidden rounded-md bg-gray-100 ring-1 ring-gray-900/5 hover:ring-gray-900/10 transition-all"
				>
					<img
						src={urlFor(screen).width(400).height(225).fit('crop').auto('format').url()}
						alt={screen.alt || 'Film screenshot'}
						class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
					/>

					<!-- Hover Overlay Icon -->
					<div
						class="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors"
					>
						<svg
							class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity"
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
				</a>
			{/each}
		</div>
	</section>
{/if}

<!-- Technical / Content -->
<div
	class="grid gap-6 sm:gap-8 lg:grid-cols-2 rounded-lg bg-gray-50 p-4 sm:p-6 border border-gray-100"
>
	<div class="space-y-3">
		<h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Content Notes</h3>
		<dl class="space-y-2 text-sm">
			<div class="flex gap-2">
				<dt class="font-medium text-gray-900 min-w-20 sm:min-w-24">Explicit:</dt>
				<dd class="text-gray-600">{submission.explicit ? 'Yes' : 'No'}</dd>
			</div>
			{#if submission.explicitDetails}
				<dd class="text-gray-500 italic text-xs pl-0 sm:pl-24">{submission.explicitDetails}</dd>
			{/if}

			<div class="flex gap-2 mt-2">
				<dt class="font-medium text-gray-900 min-w-20 sm:min-w-24">AI Used:</dt>
				<dd class="text-gray-600">{submission.aiUsed ? 'Yes' : 'No'}</dd>
			</div>
			{#if submission.aiExplanation}
				<dd class="text-gray-500 italic text-xs pl-0 sm:pl-24">{submission.aiExplanation}</dd>
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
