<script lang="ts">
	import type { SelectionStats } from '$lib/utils/types';

	let { stats } = $props<{ stats: SelectionStats }>();
</script>

<div class="stats">
	<span class="stat">
		{stats.total} films
		<span class="dim">{stats.totalTime}</span>
	</span>
	{#if stats.highlighted != null && stats.highlighted > 0}
		<span class="sep"></span>
		<span class="stat">
			<span class="star">★</span>
			{stats.highlighted}
		</span>
	{/if}
	<span class="sep"></span>
	<span class="stat">
		<span class="dot dot-green"></span>
		{stats.selected}
		<span class="dim">{stats.selectedTime}</span>
	</span>
	<span class="stat">
		<span class="dot dot-amber"></span>
		{stats.maybe}
		<span class="dim">{stats.maybeTime}</span>
	</span>
	<span class="stat">
		<span class="dot dot-red"></span>
		{stats.rejected}
		<span class="dim">{stats.rejectedTime}</span>
	</span>
</div>

<style>
	.stats {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.8125rem;
		color: var(--color-gallery-600);
	}

	.stat {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		white-space: nowrap;
	}

	.dim {
		color: var(--color-gallery-400);
		font-size: 0.75rem;
	}

	.sep {
		width: 1px;
		height: 12px;
		background: var(--color-gallery-200);
		flex-shrink: 0;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.dot-green {
		background: #16a34a;
	}

	.dot-amber {
		background: #d97706;
	}

	.dot-red {
		background: #dc2626;
	}

	.star {
		color: var(--color-highlight-500);
		font-size: 0.75rem;
	}
</style>
