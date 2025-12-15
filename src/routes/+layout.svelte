<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';

	let { data, children } = $props();
	import './layout.css';

</script>

<div class="min-h-screen bg-gray-50 text-gray-900">
	<Navbar currentPath={data.currentPath} />

	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>
