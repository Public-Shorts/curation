<script lang="ts">
	let { submission } = $props();
	const socialMedia: string | null = $derived.by(() => {
		if (submission.socialMedia == null) return null;
		if (submission.socialMedia?.startsWith('http')) {
			return submission.socialMedia ? submission.socialMedia : null;
		} else if (submission.socialMedia?.startsWith('@')) {
			return 'https://instagram.com/' + submission.socialMedia.slice(1);
		} else if (submission.socialMedia) {
			return 'https://instagram.com/' + submission.socialMedia;
		}
		return null;
	});
</script>

<div class="grid gap-6 sm:gap-8 lg:grid-cols-2">
	<!-- Credits -->
	<section class="space-y-4">
		<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b pb-2">
			Credits
		</h2>
		<dl class="space-y-3 text-sm">
			<div>
				<dt class="font-medium text-gray-900">Director</dt>
				<dd class="text-gray-600 mt-0.5">{submission.directorName}</dd>
			</div>
			{#if submission.castAndCrew}
				<div>
					<dt class="font-medium text-gray-900">Cast & Crew</dt>
					<dd class="text-gray-600 mt-0.5">{submission.castAndCrew}</dd>
				</div>
			{/if}
			{#if submission.thanks}
				<div>
					<dt class="font-medium text-gray-900">Thanks</dt>
					<dd class="text-gray-600 mt-0.5">{submission.thanks}</dd>
				</div>
			{/if}
			{#if submission.socialMedia || submission.website}
				<div class="pt-2 flex flex-col gap-1">
					{#if submission.socialMedia}
						<a href={socialMedia} target="_blank" class="text-blue-600 hover:underline break-all"
							>Social Media</a
						>
					{/if}
					{#if submission.website}
						<a
							href={submission.website}
							target="_blank"
							class="text-blue-600 hover:underline break-all">Website</a
						>
					{/if}
				</div>
			{/if}
		</dl>
	</section>

	<!-- Screenings & Links -->
	<section class="space-y-4">
		<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b pb-2">
			Screenings & Links
		</h2>
		<dl class="space-y-3 text-sm">
			{#if submission.previousScreenings}
				<div>
					<dt class="font-medium text-gray-900">Previous Screenings</dt>
					<dd class="text-gray-600 mt-0.5">{submission.previousScreenings}</dd>
				</div>
			{/if}
			{#if submission.previousScreeningLocations}
				<div>
					<dt class="font-medium text-gray-900">Locations</dt>
					<dd class="text-gray-600 mt-0.5">{submission.previousScreeningLocations}</dd>
				</div>
			{/if}

			<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
				{#if submission.linkToWatch}
					<a
						href={submission.linkToWatch}
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center justify-center rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 ring-1 ring-inset ring-blue-700/10 transition-colors"
					>
						Watch Film ↗
					</a>
				{/if}
				{#if submission.linkToDownload}
					<a
						href={submission.linkToDownload}
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center justify-center rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 ring-1 ring-inset ring-gray-600/10 transition-colors"
					>
						Download ↗
					</a>
				{/if}
			</div>
			{#if submission.linkPassword}
				<p class="text-xs text-gray-500 mt-1 break-all">Password: {submission.linkPassword}</p>
			{/if}
		</dl>
	</section>
</div>
