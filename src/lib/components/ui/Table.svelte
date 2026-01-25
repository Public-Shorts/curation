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

<div class="overflow-hidden rounded-lg border border-gallery-200 bg-white shadow-sm">
	<table class="w-full text-left text-sm {className}">
		{@render children()}
	</table>
</div>
