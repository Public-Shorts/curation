import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import data from '$lib/data/clusters.json';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch curator jury status and vetoed submissions
	let isJury = false;
	let vetoedIds = new Set<string>();

	if (locals.curatorId) {
		const curator = await sanityClient.fetch(
			`*[_type == "curator" && _id == $curatorId][0]{jury}`,
			{ curatorId: locals.curatorId }
		);
		isJury = curator?.jury || false;
	}

	// Fetch vetoed submissions
	const settings = await sanityClient.fetch(
		`*[_type == "festivalSettings"][0]{ vetoedSubmissions }`
	);
	if (settings?.vetoedSubmissions) {
		settings.vetoedSubmissions.forEach((v: any) => {
			if (v.submission?._ref) {
				vetoedIds.add(v.submission._ref);
			}
		});
	}

	// Load selection data with fallback if file doesn't exist
	let selectionData: {
		lastUpdated: string | null;
		summary: string;
		highlights: any[];
		unanimous: any[];
		selected: any[];
		maybe: any[];
	} = {
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

	// Filter selection data
	const highlights = selectionData.highlights.filter((f: any) => !vetoedIds.has(f._id));
	const unanimous = (selectionData.unanimous || []).filter((f: any) => !vetoedIds.has(f._id));
	const selected = selectionData.selected.filter((f: any) => !vetoedIds.has(f._id));
	const maybe = selectionData.maybe.filter((f: any) => !vetoedIds.has(f._id));

	// Fetch full submission data with reviews for dialog (for all users)
	let submissionsWithReviews: Record<string, any> = {};
	const allIds = [
		...highlights.map((f: any) => f._id),
		...unanimous.map((f: any) => f._id),
		...selected.map((f: any) => f._id),
		...maybe.map((f: any) => f._id)
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
				country,
				"poster": poster{ asset->{ _id, url } },
				"screenshots": screenshots[]{ asset->{ _id, url } },
				linkToWatch,
				linkToDownload,
				linkPassword,
				"reviews": *[_type == "review" && film._ref == ^._id]{
					_id,
					selection,
					rating,
					tags,
					additionalComments,
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

	// Filter clusters to have at least 1 movie (or keep as is)
	const movies = data.movies as Record<string, any>;
	const formattedClusters = data.clusters
		.map((c: any) => {
			const highlightedMovies = c.highlightedMovieIds
				.filter((id: string) => !vetoedIds.has(id))
				.map((id: string) => movies[id])
				.filter(Boolean);

			const relevantMovies = c.relevantMovieIds
				.filter((id: string) => !vetoedIds.has(id))
				.map((id: string) => movies[id])
				.filter(Boolean);

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
		highlights,
		unanimous,
		selected,
		maybe,
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
