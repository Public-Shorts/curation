<script lang="ts">
	import MoviesTable from '$lib/components/selection/MoviesTable.svelte';

	let { data } = $props();

	// --- Weighting Configuration State ---
	let volumeExponent = $state(1); // Linear-ish influence of volume
	let tendencyPenalty = $state(4); // Penalty for deviation from 50% approval

	let sortKey = $state('score');
	let sortDir = $state<'asc' | 'desc'>('desc');

	// --- 1. Calculate Curator Weights ---
	let curatorWeights = $derived.by(() => {
		const weights: Record<string, number> = {};
		for (const [id, stats] of Object.entries(data.curatorStats)) {
			// Volume Score: Logarithmic scale to reward experience but prevent dominance
			const volumeScore = Math.log10(stats.totalReviews + 1) * volumeExponent;

			// Tendency Score: Penalize extremes (0% or 100% approval). Peak at 50%.
			// (rate - 0.5)^2 * 4 makes it 0 at 0% and 100%, and 1 at 50%.
			// We multiply by tendencyPenalty to adjust strength.
			// Formula: 1 - ((rate - 0.5)^2 * penalty)
			// We clamp it to ensure it doesn't go negative if penalty is huge.
			const deviation = Math.pow(stats.approvalRate - 0.5, 2);
			const tendencyScore = Math.max(0.1, 1 - deviation * tendencyPenalty);

			weights[id] = volumeScore * tendencyScore;
		}
		return weights;
	});

	// --- 2. Process Movies & Calculate Scores ---
	let filteredMovies = $derived.by(() => {
		return data.movies
			.map((movie: any) => {
				const reviews = movie.reviews || [];
				let weightedSum = 0;
				let totalWeight = 0;

				reviews.forEach((r: any) => {
					const w = curatorWeights[r.curatorId] || 0;
					// Voting Values: Selected = 1, Maybe = 0.5, Rejected = 0
					let val = 0;
					if (r.selection === 'selected') val = 1;
					else if (r.selection === 'maybe') val = 0.5;

					weightedSum += val * w;
					totalWeight += w;
				});

				const score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

				// Re-generate flags (client-side)
				const flags = [];
				if (movie.explicit)
					flags.push({ label: 'EXPLICIT', color: 'text-red-700 bg-red-50 border-red-200' });
				if (movie.aiUsed)
					flags.push({ label: 'AI', color: 'text-purple-700 bg-purple-50 border-purple-200' });

				// 3. Content Notes (Curator declared)
				// Aggregate all unique notes from all reviews, excluding 'none'
				const rawNotes = reviews.flatMap((r: any) => r.contentNotes || []);
				const uniqueNotes = Array.from(new Set(rawNotes)).filter((n: any) => n && n !== 'none');

				if (uniqueNotes.length > 0) {
					flags.push({
						label: 'WARNINGS',
						details: uniqueNotes.join(', '), // "Violence, Strong Language"
						color: 'text-orange-700 bg-orange-50 border-orange-200'
					});
				}

				return {
					...movie,
					score,
					reviewsCount: reviews.length,
					flags
				};
			})
			.sort((a: any, b: any) => {
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
	let stats = $derived.by(() => {
		let selected = 0;
		let maybe = 0;
		let rejected = 0;
		let selectedTime = 0;
		let maybeTime = 0;
		let rejectedTime = 0;
		let totalTime = 0;

		filteredMovies.forEach((m: any) => {
			const len = m.length || 0;
			totalTime += len;

			if (m.score >= 65) {
				selected++;
				selectedTime += len;
			} else if (m.score >= 35) {
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
			return h > 0 ? `${h}h ${m}m` : `${m}m`;
		};

		return {
			total: filteredMovies.length,
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

<div class="p-6 mx-auto space-y-8">
	<header class="flex flex-col gap-6 border-b border-gray-100 pb-6">
		<div class="flex justify-between items-end">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-gray-900">Final Selection</h1>
				<div class="flex items-center gap-6 mt-2">
					<div class="text-sm font-medium text-gray-500">
						Total: <span class="text-gray-900">{stats.total}</span>
						<span class="text-gray-400">({stats.totalTime})</span>
					</div>
					<div class="h-4 w-px bg-gray-200"></div>
					<div class="flex items-center gap-4 text-sm">
						<span
							class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium ring-1 ring-inset ring-green-600/20"
							title="Total Running Time"
						>
							<span class="w-1.5 h-1.5 rounded-full bg-green-600"></span>
							Selected: {stats.selected}
							<span class="text-green-600/60 ml-0.5">({stats.selectedTime})</span>
						</span>
						<span
							class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium ring-1 ring-inset ring-amber-600/20"
							title="Total Running Time"
						>
							<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
							Maybe: {stats.maybe} <span class="text-amber-600/60 ml-0.5">({stats.maybeTime})</span>
						</span>
						<span
							class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-medium ring-1 ring-inset ring-red-600/10"
							title="Total Running Time"
						>
							<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
							Rejected: {stats.rejected}
							<span class="text-red-600/60 ml-0.5">({stats.rejectedTime})</span>
						</span>
					</div>
				</div>
			</div>

			<!-- Weighting Control Panel -->
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
		</div>
	</header>

	<MoviesTable movies={filteredMovies} {sortKey} {sortDir} {setSort} />
</div>
