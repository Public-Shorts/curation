<script lang="ts">
	import type { PageData } from './$types';
	import { StatCard } from '$lib/components/ui';
	import { formatTime } from '$lib/utils/formatting';
	import { invalidateAll } from '$app/navigation';
	import { getToastMessages } from '$lib/toast/toastMessages.svelte.ts';
	import FlagBadge from '$lib/components/ui/FlagBadge.svelte';

	let { data } = $props<{ data: PageData }>();

	const toasts = getToastMessages();
	let isRefreshing = $state(false);

	// Calculate stats
	let totalFilms = $derived(
		new Set([...data.highlights, ...data.selected, ...data.maybe].map((f) => f._id)).size
	);
	let totalRuntime = $derived(
		[...data.highlights, ...data.selected].reduce((sum, f) => sum + (f.length || 0), 0)
	);

	async function refreshSelection() {
		isRefreshing = true;
		try {
			const response = await fetch('/api/update-selection', { method: 'POST' });
			const result = await response.json();
			if (result.success) {
				toasts.add({ message: 'Selection data updated!', type: 'success' });
				await invalidateAll();
			} else {
				throw new Error(result.error || 'Failed to update');
			}
		} catch (error: any) {
			toasts.add({ message: `Error: ${error.message}`, type: 'error' });
		} finally {
			isRefreshing = false;
		}
	}
</script>

