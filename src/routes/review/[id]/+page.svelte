<!-- src/routes/review/[id]/+page.svelte -->
<script lang="ts">
	import ReviewForm from '$lib/components/form/ReviewForm.svelte';
	import ReviewStatusCard from '$lib/components/form/ReviewStatusCard.svelte';
	import SubmissionHeader from '$lib/components/form/SubmissionHeader.svelte';
	import SubmissionTechnicalInfos from '$lib/components/form/SubmissionTechnicalInfos.svelte';
	import SumbissionCredits from '$lib/components/form/SumbissionCredits.svelte';

	import type { Tag } from '$lib/utils/types.js';

	let { data } = $props();
	const submission = data.submission;
	const review = data.myReview ?? {};
	const allReviews = data.allReviews ?? [];
	const highlightedBy = data.highlightedBy ?? [];

	const allTags: Tag[] = $derived.by(() => {
		const raw = (data.allTags ?? []) as Tag[];

		const map = new Map<string, Tag>();
		for (const tag of raw) {
			if (!map.has(tag.value)) {
				map.set(tag.value, tag);
			}
		}

		return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
	});
</script>

<div class="max-w-4xl mx-auto space-y-10 p-4 sm:p-6 lg:p-8">
	<!-- Header Section -->
	<SubmissionHeader {submission} {highlightedBy} />

	<!-- Other Curators Card -->
	<ReviewStatusCard {allReviews} />

	<!-- Info Grid -->
	<SumbissionCredits {submission} />

	<!-- Synopsis & Technical -->
	<SubmissionTechnicalInfos {submission} />

	<!-- Review Form -->
	<ReviewForm {review} {allTags} {submission} />
</div>
