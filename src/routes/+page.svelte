<script lang="ts">
	import {
		StatCard,
		Table,
		TableHead,
		TableBody,
		TableRow,
		Button,
		ColumnToggle,
		FiltersPanel,
		FlagBadge
	} from '$lib/components/ui';
	import VoteBreakdown from '$lib/components/selection/VoteBreakdown.svelte';
	import SelectionStatsDisplay from '$lib/components/selection/SelectionStats.svelte';
	import SettingsPanel from '$lib/components/selection/SettingsPanel.svelte';
	import { scoreMoviesSimple } from '$lib/utils/scoring';
	import type { SelectionStats } from '$lib/utils/types';

	let { data } = $props();

	// Curator stats
	let stats = $derived(data.curatorStats);
	let curator = $derived(stats.curator);
	let total = $derived(stats.totalReviews ?? 0);
	let approved = $derived(stats.approvedReviews ?? 0);
	let approvalRate = $derived(total > 0 ? Math.round((approved / total) * 100) : 0);

	// Settings from Sanity (modifiable locally for testing)
	let settings = $state({
		selectedThreshold: data.settings.selectedThreshold,
		maybeThreshold: data.settings.maybeThreshold
	});

	// Simple scoring without volume/bias weights
	let scoredSubmissions = $derived(scoreMoviesSimple(data.submissions));

	// Highlight map from data
	let highlightMap = $derived(data.highlightMap as Record<string, string[]>);

	// Sorting
	type SortKey =
		| 'englishTitle'
		| 'directorName'
		| 'filmLanguage'
		| 'categories'
		| 'length'
		| '_createdAt'
		| 'reviewsCount'
		| 'score'
		| 'highlighted';
	type SortDir = 'asc' | 'desc';

	let sortKey = $state<SortKey>('_createdAt');
	let sortDir = $state<SortDir>('desc');

	// Column visibility - highlight is now ON by default
	const columnDefinitions = [
		{ key: 'highlight', label: '★', default: true },
		{ key: 'title', label: 'Title', default: true },
		{ key: 'director', label: 'Director', default: false },
		{ key: 'language', label: 'Language', default: false },
		{ key: 'categories', label: 'Categories', default: false },
		{ key: 'length', label: 'Length', default: true },
		{ key: 'uploaded', label: 'Uploaded', default: false },
		{ key: 'reviewedBy', label: 'Reviewed By', default: true },
		{ key: 'votes', label: 'Votes', default: true },
		{ key: 'score', label: 'Score', default: true },
		{ key: 'flags', label: 'Flags', default: false }
	];

	let visibleColumns = $state(new Set(columnDefinitions.filter((c) => c.default).map((c) => c.key)));

	// Filters
	type FilterState = {
		reviewStatus: 'all' | 'reviewed' | 'not-reviewed';
		selectionStatus: 'all' | 'selected' | 'maybe' | 'rejected' | 'no-reviews';
		hasFlags: 'all' | 'yes' | 'no';
		languages: Set<string>;
		categories: Set<string>;
	};

	let filters = $state<FilterState>({
		reviewStatus: 'all',
		selectionStatus: 'all',
		hasFlags: 'all',
		languages: new Set(),
		categories: new Set()
	});

	// Extract available filter options
	let availableLanguages = $derived(
		[...new Set(data.submissions.map((s: any) => s.filmLanguage).filter(Boolean))].sort() as string[]
	);

	let availableCategories = $derived(
		[...new Set(data.submissions.flatMap((s: any) => s.categories || []))].sort() as string[]
	);

	// Calculate watched time
	let totalMinutes = $derived(
		scoredSubmissions.reduce((sum: number, s: any) => {
			const hasReviewed = s.reviews?.some((r: any) => r.curatorId === curator?._id);
			return hasReviewed ? sum + (Number(s.length) || 0) : sum;
		}, 0)
	);

	let hours = $derived(Math.floor(totalMinutes / 60));
	let mins = $derived(totalMinutes % 60);
	let timeDisplay = $derived(hours > 0 ? `${hours}h ${mins}min` : `${mins}min`);

	// Process, filter, and sort submissions
	let submissions = $derived.by(() => {
		const mapped = scoredSubmissions.map((s: any) => {
			const myReview = s.reviews?.find((r: any) => r.curatorId === curator?._id);
			const highlightedBy = highlightMap[s._id] || [];
			return {
				...s,
				mySelection: myReview?.selection ?? 'Pending',
				hasReviewed: !!myReview,
				highlightedBy,
				isHighlighted: highlightedBy.length > 0
			};
		});

		// Apply filters
		let filtered = mapped.filter((s: any) => {
			// Review status filter
			if (filters.reviewStatus === 'reviewed' && !s.hasReviewed) return false;
			if (filters.reviewStatus === 'not-reviewed' && s.hasReviewed) return false;

			// Selection status filter using dynamic thresholds
			const score = s.score || 0;
			const hasReviews = (s.reviewsCount || 0) > 0;
			if (filters.selectionStatus === 'selected' && score < settings.selectedThreshold) return false;
			if (filters.selectionStatus === 'maybe' && (score < settings.maybeThreshold || score >= settings.selectedThreshold)) return false;
			if (filters.selectionStatus === 'rejected' && (score >= settings.maybeThreshold || !hasReviews)) return false;
			if (filters.selectionStatus === 'no-reviews' && hasReviews) return false;

			// Flags filter
			const hasFlags = (s.flags?.length || 0) > 0;
			if (filters.hasFlags === 'yes' && !hasFlags) return false;
			if (filters.hasFlags === 'no' && hasFlags) return false;

			// Language filter
			if (filters.languages.size > 0 && !filters.languages.has(s.filmLanguage)) return false;

			// Categories filter
			if (filters.categories.size > 0) {
				const movieCategories = s.categories || [];
				const hasMatchingCategory = movieCategories.some((c: string) => filters.categories.has(c));
				if (!hasMatchingCategory) return false;
			}

			return true;
		});

		// Sort
		return [...filtered].sort((a: any, b: any) => {
			let av: any;
			let bv: any;

			if (sortKey === 'categories') {
				av = (a.categories ?? []).join(', ');
				bv = (b.categories ?? []).join(', ');
			} else if (sortKey === 'highlighted') {
				av = a.highlightedBy.length;
				bv = b.highlightedBy.length;
			} else {
				av = a[sortKey];
				bv = b[sortKey];
			}

			if (av == null && bv == null) return 0;
			if (av == null) return sortDir === 'asc' ? -1 : 1;
			if (bv == null) return sortDir === 'asc' ? 1 : -1;

			if (sortKey === '_createdAt') {
				av = new Date(av).getTime();
				bv = new Date(bv).getTime();
			}

			if (typeof av === 'string') av = av.toLowerCase();
			if (typeof bv === 'string') bv = bv.toLowerCase();

			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});
	});

	// Selection stats with dynamic thresholds
	let selectionStats: SelectionStats = $derived.by(() => {
		let selected = 0;
		let maybe = 0;
		let rejected = 0;
		let selectedTime = 0;
		let maybeTime = 0;
		let rejectedTime = 0;
		let totalTime = 0;

		scoredSubmissions.forEach((m: any) => {
			const len = m.length || 0;
			totalTime += len;
			const score = m.score || 0;
			const hasReviews = (m.reviewsCount || 0) > 0;

			if (!hasReviews) return;

			if (score >= settings.selectedThreshold) {
				selected++;
				selectedTime += len;
			} else if (score >= settings.maybeThreshold) {
				maybe++;
				maybeTime += len;
			} else {
				rejected++;
				rejectedTime += len;
			}
		});

		const formatTime = (mins: number) => {
			const h = Math.floor(mins / 60);
			const m = mins % 60;
			if (h === 0 && m === 0) return '0m';
			return h > 0 ? `${h}h ${m}m` : `${m}m`;
		};

		return {
			total: scoredSubmissions.length,
			totalTime: formatTime(totalTime),
			selected,
			maybe,
			rejected,
			selectedTime: formatTime(selectedTime),
			maybeTime: formatTime(maybeTime),
			rejectedTime: formatTime(rejectedTime)
		};
	});

	function setSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = ['englishTitle', 'directorName', 'filmLanguage', 'categories'].includes(key)
				? 'asc'
				: 'desc';
		}
	}
