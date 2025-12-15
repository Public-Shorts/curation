<script lang="ts">
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

	const submissions = $state(
		data.submissions.map((s) => ({
			...s,
			reviewsCount: s.reviews?.length ?? 0
		}))
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

<style>
	.truncate-cell {
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
<div class="space-y-8 pb-4">
	<!-- Stats -->
	<div class="grid gap-4 md:grid-cols-3">
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
				{approved} <span class="text-sm text-gray-500">({approvalRate}% )</span>
			</p>
		</div>
	</div>
	</div>
<div class="space-y-6">
	<header class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold">All submissions</h1>
		<p class="text-sm text-gray-500">Total: {submissions.length}</p>
	</header>

	<table class="w-full text-left text-sm">
		<thead class="border-b text-[10px] uppercase text-gray-500">
			<tr>
				<th class="cursor-pointer py-2" on:click={() => setSort('englishTitle')}>Title</th>
				<th class="cursor-pointer py-1" on:click={() => setSort('filmLanguage')}>Language</th>
				<th class="cursor-pointer py-2" on:click={() => setSort('categories')}>Categories</th>
				<th class="cursor-pointer py-1" on:click={() => setSort('length')}>Length</th>
				<th class="cursor-pointer py-2" on:click={() => setSort('_createdAt')}>Uploaded</th>
				<th class="cursor-pointer py-2" on:click={() => setSort('reviewsCount')}>
					Reviewed by
				</th>
				<th class="py-2">Review</th>
			</tr>
		</thead>

		<tbody>
			{#each submissions as s}
				<tr class="border-b last:border-0 align-top">
					<td class="py-2 pr-4 truncate-cell" title={s.englishTitle}>{s.englishTitle}</td>
					<td class="py-2 pr-4 truncate-cell" title={s.filmLanguage}>{s.filmLanguage}</td>
					<td
						class="py-2 pr-4 truncate-cell"
						title={s.categories
							?.map((c) => c)
							.join(', ') +
							(s.categories?.includes('other') && s.categoryOther
								? `, ${s.categoryOther}`
								: '')}
					>
						{s.categories
							?.map((c) => c)
							.join(', ') +
							(s.categories?.includes('other') && s.categoryOther
								? `, ${s.categoryOther}`
								: '')}
					</td>
					<td class="py-2 pr-4 truncate-cell" title={s.length}>{s.length}</td>
					<td
						class="py-2 pr-4 text-xs text-gray-500 truncate-cell"
						title={new Date(s._createdAt).toLocaleString()}
					>
						{new Date(s._createdAt).toLocaleString()}
					</td>
					<td
						class="py-2 pr-4 text-xs text-gray-600 truncate-cell"
						title={s.reviews?.map((r) => r.curator?.name).join(', ') || 'No reviews yet'}
					>
						{#if s.reviews?.length}
							{s.reviews.map((r) => r.curator?.name).join(', ')}
						{:else}
							<span class="italic text-gray-400">No reviews yet</span>
						{/if}
					</td>
					<td class="py-2 pr-2">
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
</div>

