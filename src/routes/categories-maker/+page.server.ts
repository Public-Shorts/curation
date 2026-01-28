import { sanityClient } from '$lib/server/sanity';
import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import suggestions from '$lib/data/suggestions.json';

export const load: PageServerLoad = async () => {
	// Fetch all submissions
	const submissionsPromise = sanityClient.fetch(`
		*[_type == "submission"] {
			_id,
			englishTitle,
			directorName,
			synopsis,
			poster { asset->{_id, url} },
			screenshots[] { asset->{_id, url} },
			length,
			assignedCategory,
			linkToWatch
		}
	`);

	// Fetch all categories
	const clustersPromise = sanityClient.fetch(`
		*[_type == "category"] {
			_id,
			name,
			description
		}
	`);

	// Fetch highlights from curators
	const curatorsPromise = sanityClient.fetch(`
		*[_type == "curator"] {
			highlights[]->{_id}
		}
	`);

	// Fetch all reviews with curator tags
	const reviewsPromise = sanityClient.fetch(`
		*[_type == "review" && defined(tags)] {
			film->{_id},
			tags
		}
	`);

	const [submissions, clusters, curators, reviews] = await Promise.all([
		submissionsPromise,
		clustersPromise,
		curatorsPromise,
		reviewsPromise
	]);

	// Build a map of submission ID -> curator tags
	const submissionTags: Record<string, string[]> = {};
	for (const review of reviews as any[]) {
		if (!review.film?._id || !review.tags) continue;
		const filmId = review.film._id;
		const tags = Array.isArray(review.tags)
			? review.tags.map((t: any) => (typeof t === 'string' ? t : t.label || t.value)).filter(Boolean)
			: [];
		if (!submissionTags[filmId]) submissionTags[filmId] = [];
		submissionTags[filmId].push(...tags);
	}

	// Dedupe tags per submission
	for (const id of Object.keys(submissionTags)) {
		submissionTags[id] = [...new Set(submissionTags[id])];
	}

	// Identify highlighted movie IDs
	const highlightedIds = new Set(
		(curators as any[]).flatMap((c: any) => c.highlights?.map((h: any) => h._id) || [])
	);

	return {
		submissions: (submissions as any[]).map((s: any) => ({
			...s,
			isHighlighted: highlightedIds.has(s._id),
			curatorTags: submissionTags[s._id] || []
		})),
		clusters,
		suggestions: suggestions as Record<string, string[]>,
		isDev: dev
	};
};
