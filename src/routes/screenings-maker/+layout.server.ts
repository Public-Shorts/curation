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
			"synopsis": pt::text(synopsis),
			country,
			filmLanguage,
			poster { asset->{_id, url} },
			screenshots[] { asset->{_id, url} },
			length,
			linkToWatch,
			linkToDownload,
			linkPassword,
			"reviews": *[_type == "review" && film._ref == ^._id] {
				selection,
				rating,
				tags,
				additionalComments,
				contentNotes,
				"curatorName": curator->name
			}
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
			juryMembers[]->{_id, name, email},
			"films": films[]{ _ref }
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
			maybeThreshold,
			vetoedSubmissions
		}
	`);

	const [submissions, screenings, curators, festivalSettings] = await Promise.all([
		submissionsPromise,
		screeningsPromise,
		curatorsPromise,
		festivalSettingsPromise
	]);

	// Identify vetoed submissions
	const vetoedIds = new Set<string>();
	if (festivalSettings?.vetoedSubmissions) {
		festivalSettings.vetoedSubmissions.forEach((v: any) => {
			if (v.submission?._ref) {
				vetoedIds.add(v.submission._ref);
			}
		});
	}

	// Filter submissions
	const filteredSubmissions = (submissions as any[]).filter(
		(s: any) => !vetoedIds.has(s._id)
	);

	// Filter selection data
	if (selectionData) {
		selectionData.highlights = selectionData.highlights.filter(
			(f: any) => !vetoedIds.has(f._id)
		);
		selectionData.unanimous = selectionData.unanimous.filter(
			(f: any) => !vetoedIds.has(f._id)
		);
		selectionData.selected = selectionData.selected.filter(
			(f: any) => !vetoedIds.has(f._id)
		);
		selectionData.maybe = selectionData.maybe.filter((f: any) => !vetoedIds.has(f._id));
	}

	// Filter clusters
	const filteredClusters = ((clustersData as any).clusters || []).map((c: any) => ({
		...c,
		highlightedMovieIds: c.highlightedMovieIds?.filter((id: string) => !vetoedIds.has(id)) || [],
		relevantMovieIds: c.relevantMovieIds?.filter((id: string) => !vetoedIds.has(id)) || []
	}));

	// Build a map of submission ID -> curator tags
	const submissionTags: Record<string, string[]> = {};

	// Iterate through submissions to extract tags from their reviews
	filteredSubmissions.forEach((submission: any) => {
		if (submission.reviews && Array.isArray(submission.reviews)) {
			// Flatten tags from all reviews for this submission
			const tags = submission.reviews.flatMap((review: any) => {
				if (!review.tags) return [];
				return Array.isArray(review.tags)
					? review.tags.map((t: any) => (typeof t === 'string' ? t : t.label || t.value)).filter(Boolean)
					: [];
			}) as string[];
			if (tags.length > 0) {
				submissionTags[submission._id] = [...new Set(tags)];
			}
		}
	});

	// Count how many curators highlighted each movie
	const highlightCounts: Record<string, number> = {};
	for (const curator of curators as any[]) {
		for (const h of curator.highlights || []) {
			if (h?._id && !vetoedIds.has(h._id)) {
				highlightCounts[h._id] = (highlightCounts[h._id] || 0) + 1;
			}
		}
	}

	return {
		submissions: filteredSubmissions.map((s: any) => ({
			...s,
			isHighlighted: (highlightCounts[s._id] || 0) > 0,
			highlightCount: highlightCounts[s._id] || 0,
			curatorTags: submissionTags[s._id] || []
		})),
		screenings,
		selectionData,  // Add selection data for film organization
		suggestions: suggestions as Record<string, string[]>,
		clusters: filteredClusters,
		settings: {
			selectedThreshold: festivalSettings?.selectedThreshold ?? 60,
			maybeThreshold: festivalSettings?.maybeThreshold ?? 35
		},
		curatorsList: (curators as any[]).filter((c) => c.jury),
		isDev: dev
	};
};
