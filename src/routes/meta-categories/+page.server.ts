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
      "films": films[]{ "filmId": film._ref, selectionScore }
    }
  }`;

	const {metaCategories, festivalSelection} = await sanityClient.fetch(query);

	// Build selection score lookup
	const selectionScoreMap = new Map<string, number>();
	(festivalSelection?.films || []).forEach((f: any) => {
		if (f.filmId) selectionScoreMap.set(f.filmId, f.selectionScore);
	});

	// Flatten films (merge score/metric into film object) and sort by score
	const enrichedMetaCategories = metaCategories.map((mc: any) => {
		const films = (mc.films || [])
			.filter((entry: any) => entry.film)
			.map((entry: any) => ({
				...entry.film,
				score: entry.score,
				metric: entry.metric,
				selectionScore: selectionScoreMap.get(entry.film._id),
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

	// Calculate overall stats
	const stats = {
		totalMetaCategories: enrichedMetaCategories.length,
		totalFilms: enrichedMetaCategories.reduce((sum: number, mc: any) => {
			const uniqueFilms = new Set(mc.films?.map((f: any) => f._id) || []);
			return sum + uniqueFilms.size;
		}, 0),
		totalUniqueFilms: new Set(
			enrichedMetaCategories.flatMap((mc: any) => mc.films?.map((f: any) => f._id) || [])
		).size,
		totalMinutes: enrichedMetaCategories.reduce(
			(sum: number, mc: any) => sum + (mc.totalMinutes || 0),
			0
		),
	};

	stats.totalHours = Math.floor(stats.totalMinutes / 60);
	stats.totalMins = stats.totalMinutes % 60;

	return {
		metaCategories: enrichedMetaCategories,
		stats,
		isAdmin,
	};
};
