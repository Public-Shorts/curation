<script lang="ts">
	interface Props {
		selectedJuryIds?: string[];
		availableCurators: Array<{ _id: string; name: string; email: string }>;
		onUpdate: (juryIds: string[]) => void;
	}

	let { selectedJuryIds = [], availableCurators, onUpdate }: Props = $props();
	let selected = $state<Set<string>>(new Set(selectedJuryIds));

	function toggleCurator(curatorId: string) {
		selected = new Set(selected); // Create a new Set to trigger reactivity
		if (selected.has(curatorId)) {
			selected.delete(curatorId);
		} else {
			selected.add(curatorId);
		}
		onUpdate(Array.from(selected));
	}
</script>

<div class="space-y-2">
	<h4 class="font-medium text-sm text-gallery-700">Jury Members</h4>
	<div class="max-h-40 overflow-y-auto space-y-1 border border-gallery-200 rounded p-2 bg-white">
		{#each availableCurators as curator}
			<label class="flex items-center gap-2 text-sm hover:bg-gallery-50 p-1 rounded cursor-pointer">
				<input
					type="checkbox"
					checked={selected.has(curator._id)}
					onchange={() => toggleCurator(curator._id)}
					class="rounded border-gallery-300 text-gallery-900 focus:ring-gallery-500"
				/>
				<span>{curator.name}</span>
			</label>
		{/each}
		{#if availableCurators.length === 0}
			<p class="text-xs text-gallery-400 italic">No curators available</p>
		{/if}
	</div>
</div>
