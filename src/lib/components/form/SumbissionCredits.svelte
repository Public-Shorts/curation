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

<div class="grid gap-4 sm:gap-6 lg:grid-cols-2">
	<!-- Credits Card -->
	<section class="rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gallery-200/60">
		<h2
			class="text-xs font-semibold uppercase tracking-wider text-gallery-500 mb-5 flex items-center gap-2"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
			Credits
		</h2>
		<dl class="space-y-4">
			<div class="flex items-start gap-3">
				<div
					class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
				>
					<svg class="w-4 h-4 text-gallery-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<div>
					<dt class="text-xs font-medium text-gallery-500 uppercase tracking-wide">Director</dt>
					<dd class="text-base font-medium text-gallery-900 mt-0.5">{submission.directorName}</dd>
				</div>
			</div>

			{#if submission.castAndCrew}
				<div class="flex items-start gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
					>
						<svg
							class="w-4 h-4 text-gallery-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					</div>
					<div>
						<dt class="text-xs font-medium text-gallery-500 uppercase tracking-wide">Cast & Crew</dt>
						<dd class="text-sm text-gallery-700 mt-0.5 leading-relaxed">{submission.castAndCrew}</dd>
					</div>
				</div>
			{/if}

			{#if submission.thanks}
				<div class="flex items-start gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
					>
						<svg
							class="w-4 h-4 text-gallery-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
							/>
						</svg>
					</div>
					<div>
						<dt class="text-xs font-medium text-gallery-500 uppercase tracking-wide">Thanks</dt>
						<dd class="text-sm text-gallery-700 mt-0.5 leading-relaxed">{submission.thanks}</dd>
					</div>
				</div>
			{/if}

			{#if submission.socialMedia || submission.website}
				<div class="pt-3 border-t border-gallery-100">
					<div class="flex flex-wrap gap-2">
						{#if submission.socialMedia}
							<a
								href={socialMedia}
								target="_blank"
								class="inline-flex items-center gap-2 rounded-xl bg-gallery-50 px-4 py-2.5 text-sm font-medium text-gallery-700 ring-1 ring-inset ring-gallery-200 hover:bg-gallery-100 hover:ring-gallery-300 transition-all"
							>
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path
										d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
									/>
								</svg>
								Social Media
							</a>
						{/if}
						{#if submission.website}
							<a
								href={submission.website}
								target="_blank"
								class="inline-flex items-center gap-2 rounded-xl bg-gallery-50 px-4 py-2.5 text-sm font-medium text-gallery-700 ring-1 ring-inset ring-gallery-200 hover:bg-gallery-100 hover:ring-gallery-300 transition-all"
							>
								<svg
									class="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
									/>
								</svg>
								Website
							</a>
						{/if}
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
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
				/>
			</svg>
			Screenings & Links
		</h2>
		<dl class="space-y-4">
			{#if submission.previousScreenings}
				<div class="flex items-start gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
					>
						<svg
							class="w-4 h-4 text-gallery-500"
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

			{#if submission.previousScreeningLocations}
				<div class="flex items-start gap-3">
					<div
						class="w-8 h-8 rounded-lg bg-gallery-100 flex items-center justify-center shrink-0 mt-0.5"
					>
						<svg
							class="w-4 h-4 text-gallery-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</div>
					<div>
						<dt class="text-xs font-medium text-gallery-500 uppercase tracking-wide">Locations</dt>
						<dd class="text-sm text-gallery-700 mt-0.5 leading-relaxed">
							{submission.previousScreeningLocations}
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
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
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
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							Download
						</a>
					{/if}
				</div>

				{#if submission.linkPassword}
					<div class="flex items-center gap-2 bg-gallery-50 rounded-lg px-3 py-2 border border-gallery-100">
						<svg
							class="w-4 h-4 text-gallery-400 shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
							/>
						</svg>
						<span class="text-xs text-gallery-500">Password:</span>
						<code class="text-sm font-mono text-gallery-700 bg-white px-2 py-0.5 rounded border border-gallery-200">
							{submission.linkPassword}
						</code>
					</div>
				{/if}
			</div>
		</dl>
	</section>
</div>
