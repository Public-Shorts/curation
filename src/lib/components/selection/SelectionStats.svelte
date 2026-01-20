<script lang="ts">
	import type { SelectionStats } from '$lib/utils/types';

	let { stats } = $props<{ stats: SelectionStats }>();
</script>

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
