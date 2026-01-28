<script lang="ts">
	import type { PageData } from './$types';
	import { formatTime } from '$lib/utils/formatting';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	let { data } = $props<{ data: PageData }>();

	let submissions = $state(data.submissions);
	let clusters = $state(data.clusters);
	let suggestions = $state(data.suggestions);

	let searchQuery = $state('');
	let filterHighlighted = $state(false);
	let sortBy = $state<'title' | 'length'>('title');

	// Local UI state
	let draggingVideoId = $state<string | null>(null);
	let isRegenerating = $state(false);

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
				alert('Suggestions updated! Reloading mapping...');
				location.reload();
			}
		} catch (e) {
			console.error('Failed to run suggestion script:', e);
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

	async function onDrop(event: DragEvent, clusterId: string | null) {
		event.preventDefault();
		const videoId = event.dataTransfer?.getData('videoId') || draggingVideoId;
		if (videoId) {
			await assignVideo(videoId, clusterId);
		}
		draggingVideoId = null;
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}

	function isSuggested(video: any, clusterName: string) {
		const suggestedTags = suggestions[clusterName] || [];
		return video.tags?.some((t: string) => suggestedTags.includes(t));
	}
</script>

<div class="min-h-screen bg-gallery-50 text-gallery-900 font-sans p-6">
	<!-- Header -->
	<header
		class="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
	>
		<div>
			<h1 class="text-3xl font-black uppercase tracking-tighter text-gallery-950">
				Category Maker <span class="text-gallery-400">/ Dashboard</span>
			</h1>
			<p class="text-gallery-500 font-medium">Assign videos to official festival categories.</p>
		</div>

		<div class="flex items-center gap-3">
			{#if data.isDev}
				<button
					onclick={runSuggestionScript}
					disabled={isRegenerating}
					class="px-4 py-2 bg-white border border-gallery-200 text-gallery-600 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gallery-100 transition-colors disabled:opacity-50"
				>
					{isRegenerating ? 'Running...' : '🔄 Regen Suggestions'}
				</button>
			{/if}
			<button
				onclick={createCategory}
				class="px-5 py-2.5 bg-gallery-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gallery-900/20 active:scale-95"
			>
				+ New Category
			</button>
		</div>
	</header>

	<div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-180px)]">
		<!-- Video Pool Sidebar -->
		<aside
			class="lg:col-span-1 bg-white rounded-2xl border border-gallery-200 shadow-sm flex flex-col overflow-hidden"
		>
			<div class="p-4 border-b border-gallery-100 space-y-3">
				<h2 class="text-xs font-black uppercase tracking-widest text-gallery-400">Video Pool</h2>

				<!-- Filters -->
				<div class="space-y-2">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search videos..."
						class="w-full px-3 py-2 bg-gallery-50 border border-gallery-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gallery-900/10 placeholder:text-gallery-300"
					/>

					<div class="flex items-center justify-between">
						<button
							onclick={() => (filterHighlighted = !filterHighlighted)}
							class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border transition-colors {filterHighlighted
								? 'bg-amber-100 border-amber-200 text-amber-700'
								: 'bg-gallery-50 border-gallery-200 text-gallery-400'}"
						>
							{filterHighlighted ? '★ Highlights Only' : '☆ All Videos'}
						</button>

						<select
							bind:value={sortBy}
							class="text-[10px] font-black uppercase tracking-widest bg-transparent border-none focus:ring-0 text-gallery-600 cursor-pointer"
						>
							<option value="title">By Title</option>
							<option value="length">By Length</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Scrollable Pool -->
			<div
				class="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide"
				ondragover={onDragOver}
				ondrop={(e) => onDrop(e, null)}
			>
				{#each availableVideos as video (video._id)}
					<div
						draggable="true"
						ondragstart={(e) => onDragStart(e, video._id)}
						class="p-2 bg-gallery-50 border border-gallery-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-gallery-400 transition-all group relative {draggingVideoId ===
						video._id
							? 'opacity-30'
							: ''}"
					>
						<div class="flex gap-3">
							{#if video.poster?.asset?.url}
								<img
									src={`${video.poster.asset.url}?w=80&h=80&fit=crop`}
									class="w-10 h-10 rounded object-cover shadow-sm bg-gallery-200"
									alt=""
								/>
							{:else}
								<div
									class="w-10 h-10 rounded bg-gallery-200 flex items-center justify-center text-xs"
								>
									🎬
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<h3 class="text-xs font-bold truncate leading-tight">{video.englishTitle}</h3>
								<div class="flex items-center gap-2 mt-1">
									<span class="text-[9px] font-black text-gallery-400 uppercase"
										>{video.length}m</span
									>
									{#if video.isHighlighted}
										<span
											class="text-[8px] font-black text-amber-600 bg-amber-100 px-1 rounded uppercase"
											>Highlighted</span
										>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}

				{#if availableVideos.length === 0}
					<div class="py-12 text-center text-gallery-300 text-xs font-medium">No videos found.</div>
				{/if}
			</div>
		</aside>

		<!-- Categories Grid -->
		<main class="lg:col-span-3 overflow-y-auto pr-2 scrollbar-hide">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
				{#each clusters as cluster (cluster._id)}
					{@const clusterVideos = getVideosForCluster(cluster._id)}
					<div
						class="bg-white rounded-2xl border-2 border-dashed border-gallery-200 p-5 flex flex-col gap-4 min-h-[300px] hover:border-gallery-400 transition-colors group/cluster"
						ondragover={onDragOver}
						ondrop={(e) => onDrop(e, cluster._id)}
					>
						<!-- Cluster Header -->
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h2
									class="text-lg font-black uppercase tracking-tight group-hover/cluster:text-gallery-950 transition-colors"
								>
									{cluster.name}
								</h2>
								<div class="flex items-center gap-2 mt-0.5">
									<span class="text-[10px] font-black text-gallery-400 uppercase tracking-widest">
										{clusterVideos.length} Videos
									</span>
									<span class="w-1 h-1 rounded-full bg-gallery-300"></span>
									<span class="text-[10px] font-bold text-gallery-400">
										{formatTime(clusterVideos.reduce((sum, v) => sum + (v.length || 0), 0))}
									</span>
								</div>
							</div>
							<button
								onclick={() => deleteCategory(cluster._id)}
								class="p-1.5 text-gallery-300 hover:text-red-500 transition-colors opacity-0 group-hover/cluster:opacity-100"
							>
								🗑️
							</button>
						</div>

						<!-- Cluster Videos -->
						<div class="flex-1 space-y-2">
							<!-- Recommendations badge for highlights -->
							{#if availableVideos.some((v) => v.isHighlighted && isSuggested(v, cluster.name))}
								<div class="mb-3 p-3 bg-gallery-50 rounded-xl border border-gallery-200">
									<h4 class="text-[9px] font-black uppercase tracking-widest text-gallery-400 mb-2">
										Suggested Highlights
									</h4>
									<div class="flex flex-wrap gap-2">
										{#each availableVideos.filter((v) => v.isHighlighted && isSuggested(v, cluster.name)) as sugVideo}
											<button
												onclick={() => assignVideo(sugVideo._id, cluster._id)}
												class="px-2 py-1 bg-white border border-gallery-200 rounded-lg text-[10px] font-bold hover:border-gallery-900 transition-all shadow-sm"
											>
												{sugVideo.englishTitle}
											</button>
										{/each}
									</div>
								</div>
							{/if}

							<div class="grid grid-cols-1 gap-2">
								{#each clusterVideos as video (video._id)}
									<div
										class="p-2 bg-gallery-50 border border-gallery-200 rounded-lg flex items-center justify-between group/video"
									>
										<div class="flex items-center gap-3 min-w-0">
											{#if video.isHighlighted}
												<span class="text-amber-500 text-xs">★</span>
											{/if}
											<span class="text-xs font-bold truncate">{video.englishTitle}</span>
											<span class="text-[9px] font-black text-gallery-300 uppercase"
												>{video.length}m</span
											>
										</div>
										<button
											onclick={() => assignVideo(video._id, null)}
											class="text-[14px] text-gallery-300 hover:text-gallery-900 transition-colors px-1"
										>
											×
										</button>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}

				<!-- Empty State for Categories -->
				{#if clusters.length === 0}
					<div
						class="col-span-full py-20 bg-gallery-100/50 rounded-3xl border-4 border-dashed border-gallery-200 flex flex-col items-center justify-center text-gallery-400"
					>
						<span class="text-4xl mb-4">📁</span>
						<p class="font-black uppercase tracking-widest text-sm">No categories yet</p>
						<button
							onclick={createCategory}
							class="mt-4 text-xs font-black text-gallery-900 hover:underline"
							>Click here to create your first category</button
						>
					</div>
				{/if}
			</div>
		</main>
	</div>
</div>

<style>
	/* Custom scrollbar for better look */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