<!-- Dev Refresh Button -->
{#if data.isDev}
	<div class="fixed top-4 right-4 z-50">
		<button
			onclick={refreshSelection}
			disabled={isRefreshing}
			class="px-4 py-2 bg-gallery-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-gallery-800 disabled:opacity-50 shadow-lg transition-all"
		>
			{isRefreshing ? 'Refreshing...' : '⟳ Refresh Selection'}
		</button>
	</div>
{/if}

<div class="space-y-12 pb-20">
	<!-- Stats Bar -->
	<section class="grid gap-4 md:grid-cols-5">
		<StatCard label="Total Films" value={totalFilms} />
		<StatCard label="Highlights" value={data.highlights.length} />
		<StatCard label="Selected" value={data.selected.length} />
		<StatCard label="Maybe" value={data.maybe.length} />
		<StatCard label="Total Runtime">
			<p class="text-lg font-semibold">{formatTime(totalRuntime)}</p>
		</StatCard>
	</section>

	<header>
		<h1 class="text-3xl font-bold mb-1">Selection</h1>
		<p class="text-gallery-600 text-sm">
			AI-generated editorial summary and curator-selected films
		</p>
	</header>

	<!-- AI Summary Section -->
	{#if data.summary}
		<section class="bg-white rounded-xl border border-gallery-200 p-8">
			<h2 class="text-xs font-black uppercase tracking-widest text-gallery-400 mb-4">
				Editorial Summary
			</h2>
			<div class="prose prose-sm max-w-none text-gallery-700 leading-relaxed space-y-4">
				{#each data.summary.split('\n\n') as paragraph}
					{#if paragraph.trim()}
						<p>{paragraph}</p>
					{/if}
				{/each}
			</div>
			{#if data.selectionLastUpdated}
				<p class="text-xs text-gallery-400 mt-6 pt-4 border-t border-gallery-100">
					Last updated: {new Date(data.selectionLastUpdated).toLocaleString()}
				</p>
			{/if}
		</section>
	{:else}
		<section class="bg-gallery-50 rounded-xl border border-gallery-200 p-8">
			<p class="text-gallery-500 text-center">
				No selection data available. Run <code
					class="bg-gallery-200 px-2 py-0.5 rounded text-xs">npm run update-selection</code
				> to generate.
			</p>
		</section>
	{/if}

	<!-- Highlights Section -->
	<section class="space-y-6">
		<details open class="group">
			<summary
				class="cursor-pointer text-xl font-bold text-gallery-900 flex items-center gap-2 hover:text-black transition-colors list-none"
			>
				<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
				Highlights ({data.highlights.length})
			</summary>

			{#if data.highlights.length === 0}
				<div class="mt-6 p-8 bg-gallery-50 rounded-lg text-center">
					<p class="text-gallery-500">No highlights yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
					{#each data.highlights as film}
						<a
							href={`/review/${film._id}`}
							class="flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group/card"
						>
							<!-- Poster/Screenshot -->
							{#if film.poster?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img
										src={`${film.poster.asset.url}?w=600&h=400&fit=crop`}
										alt={film.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
									/>
									<div
										class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"
									></div>
								</div>
							{:else if film.screenshots?.[0]?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img
										src={`${film.screenshots[0].asset.url}?w=600&h=400&fit=crop`}
										alt={film.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
									/>
									<div
										class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"
									></div>
								</div>
							{:else}
								<div
									class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
								>
									<span class="text-gallery-400 text-4xl">🎬</span>
								</div>
							{/if}

							<!-- Content -->
							<div class="p-5 flex-1 flex flex-col space-y-4">
								<div class="flex justify-between items-start gap-4">
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-lg leading-tight text-gallery-900 truncate">
											{film.title}
										</h3>
										<p class="text-sm text-gallery-600 font-medium mt-1">
											{film.director}
											{#if film.length}
												<span class="text-gallery-300 mx-1.5">•</span>
												<span>{film.length} min</span>
											{/if}
										</p>
									</div>

									<div class="flex flex-col items-end gap-1">
										{#if film.score !== undefined}
											<span class="text-xl font-black text-gallery-900 leading-none">
												{film.score.toFixed(0)}%
											</span>
										{/if}
										{#if film.avgRating}
											<span class="text-xs font-bold text-gallery-400">
												★ {film.avgRating.toFixed(1)}
											</span>
										{/if}
									</div>
								</div>

								<!-- Footer with curator info -->
								<div class="mt-auto pt-3 border-t border-gallery-100 flex items-center justify-between">
									<div class="flex items-center gap-1.5">
										<span class="text-xs" style="color: var(--color-highlight-500)">★</span>
										<span
											class="text-[10px] font-black text-gallery-600 uppercase tracking-widest"
										>
											{film.curatorCount} Curator{film.curatorCount !== 1 ? 's' : ''}
										</span>
									</div>

									{#if film.flags && film.flags.length > 0}
										<div class="flex gap-1">
											{#each film.flags.slice(0, 2) as flag}
												<span
													class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded {flag.color}"
												>
													{flag.label}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</details>
	</section>

	<!-- Selected Section -->
	<section class="space-y-6">
		<details class="group">
			<summary
				class="cursor-pointer text-xl font-bold text-gallery-900 flex items-center gap-2 hover:text-black transition-colors list-none"
			>
				<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
				Selected (≥65%) ({data.selected.length})
			</summary>

			{#if data.selected.length === 0}
				<div class="mt-6 p-8 bg-gallery-50 rounded-lg text-center">
					<p class="text-gallery-500">No selected films yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
					{#each data.selected as film}
						<a
							href={`/review/${film._id}`}
							class="flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group/card"
						>
							<!-- Poster/Screenshot -->
							{#if film.poster?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img
										src={`${film.poster.asset.url}?w=600&h=400&fit=crop`}
										alt={film.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
									/>
									<div
										class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"
									></div>
								</div>
							{:else if film.screenshots?.[0]?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img
										src={`${film.screenshots[0].asset.url}?w=600&h=400&fit=crop`}
										alt={film.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
									/>
									<div
										class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"
									></div>
								</div>
							{:else}
								<div
									class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
								>
									<span class="text-gallery-400 text-4xl">🎬</span>
								</div>
							{/if}

							<!-- Content -->
							<div class="p-5 flex-1 flex flex-col space-y-4">
								<div class="flex justify-between items-start gap-4">
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-lg leading-tight text-gallery-900 truncate">
											{film.title}
										</h3>
										<p class="text-sm text-gallery-600 font-medium mt-1">
											{film.director}
											{#if film.length}
												<span class="text-gallery-300 mx-1.5">•</span>
												<span>{film.length} min</span>
											{/if}
										</p>
									</div>

									<div class="flex flex-col items-end gap-1">
										{#if film.score !== undefined}
											<span class="text-xl font-black text-gallery-900 leading-none">
												{film.score.toFixed(0)}%
											</span>
										{/if}
										{#if film.avgRating}
											<span class="text-xs font-bold text-gallery-400">
												★ {film.avgRating.toFixed(1)}
											</span>
										{/if}
									</div>
								</div>

								<!-- Footer with flags -->
								{#if film.flags && film.flags.length > 0}
									<div class="mt-auto pt-3 border-t border-gallery-100 flex gap-1">
										{#each film.flags.slice(0, 3) as flag}
											<span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded {flag.color}">
												{flag.label}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</details>
	</section>

	<!-- Maybe Section -->
	<section class="space-y-6">
		<details class="group">
			<summary
				class="cursor-pointer text-xl font-bold text-gallery-900 flex items-center gap-2 hover:text-black transition-colors list-none"
			>
				<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
				Maybe (35-65%) ({data.maybe.length})
			</summary>

			{#if data.maybe.length === 0}
				<div class="mt-6 p-8 bg-gallery-50 rounded-lg text-center">
					<p class="text-gallery-500">No maybe films yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
					{#each data.maybe as film}
						<a
							href={`/review/${film._id}`}
							class="flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group/card"
						>
							<!-- Poster/Screenshot -->
							{#if film.poster?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img
										src={`${film.poster.asset.url}?w=600&h=400&fit=crop`}
										alt={film.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
									/>
									<div
										class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"
									></div>
								</div>
							{:else if film.screenshots?.[0]?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img
										src={`${film.screenshots[0].asset.url}?w=600&h=400&fit=crop`}
										alt={film.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
									/>
									<div
										class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"
									></div>
								</div>
							{:else}
								<div
									class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
								>
									<span class="text-gallery-400 text-4xl">🎬</span>
								</div>
							{/if}

							<!-- Content -->
							<div class="p-5 flex-1 flex flex-col space-y-4">
								<div class="flex justify-between items-start gap-4">
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-lg leading-tight text-gallery-900 truncate">
											{film.title}
										</h3>
										<p class="text-sm text-gallery-600 font-medium mt-1">
											{film.director}
											{#if film.length}
												<span class="text-gallery-300 mx-1.5">•</span>
												<span>{film.length} min</span>
											{/if}
										</p>
									</div>

									<div class="flex flex-col items-end gap-1">
										{#if film.score !== undefined}
											<span class="text-xl font-black text-gallery-900 leading-none">
												{film.score.toFixed(0)}%
											</span>
										{/if}
										{#if film.avgRating}
											<span class="text-xs font-bold text-gallery-400">
												★ {film.avgRating.toFixed(1)}
											</span>
										{/if}
									</div>
								</div>

								<!-- Footer with flags -->
								{#if film.flags && film.flags.length > 0}
									<div class="mt-auto pt-3 border-t border-gallery-100 flex gap-1">
										{#each film.flags.slice(0, 3) as flag}
											<span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded {flag.color}">
												{flag.label}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</details>
	</section>

	<!-- Cluster Recommendations Section -->
	<section class="space-y-6">
		<details class="group">
			<summary
				class="cursor-pointer text-xl font-bold text-gallery-900 flex items-center gap-2 hover:text-black transition-colors list-none"
			>
				<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
				Cluster Recommendations ({data.clusters.length})
			</summary>

			<div class="mt-6 space-y-16">
				{#each data.clusters as cluster}
					{@const hasRelevant = cluster.relevantMovies.length > 0}
					<div class="space-y-6">
						<div class="flex flex-col px-1 gap-2">
							<div class="flex items-center flex-wrap gap-3">
								<h2 class="text-2xl font-bold text-gallery-900 leading-tight">
									{cluster.name}
								</h2>
								<span
									class="px-2 py-0.5 bg-white text-gallery-500 rounded text-[10px] font-black uppercase border border-gallery-200/50"
								>
									{cluster.count} total
								</span>
								{#if cluster.highlightedMovies.length > 0}
									<div
										class="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-100"
									>
										<span class="text-[10px] font-black uppercase">
											{cluster.highlightedMovies.length} Highlights
										</span>
										<span class="w-1 h-1 rounded-full bg-amber-300"></span>
										<span class="text-[10px] font-bold">
											{formatTime(cluster.highlightedMinutes)}
										</span>
									</div>
								{/if}
								<span class="text-gallery-400 font-bold uppercase text-[11px] tracking-tight">
									Total: {cluster.totalHours}h {cluster.totalMins}m
								</span>
							</div>

							<p class="text-gallery-500 text-sm font-medium max-w-3xl leading-relaxed">
								{cluster.description}
							</p>

							<div class="flex flex-wrap gap-1.5 py-1">
								{#each cluster.keywords as keyword}
									<span
										class="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 bg-gallery-50 text-gallery-400 rounded-full border border-gallery-100"
									>
										{keyword}
									</span>
								{/each}
							</div>
						</div>

						<!-- Highlighted Movies Carousel -->
						<div class="space-y-3">
							<div class="flex items-center justify-between px-1">
								<h3 class="text-xs font-black uppercase tracking-widest text-gallery-400">
									Featured Highlights
								</h3>
							</div>
							<div class="relative group -mx-1">
								<div
									class="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x snap-mandatory"
								>
									{#each cluster.highlightedMovies as movie}
										<a
											href="/review/{movie._id}"
											class="flex-shrink-0 w-[240px] sm:w-[280px] aspect-video bg-white rounded-xl border border-gallery-200/50 shadow-sm hover:shadow-md hover:border-gallery-300 transition-all duration-300 group/item overflow-hidden snap-start"
										>
											<div class="relative h-full w-full">
												<!-- Screenshot -->
												{#if movie.screenshots?.[0]?.asset?.url}
													<img
														src={`${movie.screenshots[0].asset.url}?w=600&h=338&fit=crop`}
														alt={movie.title}
														class="w-full h-full object-cover transition-opacity duration-300"
													/>
												{:else if movie.poster?.asset?.url}
													<img
														src={`${movie.poster.asset.url}?w=600&h=338&fit=crop`}
														alt={movie.title}
														class="w-full h-full object-cover grayscale opacity-50 transition-all group-hover/item:grayscale-0 group-hover/item:opacity-100"
													/>
												{:else}
													<div
														class="w-full h-full flex items-center justify-center bg-gallery-100 text-gallery-300"
													>
														🎬
													</div>
												{/if}

												<!-- Overlay -->
												<div
													class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover/item:opacity-90 transition-opacity"
												></div>

												<!-- Content Bottom -->
												<div class="absolute bottom-0 left-0 right-0 p-3">
													<h4 class="text-white font-bold text-xs truncate mb-0.5">
														{movie.title}
													</h4>
													<div class="flex items-center gap-2">
														<span
															class="text-[9px] font-black text-white/50 uppercase tracking-widest"
															>{movie.length}m</span
														>
													</div>
												</div>
											</div>
										</a>
									{/each}
								</div>
							</div>
						</div>

						<!-- Relevant Videos Section -->
						{#if hasRelevant}
							<div class="px-1">
								<details class="group/relevant">
									<summary
										class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gallery-400 cursor-pointer hover:text-gallery-600 transition-colors list-none"
									>
										<span class="transition-transform group-open/relevant:rotate-90">▶</span>
										Show {cluster.relevantMovies.length} Relevant Videos
										<span class="opacity-40 font-bold ml-1"
											>({formatTime(cluster.relevantMinutes)})</span
										>
									</summary>
									<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4">
										{#each cluster.relevantMovies as movie}
											<a
												href="/review/{movie._id}"
												class="group/rel-item block space-y-2 hover:translate-y-[-2px] transition-transform"
											>
												<div
													class="aspect-video rounded-lg overflow-hidden border border-gallery-200/50 bg-gallery-100 relative"
												>
													{#if movie.screenshots?.[0]?.asset?.url}
														<img
															src={`${movie.screenshots[0].asset.url}?w=300&h=169&fit=crop`}
															alt={movie.title}
															class="w-full h-full object-cover grayscale opacity-70 group-hover/rel-item:grayscale-0 group-hover/rel-item:opacity-100 transition-all"
														/>
													{:else if movie.poster?.asset?.url}
														<img
															src={`${movie.poster.asset.url}?w=300&h=169&fit=crop`}
															alt={movie.title}
															class="w-full h-full object-cover grayscale opacity-50"
														/>
													{/if}
												</div>
												<h4 class="text-[10px] font-bold text-gallery-700 truncate px-1">
													{movie.title}
												</h4>
											</a>
										{/each}
									</div>
								</details>
							</div>
						{/if}
					</div>
				{/each}

				{#if data.lastUpdated}
					<p
						class="text-[10px] font-bold text-gallery-400 text-center pt-10 uppercase tracking-widest"
					>
						Clusters last generated: {new Date(data.lastUpdated).toLocaleString()}
					</p>
				{/if}
			</div>
		</details>
	</section>
</div>

<style>
	:global(body) {
		background-color: var(--color-gallery-50);
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	/* Smooth details animation */
	details summary {
		user-select: none;
	}

	details[open] summary ~ * {
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
