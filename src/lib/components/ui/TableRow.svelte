<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = ''
	}: {
		children: Snippet;
		class?: string;
	} = $props();

	const classes = `hover:bg-gallery-50/50 transition-colors ${className}`;
</script>

<tr class={classes}>
	{@render children()}
</tr>
