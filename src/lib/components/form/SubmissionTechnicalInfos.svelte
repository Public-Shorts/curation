<script lang="ts">
	import { AlignLeft, Image, ZoomIn, AlertTriangle, Info } from 'lucide-svelte';
	import { urlFor } from '$lib/utils/sanityImage';
	import RichText from '$lib/components/RichText.svelte';
	let { submission } = $props();
</script>

<div class="space-y-8">
	<!-- Synopsis -->
	{#if submission.synopsis?.length}
		<section class="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gallery-200/60">
			<h2
				class="text-xs font-semibold uppercase tracking-wider text-gallery-500 mb-4 flex items-center gap-2"
			>
				<AlignLeft class="w-4 h-4" />
				Synopsis
			</h2>
			<RichText blocks={submission.synopsis} class="text-base leading-relaxed text-gallery-700 max-w-prose" />
		</section>
	{/if}

	<!-- Screenshots -->
	{#if submission.screenshots && submission.screenshots.length > 0}
		<section class="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gallery-200/60">
			<h2
				class="text-xs font-semibold uppercase tracking-wider text-gallery-500 mb-4 flex items-center gap-2"
			>
				<Image class="w-4 h-4" />
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
								<ZoomIn class="w-5 h-5 text-gallery-700" />
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
				<AlertTriangle class="w-4 h-4" />
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
				<Info class="w-4 h-4" />
				Additional Info
			</h3>
			<div class="space-y-4">
				{#if submission._createdAt}
					<div class="flex items-start gap-4">
						<dt class="text-sm font-medium text-gallery-800 min-w-32">Submitted:</dt>
						<dd class="text-sm text-gallery-600">
							{new Date(submission._createdAt).toLocaleString('en-US', {
								dateStyle: 'medium',
								timeStyle: 'short'
							})}
						</dd>
					</div>
				{/if}
				{#if submission.additionalInfo?.length}
					<RichText blocks={submission.additionalInfo} class="text-sm text-gallery-700 leading-relaxed" />
				{/if}
				{#if submission.specialRequirements}
					<div class="bg-amber-50 rounded-xl p-4 border border-amber-100">
						<p class="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
							Special Requirements
						</p>
						<p class="text-sm text-amber-800">{submission.specialRequirements}</p>
					</div>
				{/if}
				{#if !submission.additionalInfo?.length && !submission.specialRequirements && !submission._createdAt}
					<p class="text-sm text-gallery-400 italic">None provided</p>
				{/if}
			</div>
		</section>
	</div>
</div>
