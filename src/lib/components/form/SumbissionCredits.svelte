<script lang="ts">
	import {
		Users,
		Video,
		Heart,
		Instagram,
		Globe,
		Film,
		Calendar,
		MapPin,
		PlayCircle,
		Download,
		Key
	} from 'lucide-svelte';
	import RichText from '$lib/components/RichText.svelte';

	let { submission } = $props();
</script>

<div class="grid gap-4 sm:gap-6 lg:grid-cols-2">
	<!-- Credits Card -->
	<section class="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gallery-200/60">
		<h2
			class="text-xs font-semibold uppercase tracking-wider text-gallery-500 mb-5 flex items-center gap-2"
		>
			<Users class="w-4 h-4" />
			Credits
		</h2>
		<dl class="space-y-4">
			<div class="flex items-start gap-3">
				<div
					class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
				>
					<Video class="w-4 h-4 text-gallery-500" />
				</div>
				<div>
					<dt class="text-xs font-medium text-gallery-500 uppercase tracking-wide">Director</dt>
					<dd class="text-base font-medium text-gallery-900 mt-0.5">{submission.directorName}</dd>
				</div>
			</div>

			{#if submission.castAndCrew?.length}
				<div class="flex items-start gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
					>
						<Users class="w-4 h-4 text-gallery-500" />
					</div>
					<div>
						<dt class="text-xs font-medium text-gallery-500 uppercase tracking-wide">
							Cast & Crew
						</dt>
						<dd class="text-sm text-gallery-700 mt-0.5 leading-relaxed">
							<RichText blocks={submission.castAndCrew} />
						</dd>
					</div>
				</div>
			{/if}

			{#if submission.thanks?.length}
				<div class="flex items-start gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
					>
						<Heart class="w-4 h-4 text-gallery-500" />
					</div>
					<div>
						<dt class="text-xs font-medium text-gallery-500 uppercase tracking-wide">Thanks</dt>
						<dd class="text-sm text-gallery-700 mt-0.5 leading-relaxed">
							<RichText blocks={submission.thanks} />
						</dd>
					</div>
				</div>
			{/if}

			{#if submission.socialMedia?.length || submission.website?.length}
				<div class="pt-3 border-t border-gallery-100">
					<div class="flex flex-wrap gap-2">
						{#each submission.socialMedia ?? [] as link}
							<a
								href={link.url}
								target="_blank"
								class="inline-flex items-center gap-2 rounded-xl bg-gallery-50 px-4 py-2.5 text-sm font-medium text-gallery-700 ring-1 ring-inset ring-gallery-200 hover:bg-gallery-100 hover:ring-gallery-300 hover:text-gallery-900 transition-all"
							>
								<Instagram class="w-4 h-4" />
								{link.label || link.platform}
							</a>
						{/each}
						{#each submission.website ?? [] as link}
							<a
								href={link.url}
								target="_blank"
								class="inline-flex items-center gap-2 rounded-xl bg-gallery-50 px-4 py-2.5 text-sm font-medium text-gallery-700 ring-1 ring-inset ring-gallery-200 hover:bg-gallery-100 hover:ring-gallery-300 hover:text-gallery-900 transition-all"
							>
								<Globe class="w-4 h-4" />
								{link.label || link.url}
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</dl>
	</section>

	<!-- Screenings & Links Card -->
	<section class="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gallery-200/60">
		<h2
			class="text-xs font-semibold uppercase tracking-wider text-gallery-500 mb-5 flex items-center gap-2"
		>
			<Film class="w-4 h-4" />
			Screenings & Links
		</h2>
		<dl class="space-y-4">
			{#if submission.previousScreenings}
				<div class="flex items-start gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
					>
						<Calendar class="w-4 h-4 text-gallery-500" />
					</div>
					<div>
						<dt class="text-xs font-medium text-gallery-500 uppercase tracking-wide">
							Previous Screenings
						</dt>
						<dd class="text-sm text-gallery-700 mt-0.5 leading-relaxed">
							{submission.previousScreenings}
						</dd>
					</div>
				</div>
			{/if}

			{#if submission.previousScreeningLocations?.length}
				<div class="flex items-start gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
					>
						<MapPin class="w-4 h-4 text-gallery-500" />
					</div>
					<div>
						<dt class="text-xs font-medium text-gallery-500 uppercase tracking-wide">Locations</dt>
						<dd class="text-sm text-gallery-700 mt-0.5 leading-relaxed">
							<RichText blocks={submission.previousScreeningLocations} />
						</dd>
					</div>
				</div>
			{/if}

			<!-- Watch/Download Links -->
			<div class="pt-4 border-t border-gallery-100 space-y-3">
				<div class="flex flex-col sm:flex-row gap-3">
					{#if submission.linkToWatch}
						<a
							href={submission.linkToWatch}
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center justify-center gap-2 rounded-xl bg-gallery-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gallery-800 transition-all"
						>
							<PlayCircle class="w-5 h-5" />
							Watch Film
						</a>
					{/if}
					{#if submission.linkToDownload}
						<a
							href={submission.linkToDownload}
							target="_blank"
							rel="noreferrer"
							class="inline-flex items-center justify-center gap-2 rounded-xl bg-gallery-50 px-5 py-3 text-sm font-semibold text-gallery-700 ring-1 ring-inset ring-gallery-200 hover:bg-gallery-100 hover:ring-gallery-300 transition-all"
						>
							<Download class="w-5 h-5" />
							Download
						</a>
					{/if}
				</div>

				{#if submission.linkPassword}
					<div
						class="flex items-center gap-2 bg-gallery-50 rounded-lg px-3 py-2 border border-gallery-100"
					>
						<Key class="w-4 h-4 text-gallery-400 shrink-0" />
						<span class="text-xs text-gallery-500">Password:</span>
						<code
							class="text-sm font-mono text-gallery-700 bg-white px-2 py-0.5 rounded border border-gallery-200"
						>
							{submission.linkPassword}
						</code>
					</div>
				{/if}
			</div>
		</dl>
	</section>
</div>
