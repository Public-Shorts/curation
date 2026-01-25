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

<thead
	class="bg-gallery-50 border-b border-gallery-100 text-[10px] uppercase text-gallery-500 tracking-wider {className}"
>
	{@render children()}
</thead>
