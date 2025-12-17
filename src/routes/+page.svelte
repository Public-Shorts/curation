<script lang="ts">
  import SelectionTag from './SelectionTag.svelte';

	let { data } = $props();

	const stats = data.curatorStats;
	const curator = stats.curator;
	const total = stats.totalReviews ?? 0;
	const approved = stats.approvedReviews ?? 0;
	const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

	type SortKey =
		| 'englishTitle'
		| 'filmLanguage'
		| 'categories'
		| 'length'
		| '_createdAt'
		| 'reviewsCount';
	type SortDir = 'asc' | 'desc';

	let sortKey: SortKey = '_createdAt';
	let sortDir: SortDir = 'desc';

	const totalMinutes = data.submissions.reduce((total, s) => {
        const hasReviewed = s.reviews?.some((r) => r.curator?._id === curator?._id);
        // Ensure length is treated as a number; default to 0 if missing
        return hasReviewed ? total + (Number(s.length) || 0) : total;
    }, 0);

    // Optional: Format helper
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeDisplay = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

	const submissions = $state(
        data.submissions.map((s) => {
            // Find the review belonging to the current curator
            const myReview = s.reviews?.find((r) => r.curator?._id === curator?._id);
            
            return {
                ...s,
                reviewsCount: s.reviews?.length ?? 0,
                // Add these helper properties for easy access in the HTML
                mySelection: myReview?.selection ?? 'Pending', 
                hasReviewed: !!myReview
            };
        })
    );

	function setSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === '_createdAt' ? 'desc' : 'asc';
		}
		sortSubmissions();
	}

	function sortSubmissions() {
		submissions.sort((a, b) => {
			let av: any;
			let bv: any;

			if (sortKey === 'categories') {
				av = (a.categories ?? []).join(', ');
				bv = (b.categories ?? []).join(', ');
			} else {
				av = a[sortKey];
				bv = b[sortKey];
			}

			if (av == null && bv == null) return 0;
			if (av == null) return sortDir === 'asc' ? -1 : 1;
			if (bv == null) return sortDir === 'asc' ? 1 : -1;

			if (sortKey === '_createdAt') {
				av = new Date(av).getTime();
				bv = new Date(bv).getTime();
			}

			if (av < bv) return sortDir === 'asc' ? -1 : 1;
			if (av > bv) return sortDir === 'asc' ? 1 : -1;
			return 0;
		});
	}

	sortSubmissions();
</script>

<section class="grid gap-4 md:grid-cols-4 pb-12">
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<p class="text-xs uppercase text-gray-500">Curator</p>
		<p class="mt-1 text-lg font-semibold">{curator?.name}</p>
	</div>
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<p class="text-xs uppercase text-gray-500">Reviews</p>
		<p class="mt-1 text-lg font-semibold">{total}</p>
	</div>
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<p class="text-xs uppercase text-gray-500">Approved · Rate</p>
		<p class="mt-1 text-lg font-semibold">
			{approved} <span class="text-sm text-gray-500">({approvalRate}%)</span>
		</p>
	</div>
	<!-- New Card -->
	<div class="rounded-lg bg-white p-4 shadow-sm">
		<p class="text-xs uppercase text-gray-500">Total Watched</p>
		<p class="mt-1 text-lg font-semibold" title="{totalMinutes} total minutes">
			{timeDisplay}
		</p>
	</div>
</section>
<!--Your submissions table-->
<section class="space-y-6 pb-12">
	<header class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold">Your reviews</h2>
		<p class="text-sm text-gray-500">Total: {submissions.filter((s) => s.hasReviewed).length}</p>
	</header>
	{#if submissions.filter((s) => s.hasReviewed).length === 0}
		<div class="rounded-lg bg-gray-50 p-8 text-center">
			<p class="text-gray-500">You haven't reviewed any submissions yet.</p>
		</div>
	{:else}
		<table class="w-full text-left text-sm">
			<thead class="border-b text-[10px] uppercase text-gray-500">
				<tr>
					<th class="py-2">Title</th>
					<th class="py-2">Selection</th>
					<th class="py-2">Review</th>
				</tr>
			</thead>
			<tbody>
				<!-- Filter using the helper property we created -->
				{#each submissions.filter((s) => s.hasReviewed) as s}
					<tr class="border-b last:border-0 align-top">
						<td class="py-2 pr-4 truncate-cell" title={s.englishTitle}>
							{s.englishTitle}
						</td>

						<!-- NOW this works because we mapped it in the script -->
						<td class="py-2 pr-4 truncate-cell">
							<!-- Optional: Add some styling for different states -->
							<SelectionTag selection={s.mySelection} />
						</td>

						<td class="py-2 pr-2">
							<a
								href={`/review/${s._id}`}
								class="rounded border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-100"
							>
								Edit Review
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</section>
<!--All Submissions table -->
<section class="space-y-6 pb-12">
	<header class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold">All submissions</h2>
		<p class="text-sm text-gray-500">Total: {submissions.length}</p>
	</header>

	<table class="w-full text-left text-sm">
		<thead class="border-b text-[10px] uppercase text-gray-500">
			<tr>
				<th class="cursor-pointer py-2" onclick={() => setSort('englishTitle')}>Title</th>
				<th class="cursor-pointer py-1" onclick={() => setSort('filmLanguage')}>Language</th>
				<th class="cursor-pointer py-2" onclick={() => setSort('categories')}>Categories</th>
				<th class="cursor-pointer py-1" onclick={() => setSort('length')}>Length</th>
				<th class="cursor-pointer py-2" onclick={() => setSort('_createdAt')}>Uploaded</th>
				<th class="cursor-pointer py-2" onclick={() => setSort('reviewsCount')}> Reviewed by </th>
				<th class="py-2">Review</th>
			</tr>
		</thead>

		<tbody>
			{#each submissions as s}
				<tr class="border-b last:border-0 align-center">
					<td class="py-2 pr-4 truncate-cell" title={s.englishTitle}>{s.englishTitle}</td>
					<td class="py-2 pr-4 truncate-cell" title={s.filmLanguage}>{s.filmLanguage}</td>
					<td
						class="py-2 pr-4 truncate-cell"
						title={s.categories?.map((c) => c).join(', ') +
							(s.categories?.includes('other') && s.categoryOther ? `, ${s.categoryOther}` : '')}
					>
						{s.categories?.map((c) => c).join(', ') +
							(s.categories?.includes('other') && s.categoryOther ? `, ${s.categoryOther}` : '')}
					</td>
					<td class="py-2 pr-4 truncate-cell" title={s.length}>{s.length}</td>
					<td
						class="py-2 pr-4 text-xs text-gray-500 truncate-cell"
						title={new Date(s._createdAt).toLocaleString()}
					>
						{new Date(s._createdAt).toLocaleString()}
					</td>
					<td
						class="py-2 pr-4 truncate-cell"
						title={s.reviews?.map((r) => r.curator?.name).join(', ') || 'No reviews yet'}
					>
						{#if s.reviews?.length}
							<span class="py-0.5 px-1.5 bg-white rounded-full">{s.reviews.length}</span>
							{s.reviews.map((r) => r.curator?.name).join(', ')}
						{:else}
							<span class=" text-gray-400">No reviews yet</span>
						{/if}
					</td>
					<td class="py-2">
						<a
							href={`/review/${s._id}`}
							class="rounded border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-100"
						>
							Review
						</a>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<style>
	.truncate-cell {
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
