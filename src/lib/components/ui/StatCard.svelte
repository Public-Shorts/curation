<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		value,
		children,
		class: className = ''
	}: {
		label: string;
		value?: string | number;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<div class="rounded-lg bg-white p-4 shadow-sm border border-gallery-100 {className}">
	<p class="text-xs uppercase text-gallery-500">{label}</p>
	{#if value !== undefined}
		<p class="mt-1 text-2xl font-semibold">{value}</p>
	{:else if children}
		<div class="mt-1">
			{@render children()}
		</div>
	{/if}
</div>
