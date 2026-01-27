<script lang="ts">
	import type { PageData } from './$types';
	import { StatCard } from '$lib/components/ui';

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
		{#each data.clusters as cluster}
			<section class="space-y-4">
				<div class="flex flex-col px-1 gap-2">
					<div class="flex items-center gap-3">
						<h2 class="text-2xl font-bold text-gallery-900 leading-tight">
							{cluster.name}
						</h2>
						<span
							class="px-2 py-0.5 bg-white text-gallery-500 rounded text-[10px] font-black uppercase border border-gallery-200/50"
						>
							{cluster.count} videos
						</span>
						<span class="text-gallery-400 font-bold uppercase text-[11px] tracking-tight">
							{cluster.totalHours}h {cluster.totalMins}m total
						</span>
					</div>

					<!-- Curator Tags -->
					<p class="text-gallery-500 text-sm font-medium max-w-3xl leading-relaxed">
						{cluster.description}
					</p>
					<div class="flex flex-wrap gap-1.5 py-1">
						{#each cluster.tags as tag}
							<span
								class="text-[9px] uppercase font-black tracking-wider px-2 py-0.5 bg-gallery-50 text-gallery-400 rounded-full border border-gallery-100"
							>
								{tag}
							</span>
						{/each}
					</div>
				</div>

				<!-- Horizontal Carousel -->
				<div class="relative group -mx-1">
					<div class="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x snap-mandatory">
						{#each cluster.movies as movie}
							<a
								href="/review/{movie._id}"
								class="flex-shrink-0 w-[280px] sm:w-[320px] aspect-video bg-white rounded-xl border border-gallery-200/50 shadow-sm hover:shadow-md hover:border-gallery-300 transition-all duration-300 group/item overflow-hidden snap-start"
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
									<div class="absolute bottom-0 left-0 right-0 p-4">
										<h3 class="text-white font-bold text-sm truncate mb-1">
											{movie.title}
										</h3>
										<div class="flex items-center gap-2">
											<span class="text-[10px] font-black text-white/60 uppercase tracking-widest"
												>{movie.length}m</span
											>
											<span class="text-[10px] font-bold text-amber-400/80">Details →</span>
										</div>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</section>
		{/each}
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
