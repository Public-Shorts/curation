<script lang="ts">
	type FlaggedItem = {
		id: string;
		title: string;
		curator: string;
	};

	type FlaggedStat = {
		reason: string;
		items: FlaggedItem[];
	};

	let { flaggedStats }: { flaggedStats: FlaggedStat[] } = $props();

	let totalFlags = $derived(
		flaggedStats.reduce((acc, curr) => acc + curr.items.length, 0)
	);
</script>

<section class="space-y-6 lg:col-span-6">
			<header class="flex items-center justify-between">
				<h2 class="text-2xl font-semibold text-red-700">Flagged Content Index</h2>
				<p class="text-sm text-gray-500">
					{totalFlags} flags
				</p>
			</header>

			{#if flaggedStats.length === 0}
				<div class="rounded-lg bg-gray-50 p-8 text-center border border-dashed border-gray-200">
					<p class="text-gray-500">No content has been flagged yet.</p>
				</div>
			{:else}
				<div class="grid gap-6 md:grid-cols-2">
					{#each flaggedStats as { reason, items }}
						<div class="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5 overflow-hidden h-fit">
							<div
								class="bg-red-50/50 px-4 py-3 border-b border-red-100 flex justify-between items-center"
							>
								<h3 class="text-sm font-semibold text-red-900">{reason}</h3>
								<span
									class="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-500/10"
								>
									{items.length}
								</span>
							</div>
							<table class="min-w-full table-fixed divide-y divide-gray-100">
								<tbody class="divide-y divide-gray-100 bg-white">
									{#each items as item}
										<tr class="hover:bg-gray-50 transition-colors group">
											<td class="w-full max-w-0 py-3 pl-4 pr-2 align-middle">
												<a
													href={`/review/${item.id}`}
													class="block text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate"
													title={item.title}
												>
													{item.title}
												</a>
											</td>
											<td class="whitespace-nowrap py-3 pr-4 pl-2 text-right align-middle">
												<span class="text-[10px] text-gray-400">by {item.curator}</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/each}
				</div>
			{/if}
		</section>