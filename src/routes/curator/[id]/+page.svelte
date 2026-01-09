<script lang="ts">
    import CuratorStats from '$lib/components/CuratorStats.svelte';
    import CuratorReviewsTable from '$lib/components/tables/CuratorReviewsTable.svelte';
    
    let { data } = $props();
</script>

<div class="mx-auto max-w-7xl p-6">
	<!-- Use optional chaining (?.) just in case data itself is malformed -->
	<CuratorStats curatorName={data.curator?.name} stats={data.stats} />

	<CuratorReviewsTable reviews={data.reviews} />
</div>
