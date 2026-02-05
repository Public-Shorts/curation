<!-- src/lib/components/selection/MoviesTable.svelte -->
<script lang="ts">
	import type { Movie } from '$lib/utils/types';
	import VoteBreakdown from './VoteBreakdown.svelte';
	import FlagBadge from '$lib/components/ui/FlagBadge.svelte';

	let { movies, sortKey, sortDir, setSort } = $props<{
		movies: Movie[];
		sortKey: string;
		sortDir: 'asc' | 'desc';
		setSort: (key: string) => void;
	}>();

	const thresholds = { selected: 65, maybe: 35 };
</script>

<div class="table-wrap">
	<table class="table">
		<thead>
			<tr>
				<th class="th-sortable" onclick={() => setSort('englishTitle')}>
					Title {#if sortKey === 'englishTitle'}<span class="sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>{/if}
				</th>
				<th class="th-sortable th-narrow" onclick={() => setSort('reviewsCount')}>
					Reviews {#if sortKey === 'reviewsCount'}<span class="sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>{/if}
				</th>
				<th class="th-plain th-narrow">Votes</th>
				<th class="th-sortable th-narrow" onclick={() => setSort('score')}>
					Weighted {#if sortKey === 'score'}<span class="sort-arrow">{sortDir === 'asc' ? '↑' : '↓'}</span>{/if}
				</th>
				<th class="th-plain th-narrow">Flags</th>
				<th class="th-plain th-narrow"></th>
			</tr>
		</thead>
		<tbody>
			{#each movies as movie (movie._id)}
				{@const score = movie.score || 0}
				{@const hasReviews = (movie.reviewsCount || 0) > 0}
				<tr
					class:row-selected={score >= thresholds.selected}
					class:row-maybe={score >= thresholds.maybe && score < thresholds.selected}
					class:row-rejected={hasReviews && score < thresholds.maybe}
				>
					<td class="td-title">
						<span class="title-text" title={movie.englishTitle}>{movie.englishTitle}</span>
						<span class="title-sub">{movie.directorName} · {movie.length}′</span>
					</td>
					<td class="td-center">
						<span class="review-badge">{movie.reviewsCount}</span>
					</td>
					<td>
						<VoteBreakdown reviews={movie.reviews || []} />
					</td>
					<td class="td-score">
						{#if hasReviews}
							<span class="score-value" class:score-high={score >= thresholds.selected} class:score-mid={score >= thresholds.maybe && score < thresholds.selected} class:score-low={score < thresholds.maybe}>
								{score.toFixed(0)}%
							</span>
						{:else}
							<span class="td-muted">-</span>
						{/if}
					</td>
					<td>
						{#if movie.flags && movie.flags.length > 0}
							<div class="flags-wrap">
								{#each movie.flags as flag}
									<FlagBadge {flag} />
								{/each}
							</div>
						{:else}
							<span class="td-muted">-</span>
						{/if}
					</td>
					<td class="td-action">
						<a href="/review/{movie._id}" class="review-link">Review</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if movies.length === 0}
		<p class="empty">No movies match the selected filters.</p>
	{/if}
</div>

<style>
	.table-wrap {
		overflow-x: auto;
	}

	.table {
		width: 100%;
		text-align: left;
		border-collapse: collapse;
	}

	thead {
		border-bottom: 1px solid var(--color-gallery-200);
	}

	th {
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

	.th-narrow {
		width: 100px;
	}

	.sort-arrow {
		font-size: 0.625rem;
		opacity: 0.6;
		margin-left: 2px;
	}

	tbody tr {
		border-bottom: 1px solid var(--color-gallery-100);
		transition: background 0.1s;
	}

	tbody tr:hover {
		background: var(--color-gallery-50);
	}

	td {
		padding: 0.5rem 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-gallery-700);
		vertical-align: middle;
	}

	.td-title {
		max-width: 260px;
	}

	.title-text {
		display: block;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.title-sub {
		display: block;
		font-size: 0.75rem;
		color: var(--color-gallery-400);
		margin-top: 1px;
	}

	.td-center {
		text-align: center;
	}

	.review-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 0.375rem;
		font-size: 0.6875rem;
		font-weight: 600;
		background: var(--color-gallery-100);
		color: var(--color-gallery-600);
		border-radius: 10px;
	}

	.td-score {
		white-space: nowrap;
	}

	.score-value {
		font-size: 0.8125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.score-high { color: #16a34a; }
	.score-mid { color: #d97706; }
	.score-low { color: #dc2626; }

	.td-muted {
		color: var(--color-gallery-200);
	}

	.flags-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.td-action {
		text-align: center;
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

	.row-selected {
		background: color-mix(in srgb, #16a34a 4%, transparent);
	}

	.row-maybe {
		background: color-mix(in srgb, #d97706 4%, transparent);
	}

	.row-rejected {
		background: color-mix(in srgb, #dc2626 3%, transparent);
	}

	.empty {
		padding: 3rem 1rem;
		text-align: center;
		color: var(--color-gallery-400);
		font-size: 0.875rem;
	}
</style>
