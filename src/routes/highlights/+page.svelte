<script lang="ts">
	let { data } = $props();

	const { highlights, stats } = data;
</script>

<div class="space-y-8">
	<!-- Header -->
	<header>
		<h1 class="text-3xl font-bold mb-2">Curator Highlights</h1>
		<p class="text-gray-600">Films selected as highlights by our curators</p>
	</header>

	<!-- Stats Section -->
	<section class="grid gap-4 md:grid-cols-4">
		<div class="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
			<p class="text-xs uppercase text-gray-500">Total Highlights</p>
			<p class="mt-1 text-2xl font-semibold">{stats.totalHighlights}</p>
		</div>

		<div class="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
			<p class="text-xs uppercase text-gray-500">Active Curators</p>
			<p class="mt-1 text-2xl font-semibold">{stats.totalCurators}</p>
		</div>

		<div class="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
			<p class="text-xs uppercase text-gray-500">Avg Selections</p>
			<p class="mt-1 text-2xl font-semibold">{stats.averageHighlightsPerVideo}</p>
			<p class="text-xs text-gray-500 mt-1">per video</p>
		</div>

		<div class="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
			<p class="text-xs uppercase text-gray-500">Most Popular</p>
			{#if stats.mostHighlighted}
				<p
					class="mt-1 text-sm font-medium truncate"
					title={stats.mostHighlighted.submission.englishTitle}
				>
					{stats.mostHighlighted.submission.englishTitle}
				</p>
				<p class="text-xs text-gray-500 mt-1">
					{stats.mostHighlighted.curators.length} curator{stats.mostHighlighted.curators.length > 1
						? 's'
						: ''}
				</p>
			{:else}
				<p class="mt-1 text-sm text-gray-400">N/A</p>
			{/if}
		</div>
	</section>

	<!-- Highlights Grid -->
	<section class="space-y-6">
		{#if highlights.length === 0}
			<div class="rounded-lg bg-gray-50 p-12 text-center">
				<p class="text-gray-500">No highlights yet. Curators will select their favorites soon!</p>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each highlights as { submission, curators }}
					<article
						class="rounded-lg bg-white shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
					>
						<!-- Poster/Screenshot -->
						{#if submission.poster?.asset}
							<div class="aspect-video bg-gray-100 overflow-hidden">
								<img
									src={`${submission.poster.asset.url}?w=600&h=400&fit=crop`}
									alt={submission.englishTitle}
									class="w-full h-full object-cover"
								/>
							</div>
						{:else if submission.screenshots?.[0]?.asset}
							<div class="aspect-video bg-gray-100 overflow-hidden">
								<img
									src={`${submission.screenshots[0].asset.url}?w=600&h=400&fit=crop`}
									alt={submission.englishTitle}
									class="w-full h-full object-cover"
								/>
							</div>
						{:else}
							<div
								class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
							>
								<span class="text-gray-400 text-4xl">🎬</span>
							</div>
						{/if}

						<!-- Content -->
						<div class="p-4 space-y-3">
							<!-- Title -->
							<div>
								<h3 class="font-semibold text-lg leading-tight">{submission.englishTitle}</h3>
								{#if submission.originalTitle !== submission.englishTitle}
									<p class="text-sm text-gray-500">{submission.originalTitle}</p>
								{/if}
							</div>

							<!-- Director & Year -->
							<div class="flex items-center gap-2 text-sm text-gray-600">
								<span>{submission.directorName}</span>
								<span class="text-gray-300">•</span>
								<span>{submission.yearOfCompletion}</span>
								{#if submission.length}
									<span class="text-gray-300">•</span>
									<span>{submission.length} min</span>
								{/if}
							</div>

							<!-- Synopsis -->
							{#if submission.synopsis}
								<p class="text-sm text-gray-600 line-clamp-3">
									{submission.synopsis}
								</p>
							{/if}

							<!-- Categories -->
							{#if submission.categories?.length}
								<div class="flex flex-wrap gap-1.5">
									{#each submission.categories.slice(0, 3) as category}
										<span
											class="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
										>
											{category}
										</span>
									{/each}
									{#if submission.categories.length > 3}
										<span
											class="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded"
										>
											+{submission.categories.length - 3}
										</span>
									{/if}
								</div>
							{/if}

							<!-- Curators who highlighted this -->
							<div class="pt-3 border-t border-gray-100">
								<p class="text-xs uppercase text-gray-500 mb-2">
									Highlighted by {curators.length} curator{curators.length > 1 ? 's' : ''}
								</p>
								<div class="flex flex-wrap gap-1.5">
									{#each curators as curator}
										<span
											class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-50 text-yellow-800 rounded-full border border-yellow-200"
										>
											<span class="text-yellow-500">★</span>
											{curator.name}
										</span>
									{/each}
								</div>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
