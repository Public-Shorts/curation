<script lang="ts">
	let { volumeExponent = $bindable(), tendencyPenalty = $bindable() } = $props<{
		volumeExponent: number;
		tendencyPenalty: number;
	}>();
</script>

<div class="bg-gray-50 p-4 rounded-lg border border-gray-200 flex gap-8 items-center">
	<!-- Volume Influence -->
	<div class="space-y-1 relative group cursor-help">
		<label
			for="vol"
			class="text-xs font-semibold text-gray-500 uppercase border-b border-dotted border-gray-400"
			>Volume Influence</label
		>
		<div class="flex items-center gap-2">
			<input
				id="vol"
				type="range"
				min="0.5"
				max="3"
				step="0.1"
				bind:value={volumeExponent}
				class="w-32 accent-blue-600"
			/>
			<span class="text-sm font-mono w-8">{volumeExponent.toFixed(1)}</span>
		</div>

		<!-- Tooltip -->
		<div
			class="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
		>
			<p class="font-bold mb-1">Impact of Experience</p>
			<p class="mb-2 text-gray-300">
				Controls how much a curator's total review count weights their vote.
			</p>
			<ul class="list-disc pl-3 space-y-0.5 text-gray-400">
				<li><span class="text-white">1.0</span>: Standard log scaling.</li>
				<li><span class="text-white">&gt; 1.0</span>: Active Curators dominate.</li>
				<li>
					<span class="text-white">&lt; 1.0</span>: Less active Curators have equal say.
				</li>
			</ul>
		</div>
	</div>

	<!-- Bias Penalty -->
	<div class="space-y-1 relative group cursor-help">
		<label
			for="tend"
			class="text-xs font-semibold text-gray-500 uppercase border-b border-dotted border-gray-400"
			>Bias Penalty</label
		>
		<div class="flex items-center gap-2">
			<input
				id="tend"
				type="range"
				min="0"
				max="8"
				step="0.5"
				bind:value={tendencyPenalty}
				class="w-32 accent-rose-600"
			/>
			<span class="text-sm font-mono w-8">{tendencyPenalty.toFixed(1)}</span>
		</div>

		<!-- Tooltip -->
		<div
			class="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
		>
			<p class="font-bold mb-1">Penalty for Extremes</p>
			<p class="mb-2 text-gray-300">
				Reduces influence of curators who approve 0% or 100% of films.
			</p>
			<ul class="list-disc pl-3 space-y-0.5 text-gray-400">
				<li><span class="text-white">4.0</span>: Balanced penalty.</li>
				<li><span class="text-white">&gt; 4.0</span>: Strict. Only ~50% rates count.</li>
				<li><span class="text-white">0</span>: No penalty (pure volume).</li>
			</ul>
		</div>
	</div>
</div>
