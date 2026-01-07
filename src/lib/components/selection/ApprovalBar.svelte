<!-- src/lib/components/selection/ApprovalBar.svelte -->
<script lang="ts">
	let { reviews } = $props();

	// 1. Calculate the counts
	let counts = $derived.by(() => {
		const total = reviews.length;
		const selected = reviews.filter((r: any) => r.selection === 'selected').length;
		const maybe = reviews.filter((r: any) => r.selection === 'maybe').length;
		// Both 'Not selected' and 'Technically unsuitable' share the value 'notSelected' in your schema
		const rejected = reviews.filter((r: any) => r.selection === 'notSelected').length;

		return { total, selected, maybe, rejected };
	});

	// 2. Compute segments for the visual bar
	let segments = $derived.by(() => {
		const { total, selected, maybe, rejected } = counts;
		if (total === 0) return [];

		return [
			{ width: (selected / total) * 100, color: 'bg-green-500' },
			{ width: (maybe / total) * 100, color: 'bg-yellow-400' },
			{ width: (rejected / total) * 100, color: 'bg-red-500' }
		].filter((s) => s.width > 0);
	});

	// 3. Approval % text
	let approvalPercentage = $derived.by(() => {
		if (counts.total === 0) return 0;
		return Math.round((counts.selected / counts.total) * 100);
	});
</script>

<!-- Container: "group" allows the child tooltip to react to this parent's hover state -->
<div class="group relative flex items-center gap-2 cursor-help w-full">
	<!-- Percentage Label -->
	<span class="text-xs font-semibold w-8 text-right text-gray-700">
		{approvalPercentage}%
	</span>

	<!-- The Segmented Bar -->
	<div class="h-1.5 flex-1 flex bg-gray-100 rounded-full overflow-hidden min-w-12.5">
		{#each segments as segment}
			<div class="h-full {segment.color}" style:width="{segment.width}%"></div>
		{/each}
	</div>

	<!-- Custom Tooltip -->
	<div
		class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
	>
		<div
			class="whitespace-nowrap rounded bg-gray-900 px-2.5 py-1.5 text-[10px] font-medium text-white shadow-lg ring-1 ring-white/10"
		>
			<div class="flex items-center gap-3">
				<span class="flex items-center gap-1">
					<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
					Selected: <span class="text-white">{counts.selected}</span>
				</span>
				<span class="flex items-center gap-1">
					<span class="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
					Maybe: <span class="text-white">{counts.maybe}</span>
				</span>
				<span class="flex items-center gap-1">
					<span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
					No: <span class="text-white">{counts.rejected}</span>
				</span>
			</div>

			<!-- Little arrow pointing down -->
			<div class="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 bg-gray-900"></div>
		</div>
	</div>
</div>
