<script lang="ts">
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
