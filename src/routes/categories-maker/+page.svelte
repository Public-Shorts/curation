<script lang="ts">
	import type { PageData } from './$types';
	import { Search, Info, GripVertical, Trash2, X, ChevronRight, Plus, Play, LayoutGrid } from 'lucide-svelte';
	import { formatTime } from '$lib/utils/formatting';
	import { fade, fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let { data } = $props<{ data: PageData }>();

	let submissions = $state(data.submissions);
	let clusters = $state(data.clusters);
	let suggestions = $state(data.suggestions);

	let searchQuery = $state('');
	let filterHighlighted = $state(false);
	let sortBy = $state<'title' | 'length'>('title');

	// Local UI state
	let draggingVideoId = $state<string | null>(null);
	let dragOverClusterId = $state<string | null>(null);
	let isRegenerating = $state(false);
	let detailVideo = $state<any | null>(null);

	function showDetails(video: any) {
		detailVideo = video;
	}

	function closeDetails() {
		detailVideo = null;
	}

	function getThumbUrl(video: any): string | null {
		return video.poster?.asset?.url || video.screenshots?.[0]?.asset?.url || null;
	}

	// Stats
	let totalAssigned = $derived(submissions.filter((s) => s.assignedCategory).length);
	let totalHighlighted = $derived(submissions.filter((s) => s.isHighlighted).length);
	let highlightsAssigned = $derived(submissions.filter((s) => s.isHighlighted && s.assignedCategory).length);

	// Derived lists
	let availableVideos = $derived(
		submissions
			.filter((s) => !s.assignedCategory)
			.filter((s) => (searchQuery ? s.englishTitle.toLowerCase().includes(searchQuery.toLowerCase()) : true))
			.filter((s) => (filterHighlighted ? s.isHighlighted : true))
			.sort((a, b) => {
				if (sortBy === 'title') return a.englishTitle.localeCompare(b.englishTitle);
				return (b.length || 0) - (a.length || 0);
			})
	);

	function getVideosForCluster(clusterId: string) {
		return submissions.filter((s) => s.assignedCategory?._ref === clusterId);
	}

	async function assignVideo(videoId: string, clusterId: string | null) {
		// Optimistic update
		const videoIndex = submissions.findIndex((s) => s._id === videoId);
		if (videoIndex === -1) return;

		const oldCluster = submissions[videoIndex].assignedCategory;
		submissions[videoIndex].assignedCategory = clusterId ? { _type: 'reference', _ref: clusterId } : undefined;

		try {
			const action = clusterId ? 'assign-video' : 'unassign-video';
			const res = await fetch('/api/categories-maker', {
				method: 'POST',
				body: JSON.stringify({ action, videoId, clusterId })
			});
			const result = await res.json();
			if (!result.success) throw new Error(result.error);
		} catch (e) {
			console.error('Failed to assign video:', e);
			// Rollback
			submissions[videoIndex].assignedCategory = oldCluster;
			alert('Failed to save change to Sanity.');
		}
	}

	async function createCategory() {
		const name = prompt('Category Name:');
		if (!name) return;

		try {
			const res = await fetch('/api/categories-maker', {
				method: 'POST',
				body: JSON.stringify({ action: 'create-category', name })
			});
			const result = await res.json();
			if (result.success) {
				clusters = [...clusters, result.result];
			}
		} catch (e) {
			console.error('Failed to create category:', e);
		}
	}

	async function deleteCategory(id: string) {
		if (!confirm('Are you sure you want to delete this category? All assigned videos will be unassigned.'))
			return;

		try {
			const res = await fetch('/api/categories-maker', {
				method: 'POST',
				body: JSON.stringify({ action: 'delete-category', id })
			});
			const result = await res.json();
			if (result.success) {
				clusters = clusters.filter((c) => c._id !== id);
				// Unassign locally
				submissions = submissions.map((s) =>
					s.assignedCategory?._ref === id ? { ...s, assignedCategory: undefined } : s
				);
			}
		} catch (e) {
			console.error('Failed to delete category:', e);
		}
	}

	async function runSuggestionScript() {
		isRegenerating = true;
		try {
			const res = await fetch('/api/categories-maker', {
				method: 'POST',
				body: JSON.stringify({ action: 'run-suggestion-script' })
			});
			const result = await res.json();
			if (result.success) {
				alert('Suggestions regenerated! Reloading...');
				location.reload();
			} else {
				alert('Failed: ' + (result.error || 'Unknown error'));
			}
		} catch (e) {
			console.error('Failed to run suggestion script:', e);
			alert('Failed to run suggestion script');
		} finally {
			isRegenerating = false;
		}
	}

	// DnD Handlers
	function onDragStart(event: DragEvent, videoId: string) {
		draggingVideoId = videoId;
		if (event.dataTransfer) {
			event.dataTransfer.setData('videoId', videoId);
			event.dataTransfer.effectAllowed = 'move';
		}
	}

	function onDragEnd() {
		draggingVideoId = null;
		dragOverClusterId = null;
	}

	async function onDrop(event: DragEvent, clusterId: string | null) {
		event.preventDefault();
		const videoId = event.dataTransfer?.getData('videoId') || draggingVideoId;
		if (videoId) {
			await assignVideo(videoId, clusterId);
		}
		draggingVideoId = null;
		dragOverClusterId = null;
	}

	function onDragOver(event: DragEvent, clusterId: string | null = null) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		dragOverClusterId = clusterId;
	}

	function onDragLeave() {
		dragOverClusterId = null;
	}

	// Score how well a video matches a category's suggested tags
	function getMatchScore(video: any, suggestedTags: string[]): number {
		if (!video.curatorTags?.length) return 0;
		const videoTags = video.curatorTags.map((t: string) => t.toLowerCase());

		return suggestedTags.reduce((score, sugTag) => {
			const st = sugTag.toLowerCase();
			const hasMatch = videoTags.some((vt: string) => vt.includes(st) || st.includes(vt));
			return hasMatch ? score + 1 : score;
		}, 0);
	}

	// Case-insensitive lookup for suggestions
	function getSuggestionsForCategory(categoryName: string): string[] {
		const lowerName = categoryName.toLowerCase();
		const key = Object.keys(suggestions).find((k) => k.toLowerCase() === lowerName);
		return key ? suggestions[key] : [];
	}

	function getSuggestedVideosForCluster(clusterId: string) {
		const cluster = clusters.find((c) => c._id === clusterId);
		if (!cluster) return { highlighted: [], regular: [] };

		const categoryName = cluster.name;
		const suggestedTags = getSuggestionsForCategory(categoryName);
		if (suggestedTags.length === 0) return { highlighted: [], regular: [] };

		// Score each video by number of matching tags and sort by relevance
		const scoredVideos = availableVideos
			.map((v) => ({ video: v, score: getMatchScore(v, suggestedTags) }))
			.filter((item) => item.score > 0)
			.sort((a, b) => b.score - a.score);

		const suggested = scoredVideos.map((item) => item.video);

		return {
			highlighted: suggested.filter((v) => v.isHighlighted),
			regular: suggested.filter((v) => !v.isHighlighted)
		};
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gallery-50 via-gallery-50 to-gallery-100 text-gallery-900 font-sans">
	<!-- Header -->
	<header class="sticky top-0 z-10 backdrop-blur-xl bg-gallery-50/80 border-b border-gallery-200/50">
		<div class="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl md:text-3xl font-black uppercase tracking-tight text-gallery-900">
					Category Maker
				</h1>
				<p class="text-gallery-500 text-sm mt-0.5">Organize films into festival programme categories</p>
			</div>

			<div class="flex items-center gap-3">
				<!-- Stats Pills -->
				<div class="hidden md:flex items-center gap-2 mr-2">
					<span class="px-3 py-1.5 bg-gallery-100 rounded-full text-[10px] font-bold text-gallery-600 uppercase tracking-wide">
						{totalAssigned}/{submissions.length} Assigned
					</span>
					<span class="px-3 py-1.5 bg-amber-50 rounded-full text-[10px] font-bold text-amber-600 uppercase tracking-wide">
						{highlightsAssigned}/{totalHighlighted} ★ Assigned
					</span>
				</div>

				{#if data.isDev}
					<button
						onclick={runSuggestionScript}
						disabled={isRegenerating}
						class="px-4 py-2.5 bg-white border border-gallery-200 text-gallery-600 rounded-xl text-[10px] font-bold uppercase tracking-wide hover:bg-gallery-50 hover:border-gallery-300 transition-all disabled:opacity-50 shadow-sm"
					>
						{isRegenerating ? 'Running...' : 'Refresh Suggestions'}
					</button>
				{/if}
				<button
					onclick={createCategory}
					class="px-5 py-2.5 bg-accent-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wide hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/25 active:scale-[0.98]"
				>
					+ New Category
				</button>
			</div>
		</div>
	</header>

	<div class="px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-100px)]">
		<!-- Video Pool Sidebar -->
		<aside
			class="lg:col-span-2 bg-white rounded-2xl border border-gallery-200 shadow-sm flex flex-col overflow-hidden {dragOverClusterId === null && draggingVideoId ? 'ring-2 ring-accent-500/50 border-accent-300' : ''}"
			ondragover={(e) => onDragOver(e, null)}
			ondrop={(e) => onDrop(e, null)}
			ondragleave={onDragLeave}
		>
			<div class="p-4 border-b border-gallery-100 space-y-3 bg-gradient-to-b from-gallery-50/50 to-white">
				<div class="flex items-center justify-between">
					<h2 class="text-[11px] font-bold uppercase tracking-wider text-gallery-500">Unassigned Films</h2>
					<span class="text-[10px] font-bold text-gallery-400 bg-gallery-100 px-2 py-0.5 rounded-full">
						{availableVideos.length}
					</span>
				</div>

				<!-- Search -->
				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gallery-400" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search films..."
						class="w-full pl-10 pr-4 py-2.5 bg-gallery-50 border border-gallery-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-300 placeholder:text-gallery-400 transition-all"
					/>
				</div>

				<!-- Filters Row -->
				<div class="flex items-center justify-between gap-2">
					<button
						onclick={() => (filterHighlighted = !filterHighlighted)}
						class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border transition-all {filterHighlighted
							? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
							: 'bg-gallery-50 border-gallery-200 text-gallery-500 hover:border-gallery-300'}"
					>
						<span class="text-xs">{filterHighlighted ? '★' : '☆'}</span>
						{filterHighlighted ? 'Highlights' : 'All Films'}
					</button>

					<select
						bind:value={sortBy}
						class="text-[10px] font-bold uppercase tracking-wide bg-gallery-50 border border-gallery-200 rounded-lg px-2 py-1.5 text-gallery-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/20"
					>
						<option value="title">A-Z</option>
						<option value="length">Duration</option>
					</select>
				</div>
			</div>

			<!-- Scrollable Pool -->
			<div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
				{#each availableVideos as video, i (video._id)}
					<div
						in:fade={{ delay: i * 20, duration: 200 }}
						draggable="true"
						ondragstart={(e) => onDragStart(e, video._id)}
						ondragend={onDragEnd}
						class="p-3 bg-gradient-to-r from-gallery-50 to-white border border-gallery-200 rounded-xl cursor-grab active:cursor-grabbing hover:border-gallery-300 hover:shadow-md transition-all duration-200 group {draggingVideoId === video._id ? 'opacity-40 scale-95' : ''}"
					>
						<div class="flex gap-3 items-center">
							{#if getThumbUrl(video)}
								<img
									src={`${getThumbUrl(video)}?w=80&h=80&fit=crop`}
									class="w-12 h-12 rounded-lg object-cover shadow-sm bg-gallery-200 flex-shrink-0"
									alt=""
								/>
							{:else}
								<div class="w-12 h-12 rounded-lg bg-gradient-to-br from-gallery-200 to-gallery-300 flex items-center justify-center text-lg flex-shrink-0">
									🎬
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<h3 class="text-sm font-semibold text-gallery-800 truncate leading-tight group-hover:text-gallery-900">
									{video.englishTitle}
								</h3>
								<div class="flex items-center gap-2 mt-1">
									<span class="text-[10px] font-medium text-gallery-500">{video.length} min</span>
									{#if video.isHighlighted}
										<span class="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
											{video.highlightCount}★
										</span>
									{/if}
								</div>
							</div>
							<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									onclick={(e) => { e.stopPropagation(); showDetails(video); }}
									class="p-1.5 rounded-lg transition-all text-gallery-400 hover:text-gallery-600 hover:bg-gallery-100"
									title="View details"
								>
									<Info class="w-4 h-4" />
								</button>
								<GripVertical class="w-4 h-4 text-gallery-300" />
							</div>
						</div>
					</div>
				{/each}

				{#if availableVideos.length === 0}
					<div class="py-16 text-center">
						<div class="w-16 h-16 mx-auto mb-4 bg-gallery-100 rounded-2xl flex items-center justify-center">
							<Search class="w-8 h-8 text-gallery-400" />
						</div>
						<p class="text-gallery-400 text-sm font-medium">No films found</p>
						<p class="text-gallery-300 text-xs mt-1">Try adjusting your filters</p>
					</div>
				{/if}
			</div>
		</aside>

		<!-- Categories Grid -->
		<main class="lg:col-span-3 overflow-y-auto pr-1 custom-scrollbar">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5 pb-8">
				{#each clusters as cluster, i (cluster._id)}
					{@const clusterVideos = getVideosForCluster(cluster._id)}
					{@const totalDuration = clusterVideos.reduce((sum, v) => sum + (v.length || 0), 0)}
					{@const highlightCount = clusterVideos.filter(v => v.isHighlighted).length}
					{@const suggestedVideos = getSuggestedVideosForCluster(cluster._id)}
					{@const categoryTags = getSuggestionsForCategory(cluster.name)}
					<div
						in:scale={{ delay: i * 50, duration: 300, start: 0.95, easing: quintOut }}
						class="bg-white rounded-2xl border-2 transition-all duration-300 p-5 flex flex-col min-h-[320px] group/cluster {dragOverClusterId === cluster._id
							? 'border-accent-400 shadow-xl shadow-accent-500/10 scale-[1.02]'
							: 'border-gallery-200 hover:border-gallery-300 hover:shadow-lg'}"
						ondragover={(e) => onDragOver(e, cluster._id)}
						ondrop={(e) => onDrop(e, cluster._id)}
						ondragleave={onDragLeave}
					>
						<!-- Cluster Header -->
						<div class="flex items-start justify-between mb-4">
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h2 class="text-xl font-black text-gallery-900 tracking-tight">
										{cluster.name}
									</h2>
									<span class="text-amber-500 text-sm font-bold">{highlightCount}★</span>
								</div>
								<div class="flex items-center gap-3 mt-1.5">
									<span class="text-[11px] font-semibold text-gallery-500 bg-gallery-100 px-2 py-0.5 rounded-md">
										{clusterVideos.length} film{clusterVideos.length !== 1 ? 's' : ''}
									</span>
									{#if totalDuration > 0}
										<span class="text-[11px] font-medium text-gallery-400">
											{formatTime(totalDuration)} total
										</span>
									{/if}
								</div>
							</div>
							<button
								onclick={() => deleteCategory(cluster._id)}
								class="p-2 rounded-lg transition-all opacity-0 group-hover/cluster:opacity-100 text-gallery-300 hover:text-red-500 hover:bg-red-50"
								title="Delete category"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						</div>

						<!-- Cluster Content -->
						<div class="flex-1 flex flex-col gap-3">
							<!-- Videos List -->
							<div class="flex-1 space-y-2 overflow-y-auto max-h-[200px] custom-scrollbar-thin">
								{#each clusterVideos as video (video._id)}
									<div
										in:fly={{ x: -10, duration: 200 }}
										class="p-2 bg-gallery-50 border border-gallery-200 rounded-xl flex items-center gap-2 group/video hover:bg-gallery-100 transition-colors"
									>
										<!-- Thumbnail -->
										{#if getThumbUrl(video)}
											<img
												src={`${getThumbUrl(video)}?w=60&h=40&fit=crop`}
												alt=""
												class="w-10 h-7 rounded object-cover bg-gallery-200 flex-shrink-0"
											/>
										{:else}
											<div class="w-10 h-7 rounded bg-gallery-200 flex items-center justify-center text-[10px] flex-shrink-0">🎬</div>
										{/if}
										<div class="flex items-center gap-2 min-w-0 flex-1">
											{#if video.isHighlighted}
												<span class="text-amber-500 text-[10px] font-bold flex-shrink-0">{video.highlightCount}★</span>
											{/if}
											<span class="text-xs font-medium text-gallery-800 truncate">{video.englishTitle}</span>
											<span class="text-[9px] font-medium text-gallery-400 flex-shrink-0">{video.length}m</span>
										</div>
										<div class="flex items-center gap-1 opacity-0 group-hover/video:opacity-100 transition-opacity flex-shrink-0">
											<button
												onclick={() => showDetails(video)}
												class="p-1 rounded-md transition-all text-gallery-400 hover:text-gallery-600 hover:bg-gallery-200"
												title="View details"
											>
												<Info class="w-3.5 h-3.5" />
											</button>
											<button
												onclick={() => assignVideo(video._id, null)}
												class="p-1 rounded-md transition-all text-gallery-300 hover:text-red-500 hover:bg-red-50"
												title="Remove from category"
											>
												<X class="w-3.5 h-3.5" />
											</button>
										</div>
									</div>
								{/each}

								{#if clusterVideos.length === 0}
									<div class="py-8 text-center border-2 border-dashed border-gallery-200 rounded-xl {dragOverClusterId === cluster._id ? 'border-accent-300 bg-accent-50/30' : ''}">
										<p class="text-gallery-400 text-sm font-medium">Drop films here</p>
										<p class="text-gallery-300 text-xs mt-0.5">Drag from the sidebar</p>
									</div>
								{/if}
							</div>

							<!-- Collapsible Suggestions Section -->
							{#if suggestedVideos.highlighted.length > 0 || suggestedVideos.regular.length > 0}
								<details class="group/suggestions">
									<summary class="cursor-pointer list-none flex items-center gap-2 py-2 px-3 bg-gallery-50 hover:bg-gallery-100 rounded-lg border border-gallery-200 transition-colors">
										<ChevronRight class="w-3 h-3 text-gallery-400 transition-transform group-open/suggestions:rotate-90" />
										<span class="text-[10px] font-bold uppercase tracking-wider text-gallery-500">
											Suggestions ({suggestedVideos.highlighted.length + suggestedVideos.regular.length})
										</span>
										{#if categoryTags.length > 0}
											<div class="flex-1 flex flex-wrap gap-1 justify-end">
												{#each categoryTags.slice(0, 3) as tag}
													<span class="text-[8px] px-1.5 py-0.5 bg-gallery-200/50 text-gallery-400 rounded">
														{tag}
													</span>
												{/each}
												{#if categoryTags.length > 3}
													<span class="text-[8px] text-gallery-400">+{categoryTags.length - 3}</span>
												{/if}
											</div>
										{/if}
									</summary>
									<div class="mt-2 p-3 bg-gradient-to-r from-gallery-50 to-gallery-100 rounded-xl border border-gallery-200/50 space-y-3">
										<!-- Highlighted Suggestions -->
										{#if suggestedVideos.highlighted.length > 0}
											<div>
												<span class="text-[9px] font-bold uppercase tracking-wider text-amber-600 mb-1.5 block">
													Highlights
												</span>
												<div class="flex flex-wrap gap-2">
													{#each suggestedVideos.highlighted as sugVideo}
														<div class="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg p-1.5 pr-2 group/sug">
															{#if getThumbUrl(sugVideo)}
																<img
																	src={`${getThumbUrl(sugVideo)}?w=48&h=32&fit=crop`}
																	alt=""
																	class="w-8 h-5 rounded object-cover bg-amber-100 flex-shrink-0"
																/>
															{:else}
																<div class="w-8 h-5 rounded bg-amber-100 flex items-center justify-center text-[8px] flex-shrink-0">🎬</div>
															{/if}
															<span class="text-[10px] font-semibold text-amber-800 truncate max-w-[100px]">{sugVideo.englishTitle}</span>
															<button
																onclick={() => showDetails(sugVideo)}
																class="p-0.5 text-amber-400 hover:text-amber-600 rounded opacity-0 group-hover/sug:opacity-100 transition-opacity"
																title="View details"
															>
																<Info class="w-3 h-3" />
															</button>
															<button
																onclick={() => assignVideo(sugVideo._id, cluster._id)}
																class="p-0.5 text-amber-500 hover:text-amber-700 rounded"
																title="Add to category"
															>
																<Plus class="w-3 h-3" />
															</button>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<!-- Regular Suggestions -->
										{#if suggestedVideos.regular.length > 0}
											<div>
												<span class="text-[9px] font-bold uppercase tracking-wider text-gallery-500 mb-1.5 block">
													Other Films
												</span>
												<div class="flex flex-wrap gap-2">
													{#each suggestedVideos.regular.slice(0, 6) as sugVideo}
														<div class="flex items-center gap-1.5 bg-white border border-gallery-200 rounded-lg p-1.5 pr-2 group/sug">
															{#if getThumbUrl(sugVideo)}
																<img
																	src={`${getThumbUrl(sugVideo)}?w=48&h=32&fit=crop`}
																	alt=""
																	class="w-8 h-5 rounded object-cover bg-gallery-100 flex-shrink-0"
																/>
															{:else}
																<div class="w-8 h-5 rounded bg-gallery-100 flex items-center justify-center text-[8px] flex-shrink-0">🎬</div>
															{/if}
															<span class="text-[10px] font-semibold text-gallery-700 truncate max-w-[80px]">{sugVideo.englishTitle}</span>
															<button
																onclick={() => showDetails(sugVideo)}
																class="p-0.5 text-gallery-400 hover:text-gallery-600 rounded opacity-0 group-hover/sug:opacity-100 transition-opacity"
																title="View details"
															>
																<Info class="w-3 h-3" />
															</button>
															<button
																onclick={() => assignVideo(sugVideo._id, cluster._id)}
																class="p-0.5 text-gallery-500 hover:text-gallery-700 rounded"
																title="Add to category"
															>
																<Plus class="w-3 h-3" />
															</button>
														</div>
													{/each}
													{#if suggestedVideos.regular.length > 6}
														<span class="flex items-center px-2 text-[10px] font-medium text-gallery-400">
															+{suggestedVideos.regular.length - 6} more
														</span>
													{/if}
												</div>
											</div>
										{/if}
									</div>
								</details>
							{/if}
						</div>
					</div>
				{/each}

				<!-- Empty State for Categories -->
				{#if clusters.length === 0}
					<div
						class="col-span-full py-24 bg-white rounded-3xl border-2 border-dashed border-gallery-200 flex flex-col items-center justify-center"
					>
						<div class="w-20 h-20 mb-6 bg-gradient-to-br from-gallery-100 to-gallery-200 rounded-2xl flex items-center justify-center">
							<LayoutGrid class="w-10 h-10 text-gallery-400" />
						</div>
						<h3 class="text-xl font-bold text-gallery-700 mb-2">No categories yet</h3>
						<p class="text-gallery-400 text-sm mb-6">Create your first category to start organizing films</p>
						<button
							onclick={createCategory}
							class="px-6 py-3 bg-accent-500 text-white rounded-xl text-sm font-bold hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/25"
						>
							Create First Category
						</button>
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

<!-- Detail Modal -->
{#if detailVideo}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		onclick={closeDetails}
		onkeydown={(e) => e.key === 'Escape' && closeDetails()}
		role="dialog"
		tabindex="-1"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" transition:fade={{ duration: 150 }}></div>

		<!-- Modal -->
		<div
			class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header with image -->
			<div class="relative h-48 bg-gallery-900">
				{#if getThumbUrl(detailVideo)}
					<img
						src={`${getThumbUrl(detailVideo)}?w=800&h=400&fit=crop`}
						alt=""
						class="w-full h-full object-cover opacity-80"
					/>
				{/if}
				<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
				<button
					onclick={closeDetails}
					class="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors"
				>
					<X class="w-5 h-5" />
				</button>
				<div class="absolute bottom-4 left-6 right-6">
					<div class="flex items-center gap-2 mb-1">
						{#if detailVideo.isHighlighted}
							<span class="text-amber-400 text-lg">★</span>
						{/if}
						<h2 class="text-2xl font-black text-white">{detailVideo.englishTitle}</h2>
					</div>
					<p class="text-white/70 text-sm">{detailVideo.directorName || 'Unknown director'} · {detailVideo.length} min</p>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
				<!-- Synopsis -->
				{#if detailVideo.synopsis}
					<div class="mb-5">
						<h3 class="text-[10px] font-bold uppercase tracking-wider text-gallery-500 mb-2">Synopsis</h3>
						<p class="text-sm text-gallery-700 leading-relaxed">{detailVideo.synopsis}</p>
					</div>
				{/if}

				<!-- Curator Tags -->
				{#if detailVideo.curatorTags?.length > 0}
					<div class="mb-5">
						<h3 class="text-[10px] font-bold uppercase tracking-wider text-gallery-500 mb-2">Curator Tags</h3>
						<div class="flex flex-wrap gap-1.5">
							{#each detailVideo.curatorTags as tag}
								<span class="px-2.5 py-1 bg-gallery-100 text-gallery-700 rounded-full text-xs font-medium">
									{tag}
								</span>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Screenshots -->
				{#if detailVideo.screenshots?.length > 0}
					<div class="mb-5">
						<h3 class="text-[10px] font-bold uppercase tracking-wider text-gallery-500 mb-2">Screenshots</h3>
						<div class="grid grid-cols-3 gap-2">
							{#each detailVideo.screenshots.slice(0, 6) as screenshot}
								<img
									src={`${screenshot.asset?.url}?w=300&h=200&fit=crop`}
									alt=""
									class="w-full aspect-video object-cover rounded-lg bg-gallery-100"
								/>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex items-center gap-3 pt-4 border-t border-gallery-100">
					{#if detailVideo.linkToWatch}
						<a
							href={detailVideo.linkToWatch}
							target="_blank"
							rel="noopener noreferrer"
							class="px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-semibold hover:bg-accent-600 transition-colors flex items-center gap-2"
						>
							<Play class="w-4 h-4" />
							Watch Film
						</a>
					{/if}
					{#if detailVideo.assignedCategory}
						<span class="text-xs text-gallery-500">
							Assigned to a category
						</span>
					{:else}
						<span class="text-xs text-gallery-400">
							Not yet assigned
						</span>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar */
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: var(--color-gallery-300);
		border-radius: 3px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: var(--color-gallery-400);
	}

	/* Thin scrollbar variant */
	.custom-scrollbar-thin::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar-thin::-webkit-scrollbar-thumb {
		background: var(--color-gallery-200);
		border-radius: 2px;
	}
	.custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: var(--color-gallery-300);
	}

	/* Firefox scrollbar */
	.custom-scrollbar {
		scrollbar-width: thin;
		scrollbar-color: var(--color-gallery-300) transparent;
	}
	.custom-scrollbar-thin {
		scrollbar-width: thin;
		scrollbar-color: var(--color-gallery-200) transparent;
	}
</style>
