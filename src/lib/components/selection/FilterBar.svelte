<script lang="ts">
  import FilterDropdown from '$lib/components/FilterDropdown.svelte';

  let {
    allCategories,
    allCuratorTags,
    activeCategories = $bindable<string[]>([]),
    activeCuratorTags = $bindable<string[]>([])
  } = $props();

  let hasActiveFilters = $derived(
    activeCategories.length > 0 || activeCuratorTags.length > 0
  );
</script>

<div class="flex items-center gap-3">
  <span class="text-xs font-medium text-gray-500 uppercase tracking-wider mr-1">Filters:</span>

  <FilterDropdown label="Genre" options={allCategories} bind:selected={activeCategories} />
  <FilterDropdown label="Curator Tags" options={allCuratorTags} bind:selected={activeCuratorTags} color="blue" />

  {#if hasActiveFilters}
    <div class="w-px h-6 bg-gray-200 mx-1"></div>
    <button
      onclick={() => {
        activeCategories = [];
        activeCuratorTags = [];
      }}
      class="text-sm text-red-600 hover:text-red-800 font-medium"
    >
      Clear All
    </button>
  {/if}
</div>
