import type {PageServerLoad} from './$types';
import {sanityClient} from '$lib/server/sanity';

export const load: PageServerLoad = async ({parent}) => {
	const {isAdmin} = await parent();
	const query = `{
    "metaCategories": *[_type == "metaCategory"] | order(name asc) {
      _id,
      name,
      slug,
      type,
      locked,
      description,
      tags,
      summary,
      lastUpdated,
      "films": films[]{
        score,
        metric,
        "film": film->{
          _id,
          _createdAt,
          englishTitle,
          originalTitle,
          directorName,
          length,
          categories,
          yearOfCompletion,
          synopsis,
          explicit,
          explicitDetails,
          aiUsed,
          aiExplanation,
          country,
          filmLanguage,
          linkToWatch,
          linkToDownload,
          linkPassword,
          "screenshots": screenshots[]{
            asset->{
              _id,
              url
            }
          },
          "poster": poster{
            asset->{
              _id,
              url
            }
          },
          "reviews": *[_type == "review" && film._ref == ^._id]{
            _id,
            selection,
            rating,
            tags,
            contentNotes,
            additionalComments,
            "curatorName": curator->name
          },
          "highlightCount": count(*[_type == "curator" && ^._id in highlights[]._ref])
        }
      }
    },
    "festivalSelection": *[_id == "festivalSelection"][0]{
      "films": films[]{ "filmId": film._ref, selectionScore, festivalRating }
    }
  }`;

	const {metaCategories, festivalSelection} = await sanityClient.fetch(query);

	// Build festival rating lookup
	const festivalRatingMap = new Map<string, number>();
	(festivalSelection?.films || []).forEach((f: any) => {
		if (f.filmId) festivalRatingMap.set(f.filmId, f.festivalRating ?? f.selectionScore);
	});

	// Flatten films (merge score/metric into film object) and sort by score
	const enrichedMetaCategories = metaCategories.map((mc: any) => {
		const films = (mc.films || [])
			.filter((entry: any) => entry.film)
			.map((entry: any) => ({
				...entry.film,
				score: entry.score,
				metric: entry.metric,
				festivalRating: festivalRatingMap.get(entry.film._id),
			}))
			.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

		const filmCount = films.length;
		const totalMinutes = films.reduce((sum: number, f: any) => sum + (f?.length || 0), 0);

		return {
			...mc,
			films,
			filmCount,
			totalMinutes,
			totalHours: Math.floor(totalMinutes / 60),
			totalMins: totalMinutes % 60,
		};
	});

	// Sort by film count ascending (fewest films first)
	enrichedMetaCategories.sort((a: any, b: any) => a.filmCount - b.filmCount);

	// Calculate overall stats from unique films only
	const uniqueFilmsMap = new Map<string, any>();
	for (const mc of enrichedMetaCategories) {
		for (const f of mc.films || []) {
			if (f._id && !uniqueFilmsMap.has(f._id)) {
				uniqueFilmsMap.set(f._id, f);
			}
		}
	}
	const uniqueFilmsTotalMinutes = Array.from(uniqueFilmsMap.values()).reduce(
		(sum: number, f: any) => sum + (f.length || 0),
		0
	);

	const stats = {
		totalMetaCategories: enrichedMetaCategories.length,
		totalUniqueFilms: uniqueFilmsMap.size,
		totalMinutes: uniqueFilmsTotalMinutes,
	};

	return {
		metaCategories: enrichedMetaCategories,
		stats,
		isAdmin,
	};
};
