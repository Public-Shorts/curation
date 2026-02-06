<script lang="ts">
	import { StatCard } from '$lib/components/ui';
	import { LayoutGrid, List, BanIcon } from 'lucide-svelte';
	import VoteBreakdown from '$lib/components/selection/VoteBreakdown.svelte';
	import FlagBadge from '$lib/components/ui/FlagBadge.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let stats = $derived(data.stats);
	let isAdmin = $derived(data.isAdmin || false);

	// Veto dialog state
	let vetoDialogOpen = $state(false);
	let vetoSubmissionId = $state('');
	let vetoSubmissionTitle = $state('');
	let vetoFromCinema = $state(true);
	let vetoFromTV = $state(true);
	let vetoReason = $state('');
	let vetoLoading = $state(false);
	let vetoError = $state('');

	let sortKey = $state('popular'); // 'popular', 'score', 'title', 'length'
	let sortDir = $state<'asc' | 'desc'>('desc');
	let viewMode = $state<'card' | 'inline'>('card');
	let selectedTags = $state<string[]>([]);
	let tagSearchQuery = $state('');
	let tagDropdownOpen = $state(false);

	// Collect all unique tags across all highlights (only 2+ occurrences)
	let allTags = $derived.by(() => {
		const tagMap = new Map<string, { label: string; count: number }>();
		data.highlights.forEach((h: any) => {
			(h.uniqueTags || []).forEach((tag: any) => {
				if (tag?.label) {
					const existing = tagMap.get(tag.label);
					tagMap.set(tag.label, {
						label: tag.label,
						count: (existing?.count || 0) + 1
					});
				}
			});
		});
		return Array.from(tagMap.values())
			.filter((t) => t.count >= 2)
			.sort((a, b) => b.count - a.count);
	});

	// Filter tags by search query
	let searchFilteredTags = $derived.by(() => {
		if (!tagSearchQuery.trim()) return allTags;
		const q = tagSearchQuery.toLowerCase();
		return allTags.filter((t) => t.label.toLowerCase().includes(q));
	});

	function toggleTag(tagLabel: string) {
		if (selectedTags.includes(tagLabel)) {
			selectedTags = selectedTags.filter((t) => t !== tagLabel);
		} else {
			selectedTags = [...selectedTags, tagLabel];
		}
	}

	function closeDropdown() {
		tagDropdownOpen = false;
		tagSearchQuery = '';
	}

	let filteredHighlights = $derived.by(() => {
		if (selectedTags.length === 0) return data.highlights;
		return data.highlights.filter((h: any) => {
			const tagLabels = (h.uniqueTags || []).map((t: any) => t?.label);
			return selectedTags.some((tag) => tagLabels.includes(tag));
		});
	});

	let sortedHighlights = $derived.by(() => {
		return [...filteredHighlights].sort((a, b) => {
			let av, bv;

			if (sortKey === 'popular') {
				av = a.curators.length;
				bv = b.curators.length;
			} else if (sortKey === 'score') {
				av = a.submission.score || 0;
				bv = b.submission.score || 0;
			} else if (sortKey === 'title') {
				av = a.submission.englishTitle.toLowerCase();
				bv = b.submission.englishTitle.toLowerCase();
			} else if (sortKey === 'length') {
				av = a.submission.length || 0;
				bv = b.submission.length || 0;
			}

			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});
	});

	function toggleSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'title' ? 'asc' : 'desc';
		}
	}

	function openVetoDialog(submissionId: string, submissionTitle: string, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		vetoSubmissionId = submissionId;
		vetoSubmissionTitle = submissionTitle;
		vetoFromCinema = true;
		vetoFromTV = true;
		vetoReason = '';
		vetoError = '';
		vetoDialogOpen = true;
	}

	function closeVetoDialog() {
		vetoDialogOpen = false;
		vetoSubmissionId = '';
		vetoSubmissionTitle = '';
		vetoReason = '';
		vetoError = '';
	}

	async function submitVeto() {
		if (!vetoFromCinema && !vetoFromTV) {
			vetoError = 'Must veto from at least cinema or TV';
			return;
		}

		if (!vetoReason || vetoReason.trim().length < 5) {
			vetoError = 'Reason must be at least 5 characters';
			return;
		}

		vetoLoading = true;
		vetoError = '';

		try {
			const response = await fetch('/api/veto', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					submissionId: vetoSubmissionId,
					reason: vetoReason,
					vetoedFromCinema: vetoFromCinema,
					vetoedFromTV: vetoFromTV
				})
			});

			if (!response.ok) {
				const data = await response.json();
				vetoError = data.error || 'Failed to veto submission';
				vetoLoading = false;
				return;
			}

			// Success - close dialog and refresh data
			closeVetoDialog();
			await invalidateAll();
		} catch (error) {
			vetoError = 'Failed to veto submission';
			vetoLoading = false;
		}
	}
