<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = ''
	}: {
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div class="rounded-lg bg-white p-4 shadow-sm border border-gallery-100 {className}">
	{@render children()}
</div>