</script>

<!-- Page Header -->
<header class="page-header">
	<div class="header-content">
		<h1 class="page-title">Curation Dashboard</h1>
		<a href="/my-reviews" class="my-reviews-link">
			My Reviews & Highlights
			<span class="arrow">→</span>
		</a>
	</div>
</header>

<!-- Curator Stats -->
<section class="stats-grid">
	<StatCard label="Curator" value={curator?.name} />
	<StatCard label="Reviews" value={total} />
	<StatCard label="Approved · Rate">
		<p class="text-lg font-semibold">
			{approved} <span class="text-sm text-gallery-500">({approvalRate}%)</span>
		</p>
	</StatCard>
	<StatCard label="Total Watched" value={timeDisplay} />
</section>

<!-- All Submissions table -->
<section class="submissions-section">
	<header class="section-header">
		<div class="section-title-row">
			<h2 class="section-title">All Submissions</h2>
			<span class="submission-count">
				Showing {submissions.length} of {scoredSubmissions.length}
			</span>
		</div>

		<div class="controls-row">
			<div class="left-controls">
				<SelectionStatsDisplay stats={selectionStats} />
			</div>
			<div class="right-controls">
				<SettingsPanel bind:settings isAdmin={data.isAdmin} />
			</div>
		</div>

		<div class="filters-row">
			<FiltersPanel bind:filters {availableLanguages} {availableCategories} />
			<ColumnToggle columns={columnDefinitions} bind:visibleColumns />
		</div>
	</header>

	<div class="table-container">
		<Table>
			<TableHead>
				<tr>
					{#if visibleColumns.has('highlight')}
						<th class="th-highlight" onclick={() => setSort('highlighted')}>
							<span class="highlight-header-icon">★</span>
							{sortKey === 'highlighted' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
						</th>
					{/if}
					{#if visibleColumns.has('title')}
						<th class="cursor-pointer py-3 px-4" onclick={() => setSort('englishTitle')}>
							Title {sortKey === 'englishTitle' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
						</th>
					{/if}
					{#if visibleColumns.has('director')}
						<th class="cursor-pointer py-3 px-4" onclick={() => setSort('directorName')}>
							Director {sortKey === 'directorName' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
						</th>
					{/if}
					{#if visibleColumns.has('language')}
						<th class="cursor-pointer py-3 px-4" onclick={() => setSort('filmLanguage')}>
							Language {sortKey === 'filmLanguage' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
						</th>
					{/if}
					{#if visibleColumns.has('categories')}
						<th class="cursor-pointer py-3 px-4" onclick={() => setSort('categories')}>
							Categories {sortKey === 'categories' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
						</th>
					{/if}
					{#if visibleColumns.has('length')}
						<th class="cursor-pointer py-3 px-4" onclick={() => setSort('length')}>
							Length {sortKey === 'length' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
						</th>
					{/if}
					{#if visibleColumns.has('uploaded')}
						<th class="cursor-pointer py-3 px-4" onclick={() => setSort('_createdAt')}>
							Uploaded {sortKey === '_createdAt' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
						</th>
					{/if}
					{#if visibleColumns.has('reviewedBy')}
						<th class="cursor-pointer py-3 px-4" onclick={() => setSort('reviewsCount')}>
							Reviewed by {sortKey === 'reviewsCount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
						</th>
					{/if}
					{#if visibleColumns.has('votes')}
						<th class="py-3 px-4">Votes</th>
					{/if}
					{#if visibleColumns.has('score')}
						<th class="cursor-pointer py-3 px-4" onclick={() => setSort('score')}>
							Score {sortKey === 'score' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
						</th>
					{/if}
					{#if visibleColumns.has('flags')}
						<th class="py-3 px-4">Flags</th>
					{/if}
					<th class="py-3 px-4 text-center">Review</th>
				</tr>
			</TableHead>

			<TableBody>
				{#each submissions as s (s._id)}
					{@const score = s.score || 0}
					{@const hasReviews = (s.reviewsCount || 0) > 0}
					<TableRow
						class="{s.hasReviewed ? 'opacity-60' : ''} {s.isHighlighted
							? 'highlight-row'
							: hasReviews && score >= settings.selectedThreshold
								? 'bg-green-50'
								: hasReviews && score >= settings.maybeThreshold
									? 'bg-amber-50'
									: hasReviews
										? 'bg-red-50'
										: ''}"
					>
						{#if visibleColumns.has('highlight')}
							<td class="py-3 px-2 text-center">
								{#if s.isHighlighted}
									<span
										class="highlight-indicator"
										title="Highlighted by: {s.highlightedBy.join(', ')}"
									>
										★
									</span>
								{:else}
									<span class="text-gallery-200">-</span>
								{/if}
							</td>
						{/if}
						{#if visibleColumns.has('title')}
							<td class="py-3 px-4 truncate-cell font-medium" title={s.englishTitle}>
								{s.englishTitle}
							</td>
						{/if}
						{#if visibleColumns.has('director')}
							<td class="py-3 px-4 truncate-cell text-gray-600" title={s.directorName}>
								{s.directorName || '-'}
							</td>
						{/if}
						{#if visibleColumns.has('language')}
							<td class="py-3 px-4 truncate-cell" title={s.filmLanguage}>{s.filmLanguage}</td>
						{/if}
						{#if visibleColumns.has('categories')}
							<td
								class="py-3 px-4 truncate-cell"
								title={s.categories?.join(', ') +
									(s.categories?.includes('other') && s.categoryOther
										? `, ${s.categoryOther}`
										: '')}
							>
								{s.categories?.join(', ') +
									(s.categories?.includes('other') && s.categoryOther
										? `, ${s.categoryOther}`
										: '')}
							</td>
						{/if}
						{#if visibleColumns.has('length')}
							<td class="py-3 px-4" title={s.length}>{s.length} min</td>
						{/if}
						{#if visibleColumns.has('uploaded')}
							<td
								class="py-3 px-4 text-xs text-gallery-500 truncate-cell"
								title={new Date(s._createdAt).toLocaleString()}
							>
								{new Date(s._createdAt).toLocaleDateString()}
							</td>
						{/if}
						{#if visibleColumns.has('reviewedBy')}
							<td
								class="py-3 px-4 truncate-cell"
								title={s.reviews?.map((r: any) => r.curatorName).join(', ') || 'No reviews yet'}
							>
								{#if s.reviews?.length}
									<span class="inline-flex items-center gap-2">
										<span
											class="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-gallery-100 text-gallery-700 rounded-full"
										>
											{s.reviews.length}
										</span>
										<span class="text-gallery-600">
											{s.reviews.map((r: any) => r.curatorName).join(', ')}
										</span>
									</span>
								{:else}
									<span class="text-gallery-400">No reviews yet</span>
								{/if}
							</td>
						{/if}
						{#if visibleColumns.has('votes')}
							<td class="py-3 px-4">
								<VoteBreakdown reviews={s.reviews || []} compact />
							</td>
						{/if}
						{#if visibleColumns.has('score')}
							<td class="py-3 px-4">
								{#if hasReviews}
									<div class="flex items-center gap-2">
										<span class="text-sm font-bold w-10 text-right">{score.toFixed(0)}%</span>
										<div class="h-2 w-12 bg-gray-200 rounded-full overflow-hidden">
											<div
												class="h-full {score >= settings.selectedThreshold
													? 'bg-green-500'
													: score >= settings.maybeThreshold
														? 'bg-amber-400'
														: 'bg-red-400'}"
												style="width: {score}%"
											></div>
										</div>
									</div>
								{:else}
									<span class="text-xs text-gray-300">-</span>
								{/if}
							</td>
						{/if}
						{#if visibleColumns.has('flags')}
							<td class="py-3 px-4">
								{#if s.flags && s.flags.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each s.flags as flag}
											<FlagBadge {flag} />
										{/each}
									</div>
								{:else}
									<span class="text-xs text-gray-300">-</span>
								{/if}
							</td>
						{/if}
						<td class="py-3 px-4 text-center">
							<Button variant="secondary" size="sm">
								<a href={`/review/${s._id}`} class="no-underline">Review</a>
							</Button>
						</td>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>

	{#if submissions.length === 0}
		<div class="empty-state">No submissions match the selected filters.</div>
	{/if}
</section>

<style>
	.page-header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-gallery-900);
		margin: 0;
	}

	.my-reviews-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-gallery-700);
		background: white;
		border: 1px solid var(--color-gallery-200);
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.my-reviews-link:hover {
		background: var(--color-gallery-50);
		border-color: var(--color-gallery-300);
	}

	.my-reviews-link .arrow {
		transition: transform 0.15s ease;
	}

	.my-reviews-link:hover .arrow {
		transform: translateX(3px);
	}

	.stats-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(4, 1fr);
		margin-bottom: 2rem;
	}

	.submissions-section {
		background: white;
		border: 1px solid var(--color-gallery-200);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.section-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.section-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--color-gallery-800);
		margin: 0;
	}

	.submission-count {
		font-size: 0.875rem;
		color: var(--color-gallery-500);
	}

	.controls-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.left-controls, .right-controls {
		flex: 1;
		min-width: 280px;
	}

	.filters-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.table-container {
		overflow-x: auto;
		margin: 0 -1.5rem;
		padding: 0 1.5rem;
	}

	.th-highlight {
		width: 48px;
		cursor: pointer;
		padding: 0.75rem 0.5rem;
		text-align: center;
	}

	.highlight-header-icon {
		color: var(--color-highlight-500);
		font-size: 0.875rem;
	}

	.truncate-cell {
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--color-gallery-500);
		background: var(--color-gallery-50);
		border-radius: 8px;
		margin-top: 1rem;
	}

	@media (max-width: 1024px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.controls-row {
			flex-direction: column;
		}

		.left-controls, .right-controls {
			width: 100%;
		}
	}

	@media (max-width: 640px) {
		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
