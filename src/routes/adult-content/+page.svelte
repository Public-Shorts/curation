<script lang="ts">
	import FlagBadge from '$lib/components/ui/FlagBadge.svelte';
	import type { Flag } from '$lib/utils/types';

	let { data } = $props();

	const adultTriggerNotes = [
		'drugAlcoholUse',
		'horrorDisturbingImages',
		'sexualContent',
		'strongLanguage'
	];

	const contentNoteLabels: Record<string, string> = {
		violence: 'Violence',
		sexualContent: 'Sexual Content',
		strongLanguage: 'Strong Language',
		drugAlcoholUse: 'Drug/Alcohol',
		horrorDisturbingImages: 'Horror/Disturbing',
		sensitiveThemes: 'Sensitive Themes'
	};

	type FlagSource = {
		type: 'submission' | 'curator';
		label: string;
		details: string;
	};

	function getFlagSources(submission: any): FlagSource[] {
		const sources: FlagSource[] = [];

		if (submission.explicit) {
			sources.push({
				type: 'submission',
				label: 'Submitter declared explicit',
				details: submission.explicitDetails || 'No details provided'
			});
		}

		// Collect curator flags
		const curatorNotes = new Map<string, string[]>();
		for (const review of submission.reviews || []) {
			for (const note of review.contentNotes || []) {
				if (adultTriggerNotes.includes(note)) {
					if (!curatorNotes.has(note)) curatorNotes.set(note, []);
					curatorNotes.get(note)!.push(review.curatorName || 'Unknown');
				}
			}
		}

		for (const [note, curators] of curatorNotes) {
			sources.push({
				type: 'curator',
				label: contentNoteLabels[note] || note,
				details: `Flagged by ${curators.join(', ')}`
			});
		}

		return sources;
	}

	function getExplicitFlag(submission: any): Flag | null {
		if (!submission.explicit) return null;
		return {
			label: 'EXPLICIT',
			details: submission.explicitDetails || 'Explicit content flagged by submitter.',
			color: 'text-red-700 bg-red-50 border-red-200'
		};
	}

	function getWarningsFlag(submission: any): Flag | null {
		const rawNotes = (submission.reviews || []).flatMap((r: any) => r.contentNotes || []);
		const uniqueNotes = Array.from(new Set(rawNotes)).filter(
			(n) => n && n.toLowerCase() !== 'none'
		);
		if (uniqueNotes.length === 0) return null;
		return {
			label: 'WARNINGS',
			details: uniqueNotes.map((n) => contentNoteLabels[n] || n).join(', '),
			color: 'text-orange-700 bg-orange-50 border-orange-200'
		};
	}

	let filterSource = $state<'all' | 'submission' | 'curator'>('all');
	let tvOnly = $state(true);
	let searchQuery = $state('');

	let tvSelectionSet = $derived(new Set(data.tvSelectionIds));

	let filteredSubmissions = $derived.by(() => {
		let results = data.adultSubmissions;

		if (filterSource === 'submission') {
			results = results.filter((s: any) => s.explicit);
		} else if (filterSource === 'curator') {
			results = results.filter((s: any) => {
				return (s.reviews || []).some((r: any) =>
					r.contentNotes?.some((note: string) => adultTriggerNotes.includes(note))
				);
			});
		}

		if (tvOnly) {
			results = results.filter((s: any) => tvSelectionSet.has(s._id));
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			results = results.filter(
				(s: any) =>
					s.englishTitle?.toLowerCase().includes(q) ||
					s.directorName?.toLowerCase().includes(q)
			);
		}

		return results;
	});

	let submitterFlaggedCount = $derived(
		data.adultSubmissions.filter((s: any) => s.explicit).length
	);

	let curatorFlaggedCount = $derived(
		data.adultSubmissions.filter((s: any) =>
			(s.reviews || []).some((r: any) =>
				r.contentNotes?.some((note: string) => adultTriggerNotes.includes(note))
			)
		).length
	);

	let tvAdultCount = $derived(
		data.adultSubmissions.filter((s: any) => tvSelectionSet.has(s._id)).length
	);
</script>

