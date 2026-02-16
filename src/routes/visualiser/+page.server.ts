import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const query = `{
		"festivalSelection": *[_id == "festivalSelection"][0]{
			"filmIds": films[].film._ref
		},
		"films": *[_type == "submission"] {
			_id,
			_createdAt,
			englishTitle,
			originalTitle,
			directorName,
			length,
			categories,
			country,
			filmLanguage,
			synopsis,
			linkToWatch,
			linkToDownload,
			linkPassword,
			"poster": poster{ asset->{ _id, url } },
			"screenshots": screenshots[]{ asset->{ _id, url } },
			"reviews": *[_type == "review" && film._ref == ^._id] {
				selection,
				rating,
				tags,
				contentNotes,
				additionalComments,
				"curatorId": curator._ref,
				"curatorName": curator->name
			}
		},
		"metaCategories": *[_type == "metaCategory"] | order(name asc) {
			_id,
			name,
			description,
			type,
			"filmIds": films[] {
				"filmId": film._ref,
				score
			}
		},
		"clusters": *[_type == "semanticCluster"] | order(name asc) {
			_id,
			name,
			description,
			keywords,
			"highlightedFilmIds": highlightedFilms[]._ref,
			"relevantFilmIds": relevantFilms[]._ref
		},
		"jurySelections": *[_type == "jurySelection"] | order(savedAt desc) {
			_id,
			name,
			savedAt,
			filterMode,
			activeFilmCount,
			"savedByName": savedBy->name
		}
	}`;

	const result = await sanityClient.fetch(query);

	// Only keep films in the festival selection
	const selectedFilmIds = new Set<string>(result.festivalSelection?.filmIds || []);

	const films = (result.films || [])
		.filter((film: any) => selectedFilmIds.has(film._id))
		.map((film: any) => {
			const reviews = film.reviews || [];

			let sum = 0;
			let count = 0;
			const tagSet = new Set<string>();

			for (const r of reviews) {
				if (r.selection === 'selected') {
					sum += 1;
				} else if (r.selection === 'maybe') {
					sum += 0.5;
				}
				count++;

				for (const t of r.tags || []) {
					const label = typeof t === 'string' ? t : t.label || t.value;
					if (label) tagSet.add(label);
				}
			}

			const score = count > 0 ? (sum / count) * 100 : 0;

			return {
				_id: film._id,
				_createdAt: film._createdAt,
				englishTitle: film.englishTitle || film.originalTitle || 'Untitled',
				directorName: film.directorName || 'Unknown',
				length: film.length || 0,
				score: Math.round(score * 10) / 10,
				tags: [...tagSet],
				poster: film.poster || null,
				screenshots: film.screenshots || [],
				reviews,
				country: film.country,
				filmLanguage: film.filmLanguage,
				synopsis: film.synopsis,
				linkToWatch: film.linkToWatch,
				linkToDownload: film.linkToDownload,
				linkPassword: film.linkPassword,
			};
		});

	const metaCategories = (result.metaCategories || []).map((mc: any) => ({
		_id: mc._id,
		name: mc.name,
		description: mc.description || '',
		type: mc.type || 'auto',
		filmIds: (mc.filmIds || []).filter((e: any) => e.filmId && selectedFilmIds.has(e.filmId)),
	}));

	const clusters = (result.clusters || []).map((c: any) => ({
		_id: c._id,
		name: c.name,
		description: c.description || '',
		keywords: c.keywords || [],
		highlightedFilmIds: (c.highlightedFilmIds || []).filter((id: string) => selectedFilmIds.has(id)),
		relevantFilmIds: (c.relevantFilmIds || []).filter((id: string) => selectedFilmIds.has(id)),
	}));

	return { films, metaCategories, clusters, jurySelections: result.jurySelections || [] };
};
