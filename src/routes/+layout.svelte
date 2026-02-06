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
<div class="min-h-screen bg-gallery-100 text-gallery-700 font-PPMori">
	<Navbar currentPath={data.currentPath} isAdmin={data.isAdmin} isJury={data.isJury} />

	<main class="mx-auto max-w-7xl px-4 py-8">
		{@render children()}
	</main>
</div>
<Toaster />

<style>
	:global(body) {
		background-color: var(--color-gallery-50);
		color: var(--color-gallery-800);
		margin: 0;
	}
	:global(a) {
		color: var(--color-gallery-900);
		text-underline-offset: 4px;
	}
	:global(::selection) {
		background-color: var(--color-accent-200);
		color: var(--color-accent-500);
	}
</style>
