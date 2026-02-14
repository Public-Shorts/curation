<script lang="ts">
	import CuratorStats from '$lib/components/CuratorStats.svelte';
	import CuratorReviewsTable from '$lib/components/tables/CuratorReviewsTable.svelte';
	import { FilmDetailDialog } from '$lib/components/films';

	let { data } = $props();

	let selectedFilm = $state<any | null>(null);

	async function showFilmDetails(submissionId: string) {
		const res = await fetch(`/api/submission/${submissionId}`);
		if (res.ok) {
			selectedFilm = await res.json();
		}
	}
</script>

<div class="mx-auto max-w-7xl p-6">
	<CuratorStats curatorName={data.curator?.name} stats={data.stats} />

	<CuratorReviewsTable reviews={data.reviews} onFilmClick={showFilmDetails} />
</div>

{#if selectedFilm}
	<FilmDetailDialog film={selectedFilm} onClose={() => (selectedFilm = null)} />
{/if}
