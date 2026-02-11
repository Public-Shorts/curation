import { sanityClient } from '$lib/server/sanity';
import type { LayoutServerLoad } from './$types';
import { dev } from '$app/environment';
import suggestions from '$lib/data/suggestions.json';
import clustersData from '$lib/data/clusters.json';

export const load: LayoutServerLoad = async () => {
	// Fetch all submissions
	const submissionsPromise = sanityClient.fetch(`
		*[_type == "submission"] {
			_id,
			englishTitle,
			directorName,
			synopsis,
			country,
			filmLanguage,
			poster { asset->{_id, url} },
			screenshots[] { asset->{_id, url} },
			length,
			assignedScreening,
			linkToWatch,
			linkToDownload,
			linkPassword
		}
	`);

	// Fetch all screenings
	const screeningsPromise = sanityClient.fetch(`
		*[_type == "screening"] | order(date desc) {
			_id,
			title,
			date,
			location,
			description,
			keywords,
			juryMembers[]->{_id, name, email}
		}
	`);

	// Fetch highlights from curators and curator details
	const curatorsPromise = sanityClient.fetch(`
		*[_type == "curator"] | order(name asc) {
			_id,
			name,
			email,
			jury,
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

	// Load selection data for film organization
	let selectionData: {
		highlights: any[];
		unanimous: any[];
		selected: any[];
		maybe: any[];
	} = {
		highlights: [],
		unanimous: [],
		selected: [],
		maybe: []
	};
	try {
		const module = await import('$lib/data/selection.json');
		selectionData = module.default;
	} catch (e) {
		console.warn('selection.json not found - films will not be organized by priority');
	}

	// Fetch festival settings for thresholds
	const festivalSettingsPromise = sanityClient.fetch(`
		*[_type == "festivalSettings"][0] {
			selectedThreshold,
			maybeThreshold
		}
	`);

	const [submissions, screenings, curators, reviews, festivalSettings] = await Promise.all([
		submissionsPromise,
		screeningsPromise,
		curatorsPromise,
		reviewsPromise,
		festivalSettingsPromise
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

	// Count how many curators highlighted each movie
	const highlightCounts: Record<string, number> = {};
	for (const curator of curators as any[]) {
		for (const h of curator.highlights || []) {
			if (h?._id) {
				highlightCounts[h._id] = (highlightCounts[h._id] || 0) + 1;
			}
		}
	}

	return {
		submissions: (submissions as any[]).map((s: any) => ({
			...s,
			isHighlighted: (highlightCounts[s._id] || 0) > 0,
			highlightCount: highlightCounts[s._id] || 0,
			curatorTags: submissionTags[s._id] || []
		})),
		screenings,
		selectionData,  // Add selection data for film organization
		suggestions: suggestions as Record<string, string[]>,
		clusters: (clustersData as any).clusters || [],
		settings: {
			selectedThreshold: festivalSettings?.selectedThreshold ?? 65,
			maybeThreshold: festivalSettings?.maybeThreshold ?? 35
		},
		curatorsList: (curators as any[]).filter((c) => c.jury),
		isDev: dev
	};
};
