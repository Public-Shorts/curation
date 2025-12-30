<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import Toaster from '$lib/toast/Toaster.svelte';
	import { setToastMessages } from '$lib/toast/toastMessages.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	let { data, children } = $props();
	import '../app.css';
	setToastMessages();
</script>

<svelte:head>
	<title>Public Shorts - Curation Platform</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href="/favicon.png" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="manifest" href="/site.webmanifest" />
</svelte:head>
<div class="min-h-screen bg-gray-50 text-gray-900 font-PPMori">
	<Navbar currentPath={data.currentPath} />

	<main class="mx-auto max-w-5xl px-4 py-8">
		{@render children()}
	</main>
</div>
<Toaster />
