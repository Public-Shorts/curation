<script lang="ts">
	import MoviesTable from '$lib/components/selection/MoviesTable.svelte';
	import SelectionStatsDisplay from '$lib/components/selection/SelectionStats.svelte';
	import WeightingControls from '$lib/components/selection/WeightingControls.svelte';
	import { calculateCuratorWeights, scoreMovies } from '$lib/utils/scoring';
	import type { CuratorStats, SelectionStats } from '$lib/utils/types';

	let { data } = $props<{
		data: {
			movies: any[]; // Raw data from server
			curatorStats: Record<string, CuratorStats>;
		};
	}>();

	// --- Weighting Configuration State ---
	let volumeExponent = $state(1); // Linear-ish influence of volume
	let tendencyPenalty = $state(4); // Penalty for deviation from 50% approval

	let sortKey = $state('score');
	let sortDir = $state<'asc' | 'desc'>('desc');

	let showWeights = $state(false);

	// --- 1. Calculate Curator Weights ---
	let curatorWeights = $derived(
		calculateCuratorWeights(data.curatorStats, volumeExponent, tendencyPenalty)
	);

	// --- 2. Process Movies & Calculate Scores ---
	let scoredMovies = $derived(scoreMovies(data.movies, curatorWeights));

	let sortedMovies = $derived.by(() => {
		return [...scoredMovies].sort((a: any, b: any) => {
			let av = a[sortKey];
			let bv = b[sortKey];

			// Handle string sorting
			if (typeof av === 'string') av = av.toLowerCase();
			if (typeof bv === 'string') bv = bv.toLowerCase();

			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});
	});

	// --- 3. Compute Summary Stats ---
	let stats: SelectionStats = $derived.by(() => {
		let selected = 0;
		let maybe = 0;
		let rejected = 0;
		let selectedTime = 0;
		let maybeTime = 0;
		let rejectedTime = 0;
		let totalTime = 0;

		sortedMovies.forEach((m) => {
			const len = m.length || 0;
			totalTime += len;

			const score = m.score || 0;
			if (score >= 65) {
				selected++;
				selectedTime += len;
			} else if (score >= 35) {
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
			total: sortedMovies.length,
			totalTime: formatTime(totalTime),
			selected,
			maybe,
			rejected,
			selectedTime: formatTime(selectedTime),
			maybeTime: formatTime(maybeTime),
			rejectedTime: formatTime(rejectedTime)
		};
	});

	function setSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = ['englishTitle'].includes(key) ? 'asc' : 'desc';
		}
	}
</script>

<header class="header">
	<div class="header-top">
		<h1>Selection</h1>
		<button class="btn-ghost" onclick={() => (showWeights = !showWeights)}>
			{showWeights ? 'Hide weights' : 'Weights'}
		</button>
	</div>
	<SelectionStatsDisplay {stats} />
</header>

{#if showWeights}
	<div class="weights-wrap">
		<WeightingControls bind:volumeExponent bind:tendencyPenalty />
	</div>
{/if}

<MoviesTable movies={sortedMovies} {sortKey} {sortDir} {setSort} />

<style>
	.header {
		margin-bottom: 1.5rem;
	}

	.header-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.header-top h1 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-gallery-900);
		margin: 0;
		letter-spacing: -0.01em;
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

	.weights-wrap {
		margin-bottom: 1.25rem;
	}
</style>
