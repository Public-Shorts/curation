<script lang="ts">
	import {
		Table,
		TableHead,
		TableBody,
		TableRow,
		ColumnToggle,
		FiltersPanel,
		FlagBadge
	} from '$lib/components/ui';
	import VoteBreakdown from '$lib/components/selection/VoteBreakdown.svelte';
	import SelectionStatsDisplay from '$lib/components/selection/SelectionStats.svelte';
	import ThresholdSettings from '$lib/components/selection/ThresholdSettings.svelte';
	import { scoreMovies } from '$lib/utils/scoring';
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

	// Weighted scoring with volume/bias correction (canonical festival selection scoring)
	let scoredSubmissions = $derived(scoreMovies(data.submissions, data.curatorWeights));

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

	let sortKey = $state<SortKey>('score');
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

	let visibleColumns = $state(
		new Set(columnDefinitions.filter((c) => c.default).map((c) => c.key))
	);

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
		[
			...new Set(data.submissions.map((s: any) => s.filmLanguage).filter(Boolean))
		].sort() as string[]
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
	let timeDisplay = $derived(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);

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
			if (filters.selectionStatus === 'selected' && score < settings.selectedThreshold)
				return false;
			if (
				filters.selectionStatus === 'maybe' &&
				(score < settings.maybeThreshold || score >= settings.selectedThreshold)
			)
				return false;
			if (
				filters.selectionStatus === 'rejected' &&
				(score >= settings.maybeThreshold || !hasReviews)
			)
				return false;
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

	// Count highlighted submissions
	let highlightedCount = $derived(
		Object.values(highlightMap).filter((curators) => curators.length > 0).length
	);

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
			rejectedTime: formatTime(rejectedTime),
			highlighted: highlightedCount
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

	let showSettings = $state(false);
</script>

