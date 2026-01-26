<script lang="ts">
	import SelectionTag from '$lib/components/SelectionTag.svelte';
	import { StatCard, Table, TableHead, TableBody, TableRow, Button } from '$lib/components/ui';

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

	const totalMinutes = data.submissions.reduce((total: number, s: any) => {
		const hasReviewed = s.reviews?.some((r: any) => r.curator?._id === curator?._id);
		return hasReviewed ? total + (Number(s.length) || 0) : total;
	}, 0);

	const hours = Math.floor(totalMinutes / 60);
	const mins = totalMinutes % 60;
	const timeDisplay = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

	const submissions = $state(
		data.submissions.map((s: any) => {
			const myReview = s.reviews?.find((r: any) => r.curator?._id === curator?._id);

			return {
				...s,
				reviewsCount: s.reviews?.length ?? 0,
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
		submissions.sort((a: any, b: any) => {
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
	<StatCard label="Curator" value={curator?.name} />
	<StatCard label="Reviews" value={total} />
	<StatCard label="Approved · Rate">
		<p class="text-lg font-semibold">
			{approved} <span class="text-sm text-gallery-500">({approvalRate}%)</span>
		</p>
	</StatCard>
	<StatCard label="Total Watched" value={timeDisplay} />
</section>

<!--My Reviews Link-->
<section class="pb-8">
	<a
		href="/my-reviews"
		class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
	>
		<span>View My Reviews & Highlights</span>
		<span>→</span>
	</a>
</section>

<!--All Submissions table -->
<section class="space-y-6 pb-12">
	<header class="flex items-center justify-between">
		<h2 class="text-2xl font-semibold">All submissions</h2>
		<p class="text-sm text-gallery-500">Total: {submissions.length}</p>
	</header>

	<Table>
		<TableHead>
			<tr>
				<th class="cursor-pointer py-3 px-4" onclick={() => setSort('englishTitle')}>Title</th>
				<th class="cursor-pointer py-3 px-4" onclick={() => setSort('filmLanguage')}>Language</th>
				<th class="cursor-pointer py-3 px-4" onclick={() => setSort('categories')}>Categories</th>
				<th class="cursor-pointer py-3 px-4" onclick={() => setSort('length')}>Length</th>
				<th class="cursor-pointer py-3 px-4" onclick={() => setSort('_createdAt')}>Uploaded</th>
				<th class="cursor-pointer py-3 px-4" onclick={() => setSort('reviewsCount')}>Reviewed by</th
				>
				<th class="py-3 px-4 text-center">Review</th>
			</tr>
		</TableHead>

		<TableBody>
			{#each submissions as s (s._id)}
				<TableRow class={s.hasReviewed ? 'opacity-50' : ''}>
					<td class="py-3 px-4 truncate-cell" title={s.englishTitle}>{s.englishTitle}</td>
					<td class="py-3 px-4 truncate-cell" title={s.filmLanguage}>{s.filmLanguage}</td>
					<td
						class="py-3 px-4 truncate-cell"
						title={s.categories?.map((c: string) => c).join(', ') +
							(s.categories?.includes('other') && s.categoryOther ? `, ${s.categoryOther}` : '')}
					>
						{s.categories?.map((c: string) => c).join(', ') +
							(s.categories?.includes('other') && s.categoryOther ? `, ${s.categoryOther}` : '')}
					</td>
					<td class="py-3 px-4" title={s.length}>{s.length} min</td>
					<td
						class="py-3 px-4 text-xs text-gallery-500 truncate-cell"
						title={new Date(s._createdAt).toLocaleString()}
					>
						{new Date(s._createdAt).toLocaleDateString()}
					</td>
					<td
						class="py-3 px-4 truncate-cell"
						title={s.reviews?.map((r: any) => r.curator?.name).join(', ') || 'No reviews yet'}
					>
						{#if s.reviews?.length}
							<span class="inline-flex items-center gap-2">
								<span
									class="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-gallery-100 text-gallery-700 rounded-full"
									>{s.reviews.length}</span
								>
								<span class="text-gallery-600"
									>{s.reviews.map((r: any) => r.curator?.name).join(', ')}</span
								>
							</span>
						{:else}
							<span class="text-gallery-400">No reviews yet</span>
						{/if}
					</td>
					<td class="py-3 px-4 text-center">
						<Button variant="secondary" size="sm">
							<a href={`/review/${s._id}`} class="no-underline">Review</a>
						</Button>
					</td>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
</section>

<style>
	.truncate-cell {
		max-width: 180px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