</script>

<svelte:window onclick={() => closeDropdown()} />

<div class="space-y-8">
	<!-- Stats Section (Moved to top) -->
	<section class="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
		<StatCard label="Unique Films" value={stats.totalHighlights} />

		<StatCard label="Total Highlights" value={stats.totalVideos} />

		<StatCard label="Total Length">
			<p class="text-lg font-semibold">
				{stats.totalHours}h {stats.totalMins}m
			</p>
		</StatCard>

		<StatCard label="Active Curators" value={stats.totalCurators} />

		<StatCard label="Avg Selections">
			<p class="text-lg font-semibold">{stats.averageHighlightsPerVideo}</p>
			<p class="text-xs text-gallery-500 mt-1">per video</p>
		</StatCard>

		<StatCard label="Most Popular">
			{#if stats.mostHighlighted}
				<p
					class="text-sm font-medium truncate"
					title={stats.mostHighlighted.submission.englishTitle}
				>
					{stats.mostHighlighted.submission.englishTitle}
				</p>
				<p class="text-xs text-gallery-500 mt-1">
					{stats.mostHighlighted.curators.length} curator{stats.mostHighlighted.curators.length > 1
						? 's'
						: ''}
				</p>
			{:else}
				<p class="text-sm text-gallery-400">N/A</p>
			{/if}
		</StatCard>
	</section>

	<!-- Header (Title & Sorting) -->
	<header class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
		<div>
			<h1 class="text-3xl font-bold mb-1">Highlights</h1>
			<p class="text-gallery-600 text-sm">Curator selections from the latest batch</p>
		</div>

		<div class="flex flex-col md:items-end gap-3">
			<!-- Display Toggle -->
			<div
				class="flex items-center gap-1 bg-gallery-100 p-1 rounded-lg border border-gallery-200 w-fit"
			>
				<button
					onclick={() => (viewMode = 'card')}
					class="p-1.5 rounded-md transition-all {viewMode === 'card'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
					aria-label="Grid View"
				>
					<LayoutGrid size={16} />
				</button>
				<button
					onclick={() => (viewMode = 'inline')}
					class="p-1.5 rounded-md transition-all {viewMode === 'inline'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
					aria-label="List View"
				>
					<List size={16} />
				</button>
			</div>

			<!-- Sorting Controls -->
			<div class="flex items-center gap-2 bg-gallery-50 p-1 rounded-lg border border-gallery-100">
				<span class="text-[10px] uppercase font-bold text-gallery-400 px-2">Sort by:</span>
				<button
					onclick={() => toggleSort('popular')}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {sortKey === 'popular'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
				>
					Popular {sortKey === 'popular' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</button>
				<button
					onclick={() => toggleSort('score')}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {sortKey === 'score'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
				>
					Score {sortKey === 'score' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</button>
				<button
					onclick={() => toggleSort('length')}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {sortKey === 'length'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
				>
					Length {sortKey === 'length' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</button>
				<button
					onclick={() => toggleSort('title')}
					class="px-3 py-1.5 text-xs font-medium rounded-md transition-all {sortKey === 'title'
						? 'bg-white shadow-sm text-gallery-900'
						: 'text-gallery-500 hover:text-gallery-700'}"
				>
					A-Z {sortKey === 'title' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
				</button>
			</div>
		</div>
	</header>

	<!-- Tag Filter -->
	{#if allTags.length > 0}
		<section class="flex flex-wrap items-center gap-2">
			<!-- Selected tags as removable chips -->
			{#each selectedTags as tag}
				<button
					onclick={() => toggleTag(tag)}
					class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-gallery-900 text-white hover:bg-gallery-800 transition-colors"
				>
					{tag}
					<span class="opacity-60">×</span>
				</button>
			{/each}

			<!-- Dropdown trigger -->
			<div class="relative">
				<button
					onclick={(e) => {
						e.stopPropagation();
						tagDropdownOpen = !tagDropdownOpen;
					}}
					class="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-gallery-200 bg-white text-gallery-600 hover:border-gallery-300 transition-all flex items-center gap-1.5"
				>
					<span>+ Add tag filter</span>
				</button>

				<!-- Dropdown panel -->
				{#if tagDropdownOpen}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						onclick={(e) => e.stopPropagation()}
						onkeydown={() => {}}
						class="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gallery-200 z-50 overflow-hidden"
					>
						<!-- Search input -->
						<div class="p-2 border-b border-gallery-100">
							<input
								type="text"
								placeholder="Search tags..."
								bind:value={tagSearchQuery}
								class="w-full px-2.5 py-1.5 text-sm border border-gallery-200 rounded-md focus:outline-none focus:border-gallery-400"
							/>
						</div>

						<!-- Tag list -->
						<div class="max-h-48 overflow-y-auto p-1">
							{#each searchFilteredTags as tag}
								<button
									onclick={() => toggleTag(tag.label)}
									class="w-full flex items-center justify-between px-2.5 py-1.5 text-sm rounded-md hover:bg-gallery-50 transition-colors {selectedTags.includes(
										tag.label
									)
										? 'bg-gallery-100'
										: ''}"
								>
									<span class="flex items-center gap-2">
										<span
											class="w-4 h-4 rounded border flex items-center justify-center text-white text-[10px] {selectedTags.includes(
												tag.label
											)
												? 'bg-gallery-900 border-gallery-900'
												: 'border-gallery-300'}"
										>
											{#if selectedTags.includes(tag.label)}✓{/if}
										</span>
										{tag.label}
									</span>
									<span class="text-xs text-gallery-400">{tag.count}</span>
								</button>
							{/each}
							{#if searchFilteredTags.length === 0}
								<p class="text-xs text-gallery-400 text-center py-3">No tags found</p>
							{/if}
						</div>

						<!-- Footer -->
						{#if selectedTags.length > 0}
							<div class="p-2 border-t border-gallery-100">
								<button
									onclick={() => (selectedTags = [])}
									class="w-full text-xs text-gallery-500 hover:text-gallery-700"
								>
									Clear all
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Results count when filtering -->
			{#if selectedTags.length > 0}
				<span class="text-xs text-gallery-500">
					{filteredHighlights.length} result{filteredHighlights.length !== 1 ? 's' : ''}
				</span>
			{/if}
		</section>
	{/if}

	<!-- Highlights Grid -->
	<section class="space-y-6">
		{#if sortedHighlights.length === 0}
			<div class="rounded-lg bg-gallery-50 p-12 text-center">
				<p class="text-gallery-500">
					{#if selectedTags.length > 0}
						No highlights match the selected tags.
					{:else}
						No highlights yet. Curators will select their favorites soon!
					{/if}
				</p>
			</div>
		{:else if viewMode === 'card'}
			<!-- Card Mode -->
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each sortedHighlights as { submission, curators, avgRating, uniqueTags }}
					<div class="relative flex flex-col rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
						<!-- Veto Button (Admin Only) -->
						{#if isAdmin}
							<button
								onclick={(e) => openVetoDialog(submission._id, submission.englishTitle, e)}
								class="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-50 border border-red-200 hover:bg-red-100 transition-colors shadow-sm"
								title="Veto this submission"
							>
								<BanIcon size={16} class="text-red-600" />
							</button>
						{/if}

						<a
							href={`/review/${submission._id}`}
							class="flex flex-col flex-1"
						>
							<!-- Poster/Screenshot -->
							{#if submission.poster?.asset}
								<div class="relative aspect-video bg-gallery-100 overflow-hidden">
									<img
										src={`${submission.poster.asset.url}?w=600&h=400&fit=crop`}
										alt={submission.englishTitle}
										class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div
										class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"
									></div>
								</div>
						{:else if submission.screenshots?.[0]?.asset}
							<div class="relative aspect-video bg-gallery-100 overflow-hidden">
								<img
									src={`${submission.screenshots[0].asset.url}?w=600&h=400&fit=crop`}
									alt={submission.englishTitle}
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
								/>
								<div
									class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"
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
									<h3
										class="font-bold text-lg leading-tight text-gallery-900 group-hover:text-black truncate"
									>
										{submission.englishTitle}
									</h3>
									<p class="text-sm text-gallery-600 font-medium mt-1">
										{submission.directorName}
										{#if submission.length}
											<span class="text-gallery-300 mx-1.5">•</span>
											<span>{submission.length} min</span>
										{/if}
									</p>
								</div>

								<!-- Grade, Approval, Rating Integrated -->
								<div class="flex flex-col items-end gap-1">
									<div class="flex items-center gap-1.5 text-right">
										{#if submission.score !== undefined}
											<span class="text-xl font-black text-gallery-900 leading-none tracking-tight">
												{submission.score.toFixed(0)}%
											</span>
										{/if}
										{#if avgRating}
											<span
												class="text-xs font-bold text-gallery-400 border-l border-gallery-200 pl-1.5 ml-0.5"
											>
												{avgRating.toFixed(1)}
											</span>
										{/if}
									</div>
									<VoteBreakdown reviews={submission.reviews || []} compact={true} />
								</div>
							</div>

							<!-- Curation Info Disclosure (Icon based) -->
							<div
								class="mt-auto pt-3 border-t border-gallery-100 flex items-center justify-between"
							>
								<div class="relative group/disclosure">
									<!-- Trigger Icon -->
									<div
										class="flex items-center gap-1.5 cursor-help bg-gallery-50 px-2 py-1 rounded-full border border-gallery-100 hover:bg-gallery-100 transition-colors"
									>
										<span class="text-xs" style="color: var(--color-highlight-500)">★</span>
										<span class="text-[10px] font-black text-gallery-600 uppercase tracking-widest"
											>{curators.length}</span
										>
									</div>

									<!-- Disclosure Popover -->
									<div
										class="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gallery-200 p-4 opacity-0 pointer-events-none group-hover/disclosure:opacity-100 group-hover/disclosure:pointer-events-auto transition-all z-50 transform translate-y-2 group-hover/disclosure:translate-y-0"
									>
										<div class="space-y-4">
											<!-- Flags -->
											{#if submission.flags && submission.flags.length > 0}
												<div class="space-y-1.5">
													<p
														class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest"
													>
														Flags
													</p>
													<div class="flex flex-wrap gap-1.5">
														{#each submission.flags as flag}
															<FlagBadge {flag} />
														{/each}
													</div>
												</div>
											{/if}

											<!-- Tags -->
											{#if uniqueTags && uniqueTags.length > 0}
												<div class="space-y-1.5">
													<p
														class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest"
													>
														Tags
													</p>
													<div class="flex flex-wrap gap-1">
														{#each uniqueTags as tag}
															<span
																class="px-2 py-0.5 text-[10px] font-bold uppercase bg-gallery-50 text-gallery-500 rounded-full border border-gallery-100/50"
															>
																{tag.label}
															</span>
														{/each}
													</div>
												</div>
											{/if}

											<!-- Curators -->
											<div class="space-y-1.5">
												<p class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest">
													Curators
												</p>
												<div class="flex flex-wrap gap-1">
													{#each curators as curator}
														<span
															class="text-[9px] font-bold text-gallery-700 px-2 py-0.5 rounded-full border"
															style="background-color: var(--color-highlight-100); border-color: var(--color-highlight-200); color: var(--color-highlight-900)"
														>
															{curator.name}
														</span>
													{/each}
												</div>
											</div>
										</div>
									</div>
								</div>

								<span
									class="text-xs font-bold text-gallery-400 group-hover:text-black transition-colors"
								>
									Details →
								</span>
							</div>
						</div>
					</a>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Inline Mode (List) -->
			<div class="space-y-2">
				{#each sortedHighlights as { submission, curators, avgRating, uniqueTags }}
					<div class="relative">
						<!-- Veto Button (Admin Only) -->
						{#if isAdmin}
							<button
								onclick={(e) => openVetoDialog(submission._id, submission.englishTitle, e)}
								class="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-50 border border-red-200 hover:bg-red-100 transition-colors shadow-sm"
								title="Veto this submission"
							>
								<BanIcon size={16} class="text-red-600" />
							</button>
						{/if}

						<a
							href={`/review/${submission._id}`}
							class="flex items-center gap-4 bg-white p-3 rounded-lg border border-gallery-100 hover:border-gallery-300 hover:shadow-md transition-all group"
						>
						<!-- Thumbnail -->
						<div class="h-12 w-20 rounded bg-gallery-100 flex-shrink-0 overflow-hidden">
							{#if submission.poster?.asset}
								<img
									src={`${submission.poster.asset.url}?w=200&h=120&fit=crop`}
									class="h-full w-full object-cover"
									alt=""
								/>
							{:else if submission.screenshots?.[0]?.asset}
								<img
									src={`${submission.screenshots[0].asset.url}?w=200&h=120&fit=crop`}
									class="h-full w-full object-cover"
									alt=""
								/>
							{:else}
								<div class="h-full w-full flex items-center justify-center text-xs">🎬</div>
							{/if}
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<h4 class="font-bold text-gallery-900 group-hover:text-black truncate">
								{submission.englishTitle}
							</h4>
							<p class="text-[11px] text-gallery-500">
								{submission.directorName}
							</p>
						</div>

						<!-- Duration -->
						<div class="w-16 text-center">
							<span class="text-xs font-medium text-gallery-500">{submission.length}m</span>
						</div>

						<!-- Curation Info Disclosure (Inline) -->
						<div class="w-[80px] flex justify-end">
							<div class="relative group/disclosure">
								<!-- Trigger Icon -->
								<div
									class="flex items-center gap-1 cursor-help px-2 py-1 rounded-md hover:bg-gallery-50 transition-colors"
								>
									<span class="text-lg" style="color: var(--color-highlight-500)">★</span>
									<span class="text-xs font-bold text-gallery-500">{curators.length}</span>
								</div>

								<!-- Disclosure Popover -->
								<div
									class="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gallery-200 p-4 opacity-0 pointer-events-none group-hover/disclosure:opacity-100 group-hover/disclosure:pointer-events-auto transition-all z-50 transform translate-y-2 group-hover/disclosure:translate-y-0 text-left"
								>
									<div class="space-y-4">
										<!-- Flags -->
										{#if submission.flags && submission.flags.length > 0}
											<div class="space-y-1.5">
												<p class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest">
													Flags
												</p>
												<div class="flex flex-wrap gap-1.5">
													{#each submission.flags as flag}
														<FlagBadge {flag} />
													{/each}
												</div>
											</div>
										{/if}

										<!-- Tags -->
										{#if uniqueTags && uniqueTags.length > 0}
											<div class="space-y-1.5">
												<p class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest">
													Tags
												</p>
												<div class="flex flex-wrap gap-1">
													{#each uniqueTags as tag}
														<span
															class="px-2 py-0.5 text-[10px] font-bold uppercase bg-gallery-50 text-gallery-500 rounded-full border border-gallery-100/50"
														>
															{tag.label}
														</span>
													{/each}
												</div>
											</div>
										{/if}

										<!-- Curators -->
										<div class="space-y-1.5">
											<p class="text-[9px] font-bold text-gallery-400 uppercase tracking-widest">
												Curators
											</p>
											<div class="flex flex-wrap gap-1">
												{#each curators as curator}
													<span
														class="text-[9px] font-bold text-gallery-700 px-2 py-0.5 rounded-full border"
														style="background-color: var(--color-highlight-100); border-color: var(--color-highlight-200); color: var(--color-highlight-900)"
													>
														{curator.name}
													</span>
												{/each}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</a>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<!-- Veto Dialog -->
{#if vetoDialogOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50" onclick={closeVetoDialog}></div>

		<!-- Dialog -->
		<div class="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
			<h2 class="text-xl font-bold mb-1">Veto Submission</h2>
			<p class="text-sm text-gallery-600 mb-4">{vetoSubmissionTitle}</p>

			<!-- Veto Contexts -->
			<div class="mb-4">
				<p class="text-sm font-medium mb-2">Select contexts to veto from:</p>
				<div class="space-y-2">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={vetoFromCinema}
							class="w-4 h-4 rounded border-gallery-300"
						/>
						<span class="text-sm">Cinema Screenings</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={vetoFromTV}
							class="w-4 h-4 rounded border-gallery-300"
						/>
						<span class="text-sm">TV Display</span>
					</label>
				</div>
			</div>

			<!-- Reason -->
			<div class="mb-4">
				<label class="block text-sm font-medium mb-2">Reason (required)</label>
				<textarea
					bind:value={vetoReason}
					class="w-full px-3 py-2 border border-gallery-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gallery-900 resize-none"
					rows="3"
					placeholder="Why is this submission being vetoed?"
				></textarea>
			</div>

			<!-- Error Message -->
			{#if vetoError}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p class="text-sm text-red-600">{vetoError}</p>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex gap-3 justify-end">
				<button
					onclick={closeVetoDialog}
					class="px-4 py-2 text-sm font-medium text-gallery-700 hover:text-gallery-900 transition-colors"
					disabled={vetoLoading}
				>
					Cancel
				</button>
				<button
					onclick={submitVeto}
					class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={vetoLoading}
				>
					{vetoLoading ? 'Vetoing...' : 'Confirm Veto'}
				</button>
			</div>
		</div>
	</div>
{/if}
