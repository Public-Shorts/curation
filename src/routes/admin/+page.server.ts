import type {PageServerLoad} from './$types';
import {sanityClient} from '$lib/server/sanity';
import {redirect} from '@sveltejs/kit';
import {dev} from '$app/environment';
import clustersData from '$lib/data/clusters.json';

export const load: PageServerLoad = async ({parent, locals}) => {
	const {isAdmin} = await parent();

	if (!isAdmin) {
		throw redirect(302, '/');
	}

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

	// Fetch all manual meta-categories
	const metaCategoriesPromise = sanityClient.fetch(`
		*[_type == "metaCategory" && type == "manual"] | order(name asc) {
			_id,
			name,
			slug,
			description,
			locked,
			tags,
			summary,
			films[]->{_id}
		}
	`);

	// Fetch curators
	const curatorsPromise = sanityClient.fetch(`
		*[_type == "curator"] | order(name asc) {
			_id,
			name,
			email,
			jury,
			highlights[]->{_id}
		}
	`);

	// Fetch festival settings (for veto data and thresholds)
	const festivalSettingsPromise = sanityClient.fetch(`
		*[_type == "festivalSettings"][0] {
			selectedThreshold,
			maybeThreshold,
			vetoedSubmissions[] {
				_key,
				vetoedFromCinema,
				vetoedFromTV,
				reason,
				vetoedAt,
				"vetoedBy": vetoedBy->{_id, name},
				"submission": submission->{
					_id,
					englishTitle,
					directorName,
					length,
					categories,
					synopsis,
					"poster": poster{asset->{url}},
					"screenshots": screenshots[]{asset->{url}}
				}
			}
		}
	`);

	// Load selection data
	let selectionData: {
		highlights: any[];
		unanimous: any[];
		selected: any[];
		maybe: any[];
	} = {
		highlights: [],
		unanimous: [],
		selected: [],
		maybe: [],
	};
	try {
		const module = await import('$lib/data/selection.json');
		selectionData = module.default;
	} catch (e) {
		console.warn('selection.json not found - films will not be organized by priority');
	}

	const [submissions, metaCategories, curators, festivalSettings] = await Promise.all([
		submissionsPromise,
		metaCategoriesPromise,
		curatorsPromise,
		festivalSettingsPromise,
	]);

	// Identify vetoed submissions
	const vetoedIds = new Set<string>();
	if (festivalSettings?.vetoedSubmissions) {
		festivalSettings.vetoedSubmissions.forEach((v: any) => {
			if (v.submission?._ref || v.submission?._id) {
				vetoedIds.add(v.submission._ref || v.submission._id);
			}
		});
	}

	// Filter submissions (for manual meta-categories)
	const filteredSubmissions = (submissions as any[]).filter((s: any) => !vetoedIds.has(s._id));

	// Create a map of filmId -> metaCategoryIds
	const filmToMetaCategoryMap = new Map<string, Set<string>>();
	metaCategories.forEach((mc: any) => {
		mc.films?.forEach((film: any) => {
			if (!filmToMetaCategoryMap.has(film._id)) {
				filmToMetaCategoryMap.set(film._id, new Set());
			}
			filmToMetaCategoryMap.get(film._id)!.add(mc._id);
		});
	});

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
		highlightedMovieIds:
			c.highlightedMovieIds?.filter((id: string) => !vetoedIds.has(id)) || [],
		relevantMovieIds: c.relevantMovieIds?.filter((id: string) => !vetoedIds.has(id)) || [],
	}));

	// Build submission tags map
	const submissionTags: Record<string, string[]> = {};
	filteredSubmissions.forEach((submission: any) => {
		if (submission.reviews && Array.isArray(submission.reviews)) {
			const tags = submission.reviews.flatMap((review: any) => {
				if (!review.tags) return [];
				return Array.isArray(review.tags)
					? review.tags
							.map((t: any) => (typeof t === 'string' ? t : t.label || t.value))
							.filter(Boolean)
					: [];
			}) as string[];
			if (tags.length > 0) {
				submissionTags[submission._id] = [...new Set(tags)];
			}
		}
	});

	// Count highlights per film
	const highlightCounts: Record<string, number> = {};
	for (const curator of curators as any[]) {
		for (const h of curator.highlights || []) {
			if (h?._id && !vetoedIds.has(h._id)) {
				highlightCounts[h._id] = (highlightCounts[h._id] || 0) + 1;
			}
		}
	}

	// Vetoed submissions (for the veto tab)
	const vetoedSubmissions = (festivalSettings?.vetoedSubmissions || []).filter(
		(v: any) => v.submission !== null
	);

	return {
		submissions: filteredSubmissions.map((s: any) => ({
			...s,
			isHighlighted: (highlightCounts[s._id] || 0) > 0,
			highlightCount: highlightCounts[s._id] || 0,
			curatorTags: submissionTags[s._id] || [],
			assignedMetaCategories: Array.from(filmToMetaCategoryMap.get(s._id) || []),
		})),
		metaCategories,
		selectionData,
		clusters: filteredClusters,
		settings: {
			selectedThreshold: festivalSettings?.selectedThreshold ?? 65,
			maybeThreshold: festivalSettings?.maybeThreshold ?? 35,
		},
		vetoedSubmissions,
		isAdmin,
		isDev: dev,
	};
};
