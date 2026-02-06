<!-- src/lib/components/FilterDropdown.svelte -->
<script lang="ts">
    import { fade, fly } from 'svelte/transition';
	import { ChevronDown, Check } from 'lucide-svelte';

    let { 
        label, 
        options, 
        selected = $bindable([]),
        color = 'gray' // 'gray' | 'blue'
    } = $props<{
        label: string;
        options: string[];
        selected: string[];
        color?: 'gray' | 'blue';
    }>();

    let isOpen = $state(false);
    let dropdownRef: HTMLElement;

    // Close on click outside
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
            isOpen = false;
        }
    }

    function toggleOption(option: string) {
        if (selected.includes(option)) {
            selected = selected.filter(s => s !== option);
        } else {
            selected = [...selected, option];
        }
    }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative inline-block text-left" bind:this={dropdownRef}>
	<!-- Trigger Button -->
	<button
		type="button"
		onclick={() => (isOpen = !isOpen)}
		class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 {color ===
		'blue'
			? 'focus:ring-blue-500'
			: 'focus:ring-black'}"
	>
		{label}
		{#if selected.length > 0}
			<span
				class="ml-1 inline-flex items-center justify-center rounded-full {color === 'blue'
					? 'bg-blue-100 text-blue-800'
					: 'bg-gray-100 text-gray-800'} px-2 py-0.5 text-xs font-semibold"
			>
				{selected.length}
			</span>
		{/if}
		<ChevronDown class="h-4 w-4 text-gray-500 transition-transform {isOpen ? 'rotate-180' : ''}" />
	</button>

	<!-- Dropdown Panel -->
	{#if isOpen}
		<div
			transition:fly={{ y: 5, duration: 200 }}
			class="absolute left-0 z-10 mt-2 w-64 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
		>
			<div class="p-1 max-h-60 overflow-y-auto">
				{#each options as option}
					<button
						type="button"
						onclick={() => toggleOption(option)}
						class="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-left {selected.includes(
							option
						)
							? color === 'blue'
								? 'bg-blue-50 text-blue-700'
								: 'bg-gray-100 text-gray-900'
							: 'text-gray-700 hover:bg-gray-50'}"
					>
						<span class="truncate">{option}</span>
						{#if selected.includes(option)}
							<Check class="h-4 w-4 {color === 'blue' ? 'text-blue-600' : 'text-black'}" />
						{/if}
					</button>
				{/each}
				{#if options.length === 0}
					<p class="px-3 py-2 text-xs text-gray-500 italic">No options available.</p>
				{/if}
			</div>

			{#if selected.length > 0}
				<div class="border-t border-gray-100 bg-gray-50 px-3 py-2">
					<button
						type="button"
						onclick={() => (selected = [])}
						class="text-xs font-medium text-red-600 hover:text-red-800"
					>
						Clear filters
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
