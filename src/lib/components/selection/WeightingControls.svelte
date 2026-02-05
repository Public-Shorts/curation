<script lang="ts">
	let { volumeExponent = $bindable(), tendencyPenalty = $bindable() } = $props<{
		volumeExponent: number;
		tendencyPenalty: number;
	}>();
</script>

<div class="controls">
	<div class="control group">
		<label for="vol">Volume</label>
		<input
			id="vol"
			type="range"
			min="0.5"
			max="3"
			step="0.1"
			bind:value={volumeExponent}
		/>
		<span class="val">{volumeExponent.toFixed(1)}</span>
		<div class="tooltip">
			<p class="tooltip-title">Impact of Experience</p>
			<p>How much a curator's review count weights their vote.</p>
			<p>1.0 = standard, &gt;1 = active curators dominate, &lt;1 = equal say.</p>
		</div>
	</div>

	<div class="control group">
		<label for="tend">Bias</label>
		<input
			id="tend"
			type="range"
			min="0"
			max="8"
			step="0.5"
			bind:value={tendencyPenalty}
		/>
		<span class="val">{tendencyPenalty.toFixed(1)}</span>
		<div class="tooltip">
			<p class="tooltip-title">Penalty for Extremes</p>
			<p>Reduces influence of curators who approve 0% or 100%.</p>
			<p>4.0 = balanced, &gt;4 = strict, 0 = no penalty.</p>
		</div>
	</div>
</div>

<style>
	.controls {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.control {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		position: relative;
		cursor: help;
	}

	label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-gallery-400);
		border-bottom: 1px dotted var(--color-gallery-300);
	}

	input[type='range'] {
		width: 100px;
		height: 4px;
		appearance: none;
		background: var(--color-gallery-200);
		border-radius: 2px;
		cursor: pointer;
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color-gallery-600);
		cursor: pointer;
		transition: transform 0.15s;
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.val {
		font-size: 0.75rem;
		font-weight: 600;
		font-family: monospace;
		min-width: 24px;
		color: var(--color-gallery-600);
	}

	.tooltip {
		position: absolute;
		bottom: 100%;
		left: 0;
		margin-bottom: 0.5rem;
		width: 220px;
		padding: 0.625rem 0.75rem;
		background: var(--color-gallery-900);
		color: white;
		font-size: 0.6875rem;
		line-height: 1.4;
		border-radius: 6px;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.15s;
		z-index: 10;
	}

	.group:hover .tooltip {
		opacity: 1;
	}

	.tooltip-title {
		font-weight: 600;
		margin: 0 0 0.25rem;
	}

	.tooltip p {
		margin: 0 0 0.25rem;
		color: var(--color-gallery-300);
	}

	.tooltip p:last-child {
		margin-bottom: 0;
	}
</style>
