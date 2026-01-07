<script lang="ts">
  let { reviews } = $props();

  // Compute segments based on reviews prop
  let segments = $derived.by(() => {
    const total = reviews.length;
    if (total === 0) return [];
	console.log('Reviews:', reviews);
    const selected = reviews.filter((r: any) => r.selection === 'selected').length;
    // Note: The schema has 'needs discussion' as a value for 'maybe' logic usually, 
    // but the value in schema is 'needs discussion'. 
    // Adjust strings below to match your exact sanity values if they differ.
    const maybe = reviews.filter((r: any) => r.selection === 'maybe').length;
    const rejected = reviews.filter((r: any) => 
      ['notSelected', 'technically unsuitable'].includes(r.selection)
    ).length;

    // Calculate widths as percentages
    return [
      { width: (selected / total) * 100, color: 'bg-green-500', label: 'Selected' },
      { width: (maybe / total) * 100, color: 'bg-yellow-500', label: 'Maybe' },
      { width: (rejected / total) * 100, color: 'bg-red-500', label: 'Rejected' }
    ].filter(s => s.width > 0); // Only show segments that exist
  });
  
  // Calculate raw approval percentage for the text label
  let approvalPercentage = $derived.by(() => {
     if (reviews.length === 0) return 0;
     const selected = reviews.filter((r: any) => r.selection === 'selected').length;
     return Math.round((selected / reviews.length) * 100);
  });
</script>

<div class="flex items-center gap-2">
	<span class="text-xs font-semibold w-8 text-right">
		{approvalPercentage}%
	</span>

	<div class="h-1.5 flex-1 flex bg-gray-100 rounded-full overflow-hidden min-w-[50px]">
		{#each segments as segment}
			<div
				class="h-full {segment.color}"
				style:width="{segment.width}%"
				title={segment.label}
			></div>
		{/each}
	</div>
</div>
