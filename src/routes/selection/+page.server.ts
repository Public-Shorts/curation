import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import data from '$lib/data/clusters.json';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch curator jury status
	let isJury = false;
	if (locals.curatorId) {
		const curator = await sanityClient.fetch(
			`*[_type == "curator" && _id == $curatorId][0]{jury}`,
			{ curatorId: locals.curatorId }
		);
		isJury = curator?.jury || false;
	}

	// Load selection data with fallback if file doesn't exist
	let selectionData = {
		lastUpdated: null,
		summary: '',
		highlights: [],
		unanimous: [],
		selected: [],
		maybe: []
	};
	try {
		const module = await import('$lib/data/selection.json');
		selectionData = module.default;
	} catch (e) {
		console.warn('selection.json not found - run npm run update-selection');
	}

	// Fetch full submission data with reviews for dialog (if jury)
	let submissionsWithReviews: Record<string, any> = {};
	if (isJury) {
		const allIds = [
			...selectionData.highlights.map((f: any) => f._id),
			...(selectionData.unanimous || []).map((f: any) => f._id),
			...selectionData.selected.map((f: any) => f._id),
			...selectionData.maybe.map((f: any) => f._id)
		];
		if (allIds.length > 0) {
			const submissions = await sanityClient.fetch(
				`*[_type == "submission" && _id in $ids]{
					_id,
					englishTitle,
					directorName,
					length,
					synopsis,
					filmLanguage,
					categories,
					"poster": poster{ asset->{ _id, url } },
					"screenshots": screenshots[]{ asset->{ _id, url } },
					linkToWatch,
					linkToDownload,
					"reviews": *[_type == "review" && film._ref == ^._id]{
						_id,
						selection,
						rating,
						tags,
						comment,
						contentNotes,
						"curatorName": curator->name
					}
				}`,
				{ ids: allIds }
			);
			submissions.forEach((sub: any) => {
				submissionsWithReviews[sub._id] = sub;
			});
		}
	}

	// Filter clusters to have at least 1 movie (or keep as is)
	const movies = data.movies as Record<string, any>;
    const formattedClusters = data.clusters
        .map((c: any) => {
            const highlightedMovies = c.highlightedMovieIds.map((id: string) => movies[id]).filter(Boolean);
            const relevantMovies = c.relevantMovieIds.map((id: string) => movies[id]).filter(Boolean);

            const allMovies = [...highlightedMovies, ...relevantMovies];

            const highlightedMinutes = highlightedMovies.reduce((sum: number, m: any) => sum + (m.length || 0), 0);
            const relevantMinutes = relevantMovies.reduce((sum: number, m: any) => sum + (m.length || 0), 0);
            const totalMinutes = allMovies.reduce((sum: number, m: any) => sum + (m.length || 0), 0);

            return {
                ...c,
                highlightedMovies,
                relevantMovies,
                count: allMovies.length,
                highlightedMinutes,
                relevantMinutes,
                totalMinutes,
                totalHours: Math.floor(totalMinutes / 60),
                totalMins: totalMinutes % 60
            };
        })
        .filter((c: any) => c.highlightedMovies.length > 0) // Only show clusters with at least one highlight
        .sort((a: any, b: any) => b.count - a.count);

    // Calculate total videos in clusters
    const totalVideosInClusters = new Set(formattedClusters.flatMap((c: any) => [
        ...c.highlightedMovies.map((m: any) => m._id),
        ...c.relevantMovies.map((m: any) => m._id)
    ])).size;

    // Get unique highlighted films in clusters
    const uniqueHighlightedInClusters = new Set(
        formattedClusters.flatMap((c: any) => c.highlightedMovies.map((m: any) => m._id))
    ).size;

    // Query Sanity for total highlights count
    const totalHighlights = await sanityClient.fetch<number>(
        `count(*[_type == "curator" && defined(highlights)].highlights[])`
    );

    const stats = {
        totalClusters: formattedClusters.length,
        avgCategorySize: formattedClusters.length > 0
            ? Math.round(totalVideosInClusters / formattedClusters.length)
            : 0,
        highlightCoverage: totalHighlights > 0
            ? Math.round((uniqueHighlightedInClusters / totalHighlights) * 100)
            : 0
    };

	return {
		// Selection data
		summary: selectionData.summary,
		highlights: selectionData.highlights,
		unanimous: selectionData.unanimous || [],
		selected: selectionData.selected,
		maybe: selectionData.maybe,
		selectionLastUpdated: selectionData.lastUpdated,

		// Clusters data (existing)
		clusters: formattedClusters,
		stats,
		lastUpdated: data.lastUpdated,

		// Jury mode
		isJury,
		submissionsWithReviews,

		// Dev mode flag
		isDev: dev
	};
};