<div class="container mx-auto max-w-7xl px-6 py-6">
	<div class="space-y-6">
		<!-- Header -->
		<header>
			<div class="flex items-center gap-3 mb-1">
				<h1 class="text-3xl font-bold">Adult Content</h1>
				<span
					class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 rounded-lg"
				>
					Night only
				</span>
			</div>
			<p class="text-gallery-600 text-sm">
				Videos flagged for adult content — scheduled during night hours only ({data
					.adultSubmissions.length}
				total)
			</p>
		</header>

		<!-- Stats row -->
		<div class="flex gap-3">
			<div
				class="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-lg border border-gallery-200 shadow-sm"
			>
				<span class="text-2xl font-black text-gallery-900">{data.adultSubmissions.length}</span>
				<span class="text-xs text-gallery-500 leading-tight">Total<br />flagged</span>
			</div>
			<div
				class="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-lg border border-gallery-200 shadow-sm"
			>
				<span class="text-2xl font-black text-red-600">{submitterFlaggedCount}</span>
				<span class="text-xs text-gallery-500 leading-tight">By<br />submitter</span>
			</div>
			<div
				class="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-lg border border-gallery-200 shadow-sm"
			>
				<span class="text-2xl font-black text-orange-600">{curatorFlaggedCount}</span>
				<span class="text-xs text-gallery-500 leading-tight">By<br />curators</span>
			</div>
			<div
				class="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-lg border border-gallery-200 shadow-sm"
			>
				<span class="text-2xl font-black text-blue-600">{tvAdultCount}</span>
				<span class="text-xs text-gallery-500 leading-tight">In TV<br />selection</span>
			</div>
		</div>

		<!-- Filters -->
		<div class="flex flex-wrap items-center gap-3">
			<div class="flex gap-2">
				<button
					onclick={() => (filterSource = 'all')}
					class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {filterSource ===
					'all'
						? 'bg-gallery-900 text-white'
						: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
				>
					All ({data.adultSubmissions.length})
				</button>
				<button
					onclick={() => (filterSource = 'submission')}
					class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {filterSource ===
					'submission'
						? 'bg-gallery-900 text-white'
						: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
				>
					Submitter flagged ({submitterFlaggedCount})
				</button>
				<button
					onclick={() => (filterSource = 'curator')}
					class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {filterSource ===
					'curator'
						? 'bg-gallery-900 text-white'
						: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
				>
					Curator flagged ({curatorFlaggedCount})
				</button>
			</div>

			<div class="h-6 w-px bg-gallery-200"></div>

			<button
				onclick={() => (tvOnly = !tvOnly)}
				class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {tvOnly
					? 'bg-blue-600 text-white'
					: 'bg-gallery-100 text-gallery-700 hover:bg-gallery-200'}"
			>
				TV Selection only ({tvAdultCount})
			</button>

			<input
				type="text"
				placeholder="Search by title or director..."
				bind:value={searchQuery}
				class="px-3 py-1.5 text-sm border border-gallery-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gallery-900 w-64"
			/>
		</div>

		<!-- Submissions List -->
		<div class="space-y-3">
			{#if filteredSubmissions.length === 0}
				<div class="rounded-lg bg-gallery-50 p-12 text-center">
					<p class="text-gallery-500">
						{#if filterSource !== 'all' || searchQuery.trim() || tvOnly}
							No submissions match this filter.
						{:else}
							No adult-flagged submissions.
						{/if}
					</p>
				</div>
			{:else}
				{#each filteredSubmissions as submission (submission._id)}
					{@const flagSources = getFlagSources(submission)}
					{@const explicitFlag = getExplicitFlag(submission)}
					{@const warningsFlag = getWarningsFlag(submission)}
					{@const inTvSelection = tvSelectionSet.has(submission._id)}
					<div class="bg-white rounded-lg border border-gallery-200 p-4 shadow-sm">
						<div class="flex gap-4">
							<!-- Thumbnail -->
							<div class="h-24 w-32 rounded bg-gallery-100 flex-shrink-0 overflow-hidden">
								{#if submission.poster?.asset}
									<img
										src={`${submission.poster.asset.url}?w=200&h=150&fit=crop`}
										alt={submission.englishTitle}
										class="h-full w-full object-cover"
									/>
								{:else if submission.screenshots?.[0]?.asset}
									<img
										src={`${submission.screenshots[0].asset.url}?w=200&h=150&fit=crop`}
										alt={submission.englishTitle}
										class="h-full w-full object-cover"
									/>
								{:else}
									<div
										class="h-full w-full flex items-center justify-center text-2xl text-gallery-300"
									>
										🎬
									</div>
								{/if}
							</div>

							<!-- Content -->
							<div class="flex-1 min-w-0 space-y-2">
								<!-- Title row -->
								<div>
									<div class="flex items-center gap-2">
										<h3 class="font-bold text-lg text-gallery-900">
											{submission.englishTitle}
										</h3>
										{#if inTvSelection}
											<span
												class="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200 rounded"
											>
												TV
											</span>
										{/if}
									</div>
									<p class="text-sm text-gallery-600">
										{submission.directorName}
										{#if submission.length}
											<span class="text-gallery-300 mx-1.5">&middot;</span>
											<span>{submission.length} min</span>
										{/if}
										{#if submission.categories?.length > 0}
											<span class="text-gallery-300 mx-1.5">&middot;</span>
											<span>{submission.categories.join(', ')}</span>
										{/if}
									</p>
								</div>

								<!-- Flag badges -->
								<div class="flex items-center gap-2">
									{#if explicitFlag}
										<FlagBadge flag={explicitFlag} />
									{/if}
									{#if warningsFlag}
										<FlagBadge flag={warningsFlag} />
									{/if}
								</div>

								<!-- Flag sources breakdown -->
								<div class="flex flex-wrap gap-2">
									{#each flagSources as source}
										<span
											class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border {source.type ===
											'submission'
												? 'bg-red-50 text-red-700 border-red-200'
												: 'bg-orange-50 text-orange-700 border-orange-200'}"
											title={source.details}
										>
											<span class="font-semibold"
												>{source.type === 'submission' ? 'Submitter' : 'Curator'}:</span
											>
											{source.label}
										</span>
									{/each}
								</div>
							</div>

							<!-- Review link -->
							<div class="flex flex-col gap-2 justify-center flex-shrink-0">
								<a
									href="/review/{submission._id}"
									class="px-4 py-2 text-xs font-medium text-white bg-gallery-900 hover:bg-black rounded-lg transition-colors text-center"
								>
									Review
								</a>
								<span class="text-[11px] text-gallery-400 text-center">
									{(submission.reviews || []).length} review{(submission.reviews || [])
										.length !== 1
										? 's'
										: ''}
								</span>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