<div class="container mx-auto max-w-7xl px-6 py-6">
	<!-- Minimal Header -->
	<header class="header">
		<div class="header-top">
			<h1>Curation</h1>
			<a href="/my-reviews" class="link-subtle">My Reviews →</a>
		</div>
		<div class="header-meta">
			<span>{curator?.name}</span>
			<span class="sep"></span>
			<span>{total} reviews</span>
			<span class="sep"></span>
			<span>{approvalRate}% approved</span>
			<span class="sep"></span>
			<span>{timeDisplay} watched</span>
		</div>
	</header>

	<!-- Selection Overview -->
	<section class="selection-bar">
		<SelectionStatsDisplay stats={selectionStats} />
		<div class="selection-bar-actions">
			<button class="btn-ghost" onclick={() => (showSettings = !showSettings)}>
				{showSettings ? 'Hide' : 'Thresholds'}
			</button>
		</div>
	</section>

	{#if showSettings}
		<div class="settings-wrap">
			<ThresholdSettings bind:settings isAdmin={data.isAdmin} />
		</div>
	{/if}

	<!-- Toolbar -->
	<div class="toolbar">
		<div class="toolbar-left">
			<FiltersPanel bind:filters {availableLanguages} {availableCategories} />
		</div>
		<div class="toolbar-right">
			<span class="count-label">{submissions.length}/{scoredSubmissions.length}</span>
			<ColumnToggle columns={columnDefinitions} bind:visibleColumns />
		</div>
	</div>

	<!-- Table -->
	<div class="table-wrap">
		<Table>
			<TableHead>
				<tr>
					{#if visibleColumns.has('highlight')}
						<th class="th-icon" onclick={() => setSort('highlighted')}>
							<span class="th-star">★</span>
							{#if sortKey === 'highlighted'}<span class="sort-arrow"
									>{sortDir === 'asc' ? '↑' : '↓'}</span
								>{/if}
						</th>
					{/if}
					{#if visibleColumns.has('title')}
						<th class="th-sortable" onclick={() => setSort('englishTitle')}>
							Title {#if sortKey === 'englishTitle'}<span class="sort-arrow"
									>{sortDir === 'asc' ? '↑' : '↓'}</span
								>{/if}
						</th>
					{/if}
					{#if visibleColumns.has('director')}
						<th class="th-sortable" onclick={() => setSort('directorName')}>
							Director {#if sortKey === 'directorName'}<span class="sort-arrow"
									>{sortDir === 'asc' ? '↑' : '↓'}</span
								>{/if}
						</th>
					{/if}
					{#if visibleColumns.has('language')}
						<th class="th-sortable" onclick={() => setSort('filmLanguage')}>
							Lang {#if sortKey === 'filmLanguage'}<span class="sort-arrow"
									>{sortDir === 'asc' ? '↑' : '↓'}</span
								>{/if}
						</th>
					{/if}
					{#if visibleColumns.has('categories')}
						<th class="th-sortable" onclick={() => setSort('categories')}>
							Cat {#if sortKey === 'categories'}<span class="sort-arrow"
									>{sortDir === 'asc' ? '↑' : '↓'}</span
								>{/if}
						</th>
					{/if}
					{#if visibleColumns.has('length')}
						<th class="th-sortable" onclick={() => setSort('length')}>
							Len {#if sortKey === 'length'}<span class="sort-arrow"
									>{sortDir === 'asc' ? '↑' : '↓'}</span
								>{/if}
						</th>
					{/if}
					{#if visibleColumns.has('uploaded')}
						<th class="th-sortable" onclick={() => setSort('_createdAt')}>
							Date {#if sortKey === '_createdAt'}<span class="sort-arrow"
									>{sortDir === 'asc' ? '↑' : '↓'}</span
								>{/if}
						</th>
					{/if}
					{#if visibleColumns.has('reviewedBy')}
						<th class="th-sortable" onclick={() => setSort('reviewsCount')}>
							Reviews {#if sortKey === 'reviewsCount'}<span class="sort-arrow"
									>{sortDir === 'asc' ? '↑' : '↓'}</span
								>{/if}
						</th>
					{/if}
					{#if visibleColumns.has('votes')}
						<th class="th-plain">Votes</th>
					{/if}
					{#if visibleColumns.has('score')}
						<th class="th-sortable" onclick={() => setSort('score')}>
							Score {#if sortKey === 'score'}<span class="sort-arrow"
									>{sortDir === 'asc' ? '↑' : '↓'}</span
								>{/if}
						</th>
					{/if}
					{#if visibleColumns.has('flags')}
						<th class="th-plain">Flags</th>
					{/if}
					<th class="th-plain th-center"></th>
				</tr>
			</TableHead>

			<TableBody>
				{#each submissions as s (s._id)}
					{@const score = s.score || 0}
					{@const hasReviews = (s.reviewsCount || 0) > 0}
					<TableRow
						class="{s.hasReviewed ? 'reviewed-row' : ''} {s.isHighlighted
							? 'highlight-row'
							: hasReviews && score >= settings.selectedThreshold
								? 'row-selected'
								: hasReviews && score >= settings.maybeThreshold
									? 'row-maybe'
									: hasReviews
										? 'row-rejected'
										: ''}"
					>
						{#if visibleColumns.has('highlight')}
							<td class="td-icon">
								{#if s.isHighlighted}
									<span
										class="highlight-indicator"
										title="Highlighted by: {s.highlightedBy.join(', ')}">★</span
									>
								{:else}
									<span class="td-muted">-</span>
								{/if}
							</td>
						{/if}
						{#if visibleColumns.has('title')}
							<td class="td-title" title={s.englishTitle}>
								{s.englishTitle}
							</td>
						{/if}
						{#if visibleColumns.has('director')}
							<td class="td-truncate td-secondary" title={s.directorName}>
								{s.directorName || '-'}
							</td>
						{/if}
						{#if visibleColumns.has('language')}
							<td class="td-truncate" title={s.filmLanguage}>{s.filmLanguage}</td>
						{/if}
						{#if visibleColumns.has('categories')}
							<td
								class="td-truncate"
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
							<td class="td-num">{s.length}′</td>
						{/if}
						{#if visibleColumns.has('uploaded')}
							<td class="td-date" title={new Date(s._createdAt).toLocaleString()}>
								{new Date(s._createdAt).toLocaleDateString('en-GB', {
									day: '2-digit',
									month: 'short'
								})}
							</td>
						{/if}
						{#if visibleColumns.has('reviewedBy')}
							<td
								class="td-reviews"
								title={s.reviews?.map((r: any) => r.curatorName).join(', ') || 'None'}
							>
								{#if s.reviews?.length}
									<span class="review-count">{s.reviews.length}</span>
									<span class="review-names"
										>{s.reviews.map((r: any) => r.curatorName).join(', ')}</span
									>
								{:else}
									<span class="td-muted">-</span>
								{/if}
							</td>
						{/if}
						{#if visibleColumns.has('votes')}
							<td class="td-votes">
								<VoteBreakdown reviews={(s.reviews || []).filter((r: any) => !r.isJury)} compact />
							</td>
						{/if}
						{#if visibleColumns.has('score')}
							<td class="td-score">
								{#if hasReviews}
									<span
										class="score-value"
										class:score-high={score >= settings.selectedThreshold}
										class:score-mid={score >= settings.maybeThreshold &&
											score < settings.selectedThreshold}
										class:score-low={score < settings.maybeThreshold}>{score.toFixed(0)}%</span
									>
								{:else}
									<span class="td-muted">-</span>
								{/if}
							</td>
						{/if}
						{#if visibleColumns.has('flags')}
							<td class="td-flags">
								{#if s.flags && s.flags.length > 0}
									<div class="flags-wrap">
										{#each s.flags as flag}
											<FlagBadge {flag} />
										{/each}
									</div>
								{:else}
									<span class="td-muted">-</span>
								{/if}
							</td>
						{/if}
						<td class="td-action">
							<a href={`/review/${s._id}`} class="review-link">Review</a>
						</td>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>

	{#if submissions.length === 0}
		<p class="empty">No submissions match the selected filters.</p>
	{/if}
</div>

<style>
	/* ---- Header ---- */
	.header {
		margin-bottom: 1.5rem;
	}

	.header-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.375rem;
	}

	.header-top h1 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-gallery-900);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.link-subtle {
		font-size: 0.8125rem;
		color: var(--color-gallery-400);
		text-decoration: none;
		transition: color 0.15s;
	}

	.link-subtle:hover {
		color: var(--color-gallery-700);
	}

	.header-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: var(--color-gallery-500);
	}

	.header-meta .sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--color-gallery-300);
		flex-shrink: 0;
	}

	/* ---- Selection Bar ---- */
	.selection-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		border-top: 1px solid var(--color-gallery-200);
		border-bottom: 1px solid var(--color-gallery-200);
		margin-bottom: 0.75rem;
	}

	.selection-bar-actions {
		flex-shrink: 0;
	}

	.btn-ghost {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-gallery-400);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		transition: all 0.15s;
	}

	.btn-ghost:hover {
		color: var(--color-gallery-700);
		background: var(--color-gallery-100);
	}

	.settings-wrap {
		padding: 1rem 0;
		margin-bottom: 0.5rem;
	}

	/* ---- Toolbar ---- */
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.toolbar-left {
		flex: 1;
		min-width: 0;
	}

	.toolbar-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.count-label {
		font-size: 0.75rem;
		color: var(--color-gallery-400);
		font-variant-numeric: tabular-nums;
	}

	/* ---- Table ---- */
	.table-wrap {
		overflow-x: auto;
		margin: 0 -1rem;
		padding: 0 1rem;
	}

	.th-sortable,
	.th-plain,
	.th-icon {
		padding: 0.5rem 0.75rem;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-gallery-400);
		white-space: nowrap;
	}

	.th-sortable {
		cursor: pointer;
		user-select: none;
	}

	.th-sortable:hover {
		color: var(--color-gallery-700);
	}

	.th-icon {
		width: 36px;
		text-align: center;
		cursor: pointer;
	}

	.th-center {
		text-align: center;
	}

	.th-star {
		color: var(--color-highlight-500);
		font-size: 0.75rem;
	}

	.sort-arrow {
		font-size: 0.625rem;
		opacity: 0.6;
		margin-left: 2px;
	}

	/* ---- Table Cells ---- */
	td {
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-gallery-700);
		vertical-align: middle;
	}

	.td-icon {
		width: 36px;
		text-align: center;
		padding: 0.5rem 0.25rem;
	}

	.td-title {
		font-weight: 500;
		max-width: 220px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.td-truncate {
		max-width: 140px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.td-secondary {
		color: var(--color-gallery-500);
	}

	.td-num {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.td-date {
		font-size: 0.75rem;
		color: var(--color-gallery-400);
		white-space: nowrap;
	}

	.td-reviews {
		white-space: nowrap;
		max-width: 160px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.review-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		font-size: 0.6875rem;
		font-weight: 600;
		background: var(--color-gallery-100);
		color: var(--color-gallery-600);
		border-radius: 50%;
		margin-right: 0.375rem;
	}

	.review-names {
		font-size: 0.75rem;
		color: var(--color-gallery-400);
	}

	.td-votes {
		padding: 0.5rem 0.75rem;
	}

	.td-score {
		white-space: nowrap;
	}

	.score-value {
		font-size: 0.8125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.score-high {
		color: #16a34a;
	}

	.score-mid {
		color: #d97706;
	}

	.score-low {
		color: #dc2626;
	}

	.td-flags {
		padding: 0.5rem 0.75rem;
	}

	.flags-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.td-action {
		text-align: center;
		padding: 0.5rem 0.75rem;
	}

	.review-link {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-gallery-400);
		text-decoration: none;
		padding: 0.25rem 0.625rem;
		border: 1px solid var(--color-gallery-200);
		border-radius: 4px;
		transition: all 0.15s;
	}

	.review-link:hover {
		color: var(--color-gallery-800);
		border-color: var(--color-gallery-400);
	}

	.td-muted {
		color: var(--color-gallery-200);
	}

	/* ---- Row States ---- */
	:global(.reviewed-row) {
		opacity: 0.55;
	}

	:global(.reviewed-row:hover) {
		opacity: 0.85;
	}

	:global(.row-selected) {
		background: color-mix(in srgb, #16a34a 4%, transparent);
	}

	:global(.row-maybe) {
		background: color-mix(in srgb, #d97706 4%, transparent);
	}

	:global(.row-rejected) {
		background: color-mix(in srgb, #dc2626 3%, transparent);
	}

	/* ---- Empty State ---- */
	.empty {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color-gallery-400);
		font-size: 0.875rem;
	}

	@media (max-width: 640px) {
		.header-meta {
			flex-wrap: wrap;
		}

		.selection-bar {
			flex-direction: column;
			align-items: flex-start;
		}

		.toolbar {
			flex-direction: column;
			align-items: stretch;
		}

		.toolbar-right {
			justify-content: flex-end;
		}
	}
</style>
