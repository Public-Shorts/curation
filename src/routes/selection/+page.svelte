<script lang="ts">
	import type { PageData } from './$types';
	import { StatCard } from '$lib/components/ui';
	import { formatTime } from '$lib/utils/formatting';
	import { invalidateAll } from '$app/navigation';
	import { getToastMessages } from '$lib/toast/toastMessages.svelte.ts';
	import { fade, scale } from 'svelte/transition';

	let { data } = $props<{ data: PageData }>();

	const toasts = getToastMessages();
	let isRefreshing = $state(false);

	// Dialog state for video details
	let detailVideo = $state<any | null>(null);

	function showDetails(film: any) {
		const fullData = data.submissionsWithReviews[film._id];
		detailVideo = fullData || film;
	}

	function closeDetails() {
		detailVideo = null;
	}

	// Deduplicate: highlighted videos should not appear in other sections
	let highlightIds = $derived(new Set(data.highlights.map((f: any) => f._id)));
	let unanimousFiltered = $derived(data.unanimous.filter((f: any) => !highlightIds.has(f._id)));
	let selectedFiltered = $derived(data.selected.filter((f: any) => !highlightIds.has(f._id)));
	let maybeFiltered = $derived(data.maybe.filter((f: any) => !highlightIds.has(f._id)));

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
			<summary class="cursor-pointer list-none">
				<div class="flex items-center gap-2 text-xl font-bold text-gallery-900 hover:text-black transition-colors">
					<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
					Highlights ({data.highlights.length})
				</div>
				<p class="text-sm text-gallery-500 mt-1 ml-6">Hand-picked favorites from our curators</p>
			</summary>

			{#if data.highlights.length === 0}
				<div class="mt-6 p-8 bg-gallery-50 rounded-lg text-center">
					<p class="text-gallery-500">No highlights yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
					{#each data.highlights as film}
						<button
							onclick={() => showDetails(film)}
							class="flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group/card text-left"
						>
							<!-- Poster/Screenshot -->
							{#if film.poster?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img
										src={`${film.poster.asset.url}?w=600&h=400&fit=crop`}
										alt={film.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
									/>
									<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
									{#if film.tags?.length > 0}
										<div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
											<div class="flex flex-wrap gap-1">
												{#each film.tags.slice(0, 5) as tag}
													<span class="text-[9px] px-1.5 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else if film.screenshots?.[0]?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img
										src={`${film.screenshots[0].asset.url}?w=600&h=400&fit=crop`}
										alt={film.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
									/>
									<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
									{#if film.tags?.length > 0}
										<div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
											<div class="flex flex-wrap gap-1">
												{#each film.tags.slice(0, 5) as tag}
													<span class="text-[9px] px-1.5 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else}
								<div class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
									<span class="text-gallery-400 text-4xl">🎬</span>
								</div>
							{/if}

							<!-- Content -->
							<div class="p-5 flex-1 flex flex-col space-y-4">
								<div class="flex justify-between items-start gap-4">
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-lg leading-tight text-gallery-900 truncate">{film.title}</h3>
										<p class="text-sm text-gallery-600 font-medium mt-1">
											{film.director}
											{#if film.length}<span class="text-gallery-300 mx-1.5">•</span><span>{film.length} min</span>{/if}
										</p>
									</div>
									<div class="flex flex-col items-end gap-1">
										{#if film.score !== undefined}
											<span class="text-xl font-black text-gallery-900 leading-none">{film.score.toFixed(0)}%</span>
										{/if}
										{#if film.avgRating}
											<span class="text-xs font-bold text-gallery-400">★ {film.avgRating.toFixed(1)}</span>
										{/if}
									</div>
								</div>
								<!-- Footer -->
								<div class="mt-auto pt-3 border-t border-gallery-100 flex items-center justify-between">
									<div class="flex items-center gap-1.5">
										<span class="text-xs" style="color: var(--color-highlight-500)">★</span>
										<span class="text-[10px] font-black text-gallery-600 uppercase tracking-widest">
											{film.curatorCount} Curator{film.curatorCount !== 1 ? 's' : ''}
										</span>
									</div>
									{#if film.flags && film.flags.length > 0}
										<div class="flex gap-1">
											{#each film.flags.slice(0, 2) as flag}
												<span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded {flag.color}">{flag.label}</span>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</details>
	</section>

	<!-- 100% Approval Section -->
	{#if unanimousFiltered.length > 0}
		<section class="space-y-6">
			<details class="group">
				<summary class="cursor-pointer list-none">
					<div class="flex items-center gap-2 text-xl font-bold text-gallery-900 hover:text-black transition-colors">
						<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
						100% Approval ({unanimousFiltered.length})
					</div>
					<p class="text-sm text-gallery-500 mt-1 ml-6">Films unanimously approved by all reviewers</p>
				</summary>

				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
					{#each unanimousFiltered as film}
						<button
							onclick={() => showDetails(film)}
							class="flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group/card text-left"
						>
							<!-- Poster/Screenshot -->
							{#if film.poster?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img src={`${film.poster.asset.url}?w=600&h=400&fit=crop`} alt={film.title} class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
									<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
									{#if film.tags?.length > 0}
										<div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
											<div class="flex flex-wrap gap-1">
												{#each film.tags.slice(0, 5) as tag}<span class="text-[9px] px-1.5 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else if film.screenshots?.[0]?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img src={`${film.screenshots[0].asset.url}?w=600&h=400&fit=crop`} alt={film.title} class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
									<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
									{#if film.tags?.length > 0}
										<div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
											<div class="flex flex-wrap gap-1">
												{#each film.tags.slice(0, 5) as tag}<span class="text-[9px] px-1.5 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else}
								<div class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
									<span class="text-gallery-400 text-4xl">🎬</span>
								</div>
							{/if}
							<!-- Content -->
							<div class="p-5 flex-1 flex flex-col space-y-4">
								<div class="flex justify-between items-start gap-4">
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-lg leading-tight text-gallery-900 truncate">{film.title}</h3>
										<p class="text-sm text-gallery-600 font-medium mt-1">{film.director}{#if film.length}<span class="text-gallery-300 mx-1.5">•</span><span>{film.length} min</span>{/if}</p>
									</div>
									<div class="flex flex-col items-end gap-1">
										<span class="text-xl font-black text-green-600 leading-none">100%</span>
										{#if film.avgRating}<span class="text-xs font-bold text-gallery-400">★ {film.avgRating.toFixed(1)}</span>{/if}
									</div>
								</div>
								{#if film.flags && film.flags.length > 0}
									<div class="mt-auto pt-3 border-t border-gallery-100 flex gap-1">
										{#each film.flags.slice(0, 3) as flag}<span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded {flag.color}">{flag.label}</span>{/each}
									</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			</details>
		</section>
	{/if}

	<!-- Selected Section -->
	<section class="space-y-6">
		<details class="group">
			<summary class="cursor-pointer list-none">
				<div class="flex items-center gap-2 text-xl font-bold text-gallery-900 hover:text-black transition-colors">
					<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
					Selected (≥65%) ({selectedFiltered.length})
				</div>
				<p class="text-sm text-gallery-500 mt-1 ml-6">Films with strong curator support (65%+ approval)</p>
			</summary>

			{#if selectedFiltered.length === 0}
				<div class="mt-6 p-8 bg-gallery-50 rounded-lg text-center">
					<p class="text-gallery-500">No selected films yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
					{#each selectedFiltered as film}
						<button
							onclick={() => showDetails(film)}
							class="flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group/card text-left"
						>
							<!-- Poster/Screenshot -->
							{#if film.poster?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img src={`${film.poster.asset.url}?w=600&h=400&fit=crop`} alt={film.title} class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
									<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
									{#if film.tags?.length > 0}
										<div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
											<div class="flex flex-wrap gap-1">
												{#each film.tags.slice(0, 5) as tag}<span class="text-[9px] px-1.5 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else if film.screenshots?.[0]?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img src={`${film.screenshots[0].asset.url}?w=600&h=400&fit=crop`} alt={film.title} class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
									<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
									{#if film.tags?.length > 0}
										<div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
											<div class="flex flex-wrap gap-1">
												{#each film.tags.slice(0, 5) as tag}<span class="text-[9px] px-1.5 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else}
								<div class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
									<span class="text-gallery-400 text-4xl">🎬</span>
								</div>
							{/if}
							<!-- Content -->
							<div class="p-5 flex-1 flex flex-col space-y-4">
								<div class="flex justify-between items-start gap-4">
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-lg leading-tight text-gallery-900 truncate">{film.title}</h3>
										<p class="text-sm text-gallery-600 font-medium mt-1">{film.director}{#if film.length}<span class="text-gallery-300 mx-1.5">•</span><span>{film.length} min</span>{/if}</p>
									</div>
									<div class="flex flex-col items-end gap-1">
										{#if film.score !== undefined}<span class="text-xl font-black text-gallery-900 leading-none">{film.score.toFixed(0)}%</span>{/if}
										{#if film.avgRating}<span class="text-xs font-bold text-gallery-400">★ {film.avgRating.toFixed(1)}</span>{/if}
									</div>
								</div>
								{#if film.flags && film.flags.length > 0}
									<div class="mt-auto pt-3 border-t border-gallery-100 flex gap-1">
										{#each film.flags.slice(0, 3) as flag}<span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded {flag.color}">{flag.label}</span>{/each}
									</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</details>
	</section>

	<!-- Maybe Section -->
	<section class="space-y-6">
		<details class="group">
			<summary class="cursor-pointer list-none">
				<div class="flex items-center gap-2 text-xl font-bold text-gallery-900 hover:text-black transition-colors">
					<span class="transition-transform group-open:rotate-90 text-gallery-400">▶</span>
					Maybe (35-65%) ({maybeFiltered.length})
				</div>
				<p class="text-sm text-gallery-500 mt-1 ml-6">Films under consideration for final selection</p>
			</summary>

			{#if maybeFiltered.length === 0}
				<div class="mt-6 p-8 bg-gallery-50 rounded-lg text-center">
					<p class="text-gallery-500">No maybe films yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
					{#each maybeFiltered as film}
						<button
							onclick={() => showDetails(film)}
							class="flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group/card text-left"
						>
							<!-- Poster/Screenshot -->
							{#if film.poster?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img src={`${film.poster.asset.url}?w=600&h=400&fit=crop`} alt={film.title} class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
									<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
									{#if film.tags?.length > 0}
										<div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
											<div class="flex flex-wrap gap-1">
												{#each film.tags.slice(0, 5) as tag}<span class="text-[9px] px-1.5 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else if film.screenshots?.[0]?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img src={`${film.screenshots[0].asset.url}?w=600&h=400&fit=crop`} alt={film.title} class="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
									<div class="absolute inset-0 bg-black/0 group-hover/card:bg-black/5 transition-colors"></div>
									{#if film.tags?.length > 0}
										<div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity">
											<div class="flex flex-wrap gap-1">
												{#each film.tags.slice(0, 5) as tag}<span class="text-[9px] px-1.5 py-0.5 bg-white/20 text-white rounded-full">{tag}</span>{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else}
								<div class="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
									<span class="text-gallery-400 text-4xl">🎬</span>
								</div>
							{/if}
							<!-- Content -->
							<div class="p-5 flex-1 flex flex-col space-y-4">
								<div class="flex justify-between items-start gap-4">
									<div class="flex-1 min-w-0">
										<h3 class="font-bold text-lg leading-tight text-gallery-900 truncate">{film.title}</h3>
										<p class="text-sm text-gallery-600 font-medium mt-1">{film.director}{#if film.length}<span class="text-gallery-300 mx-1.5">•</span><span>{film.length} min</span>{/if}</p>
									</div>
									<div class="flex flex-col items-end gap-1">
										{#if film.score !== undefined}<span class="text-xl font-black text-gallery-900 leading-none">{film.score.toFixed(0)}%</span>{/if}
										{#if film.avgRating}<span class="text-xs font-bold text-gallery-400">★ {film.avgRating.toFixed(1)}</span>{/if}
									</div>
								</div>
								{#if film.flags && film.flags.length > 0}
									<div class="mt-auto pt-3 border-t border-gallery-100 flex gap-1">
										{#each film.flags.slice(0, 3) as flag}<span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded {flag.color}">{flag.label}</span>{/each}
									</div>
								{/if}
							</div>
						</button>
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

<!-- Video Detail Dialog -->
{#if detailVideo}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		onclick={closeDetails}
		onkeydown={(e) => e.key === 'Escape' && closeDetails()}
		role="dialog"
		tabindex="-1"
	>
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" transition:fade={{ duration: 150 }}></div>

		<div
			class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header with Image -->
			<div class="relative h-48 bg-gallery-900">
				{#if detailVideo.poster?.asset?.url}
					<img
						src={`${detailVideo.poster.asset.url}?w=800&h=400&fit=crop`}
						alt={detailVideo.englishTitle || detailVideo.title}
						class="w-full h-full object-cover"
					/>
				{:else if detailVideo.screenshots?.[0]?.asset?.url}
					<img
						src={`${detailVideo.screenshots[0].asset.url}?w=800&h=400&fit=crop`}
						alt={detailVideo.englishTitle || detailVideo.title}
						class="w-full h-full object-cover"
					/>
				{/if}
				<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

				<!-- Close button -->
				<button
					onclick={closeDetails}
					class="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
				>
					<span class="text-lg leading-none">&times;</span>
				</button>

				<!-- Title overlay -->
				<div class="absolute bottom-0 left-0 right-0 p-6">
					<h2 class="text-2xl font-black text-white leading-tight">
						{detailVideo.englishTitle || detailVideo.title}
					</h2>
					<p class="text-white/70 text-sm mt-1">
						{detailVideo.directorName || detailVideo.director}
						{#if detailVideo.length}
							<span class="mx-2">•</span>
							{detailVideo.length} min
						{/if}
					</p>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
				{#if detailVideo}
					{@const reviews = detailVideo.reviews || []}
					{@const selectedCount = reviews.filter((r: any) => r.selection === 'selected').length}
					{@const maybeCount = reviews.filter((r: any) => r.selection === 'maybe').length}
					{@const rejectedCount = reviews.filter((r: any) => r.selection === 'rejected').length}
					{@const ratingsWithValue = reviews.filter((r: any) => r.rating != null)}
					{@const avgRating = ratingsWithValue.length > 0 ? ratingsWithValue.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingsWithValue.length : null}
					{@const allTags = [...new Set(reviews.flatMap((r: any) => (r.tags || []).map((t: any) => t.label || t)))].slice(0, 8)}
					{@const reviewsWithNotes = reviews.filter((r: any) => r.additionalComments || (r.contentNotes?.length > 0 && !r.contentNotes.every((n: string) => n === 'none')))}

					<!-- Quick Stats Row -->
					<div class="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 text-xs">
						{#if detailVideo.country}
							<span class="text-gallery-500">{detailVideo.country}</span>
						{/if}
						{#if detailVideo.filmLanguage}
							<span class="text-gallery-400">{detailVideo.filmLanguage}</span>
						{/if}
						{#if reviews.length > 0}
							<span class="text-gallery-400">•</span>
							<span class="font-medium text-gallery-600">
								{selectedCount}<span class="text-green-500 ml-0.5">✓</span>
								{maybeCount}<span class="text-yellow-500 ml-0.5">~</span>
								{rejectedCount}<span class="text-red-400 ml-0.5">✗</span>
							</span>
						{/if}
						{#if avgRating}
							<span class="font-bold text-gallery-700">★ {avgRating.toFixed(1)}</span>
						{/if}
					</div>

					<!-- Tags -->
					{#if allTags.length > 0}
						<div class="flex flex-wrap gap-1.5 mb-5">
							{#each allTags as tag}
								<span class="text-[10px] px-2 py-0.5 bg-gallery-100 text-gallery-600 rounded-full">{tag}</span>
							{/each}
						</div>
					{/if}

					<!-- Synopsis -->
					{#if detailVideo.synopsis}
						<div class="mb-5 pt-4 border-t border-gallery-100">
							<h3 class="text-[10px] font-bold uppercase tracking-wider text-gallery-500 mb-2">
								Synopsis
							</h3>
							<p class="text-sm text-gallery-700 leading-relaxed">{detailVideo.synopsis}</p>
						</div>
					{/if}

					<!-- Curator Notes -->
					{#if reviewsWithNotes.length > 0}
						<div class="mb-5 pt-4 border-t border-gallery-100">
							<h3 class="text-[10px] font-bold uppercase tracking-wider text-gallery-500 mb-3">
								Curator Notes
							</h3>
							<div class="space-y-3 max-h-48 overflow-y-auto">
								{#each reviewsWithNotes as review}
									<div class="p-3 bg-gallery-50 rounded-lg">
										{#if review.additionalComments}
											<p class="text-sm text-gallery-700">{review.additionalComments}</p>
										{/if}
										{#if review.contentNotes?.length > 0 && !review.contentNotes.every((n: string) => n === 'none')}
											<p class="text-xs text-gallery-500 mt-1 italic">Content warnings: {review.contentNotes.filter((n: string) => n !== 'none').join(', ')}</p>
										{/if}
										<p class="text-xs text-gallery-400 mt-2">— {review.curatorName}</p>
									</div>
								{/each}
							</div>
						</div>
					{/if}

				<!-- Screenshots -->
				{#if detailVideo.screenshots?.length > 1}
					<div class="mb-5 pt-4 border-t border-gallery-100">
						<h3 class="text-[10px] font-bold uppercase tracking-wider text-gallery-500 mb-3">
							Screenshots
						</h3>
						<div class="grid grid-cols-3 gap-2">
							{#each detailVideo.screenshots.slice(0, 6) as screenshot}
								{#if screenshot.asset?.url}
									<div class="aspect-video rounded-lg overflow-hidden bg-gallery-100">
										<img
											src={`${screenshot.asset.url}?w=300&h=169&fit=crop`}
											alt="Screenshot"
											class="w-full h-full object-cover"
										/>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}

				<!-- Watch/Download Links -->
				{#if detailVideo.linkToWatch || detailVideo.linkToDownload}
					<div class="flex items-center gap-3 pt-4 border-t border-gallery-100">
						{#if detailVideo.linkToWatch}
							<a
								href={detailVideo.linkToWatch}
								target="_blank"
								rel="noopener noreferrer"
								class="px-4 py-2 bg-accent-500 text-white! rounded-lg text-sm font-semibold hover:bg-accent-600 transition-colors flex items-center gap-2"
							>
								Watch Film
							</a>
						{/if}
						{#if detailVideo.linkToDownload}
							<a
								href={detailVideo.linkToDownload}
								target="_blank"
								rel="noopener noreferrer"
								class="px-4 py-2 bg-gallery-700 text-white! rounded-lg text-sm font-semibold hover:bg-gallery-800 transition-colors flex items-center gap-2"
							>
								Download
							</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

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
