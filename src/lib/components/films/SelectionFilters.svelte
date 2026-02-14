<script lang="ts">
	import { Filter } from 'lucide-svelte';

	let {
		selectedClusters = $bindable(),
		selectedTags = $bindable(),
		availableClusters,
		availableTags,
		onClear
	} = $props<{
		selectedClusters: Set<string>;
		selectedTags: Set<string>;
		availableClusters: Array<{ label: string; id: string }>;
		availableTags: Array<{ label: string; count: number }>;
		onClear: () => void;
	}>();

	let showFilters = $state(false);

	let activeFilterCount = $derived(selectedClusters.size + selectedTags.size);

	function toggleCluster(name: string) {
		if (selectedClusters.has(name)) {
			selectedClusters.delete(name);
		} else {
			selectedClusters.add(name);
		}
		selectedClusters = new Set(selectedClusters);
	}

	function toggleTag(label: string) {
		if (selectedTags.has(label)) {
			selectedTags.delete(label);
		} else {
			selectedTags.add(label);
		}
		selectedTags = new Set(selectedTags);
	}
</script>

<div class="space-y-3">
	<!-- Filter Toggle Button -->
	<div class="flex items-center gap-3">
		<button
			onclick={() => (showFilters = !showFilters)}
			class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gallery-700 bg-white border border-gallery-300 rounded-md hover:bg-gallery-50 transition-colors"
		>
			<Filter class="w-4 h-4" />
			Filters
			{#if activeFilterCount > 0}
				<span
					class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gallery-900 rounded-full"
				>
					{activeFilterCount}
				</span>
			{/if}
		</button>

		{#if activeFilterCount > 0}
			<button onclick={onClear} class="text-sm text-gallery-500 hover:text-gallery-700 transition-colors">
				Clear all
			</button>
		{/if}
	</div>

	<!-- Filter Panel -->
	{#if showFilters}
		<div class="p-4 bg-gallery-50 rounded-lg border border-gallery-200 space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Cluster Filter -->
				<div class="space-y-2">
					<label class="block text-xs font-semibold text-gallery-500 uppercase tracking-wider">
						Clusters
						{#if selectedClusters.size > 0}
							<span class="text-gallery-900">({selectedClusters.size})</span>
						{/if}
					</label>
					<select
						class="w-full text-sm border-gallery-300 rounded-md"
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							if (target.value) {
								toggleCluster(target.value);
								target.value = '';
							}
						}}
					>
						<option value="">Select cluster...</option>
						{#each availableClusters as cluster}
							<option value={cluster.label} disabled={selectedClusters.has(cluster.label)}>
								{cluster.label}
							</option>
						{/each}
					</select>
					{#if selectedClusters.size > 0}
						<div class="flex flex-wrap gap-1 mt-2">
							{#each [...selectedClusters] as cluster}
								<button
									onclick={() => toggleCluster(cluster)}
									class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gallery-900 text-white rounded-full hover:bg-gallery-800 transition-colors"
								>
									{cluster}
									<span class="opacity-60">×</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Tag Filter -->
				<div class="space-y-2">
					<label class="block text-xs font-semibold text-gallery-500 uppercase tracking-wider">
						Tags (≥2 occurrences)
						{#if selectedTags.size > 0}
							<span class="text-gallery-900">({selectedTags.size})</span>
						{/if}
					</label>
					<select
						class="w-full text-sm border-gallery-300 rounded-md"
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							if (target.value) {
								toggleTag(target.value);
								target.value = '';
							}
						}}
					>
						<option value="">Select tag...</option>
						{#each availableTags as tag}
							<option value={tag.label} disabled={selectedTags.has(tag.label)}>
								{tag.label} ({tag.count})
							</option>
						{/each}
					</select>
					{#if selectedTags.size > 0}
						<div class="flex flex-wrap gap-1 mt-2">
							{#each [...selectedTags] as tag}
								<button
									onclick={() => toggleTag(tag)}
									class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gallery-900 text-white rounded-full hover:bg-gallery-800 transition-colors"
								>
									{tag}
									<span class="opacity-60">×</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
