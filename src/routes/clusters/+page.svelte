<script lang="ts">
	import type { PageData } from './$types';
	import { StatCard } from '$lib/components/ui';
	import { formatTime } from '$lib/utils/formatting';

	let { data } = $props<{ data: PageData }>();
</script>

<div class="space-y-12 pb-20">
	<!-- Stats Section -->
	<section class="grid gap-4 md:grid-cols-3">
		<StatCard label="Total Categories" value={data.stats.totalClusters} />
		<StatCard label="Videos Clustered" value={data.stats.totalVideosInClusters} />
		<StatCard label="Collective Length">
			<p class="text-lg font-semibold text-gallery-700">
				{Math.floor(data.stats.totalTimeAcrossClusters / 60)}h {data.stats.totalTimeAcrossClusters %
					60}m
			</p>
		</StatCard>
	</section>

	<header>
		<h1 class="text-3xl font-bold mb-1">Semantic Clusters</h1>
		<p class="text-gallery-600 text-sm">Potential festival categories based on curator insights</p>
	</header>

	<div class="space-y-16">
		{#if data.error}
			<div class="p-8 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center">
				<p class="font-bold mb-2">Notice</p>
				<p>{data.error}</p>
			</div>
		{/if}

		{#each data.clusters as cluster}
			{@const hasRelevant = cluster.relevantMovies.length > 0}
			<section class="space-y-6">
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
						<div class="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x snap-mandatory">
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
												<span class="text-[9px] font-black text-white/50 uppercase tracking-widest"
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
			</section>
		{/each}

		{#if data.lastUpdated}
			<p class="text-[10px] font-bold text-gallery-400 text-center pt-10 uppercase tracking-widest">
				Last generated: {new Date(data.lastUpdated).toLocaleString()}
			</p>
		{/if}
	</div>
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
</style>
