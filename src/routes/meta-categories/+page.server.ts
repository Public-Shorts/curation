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
      "films": films[]->{
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
          "curatorName": curator->name
        }
      }
    }
  }`;

	const {metaCategories} = await sanityClient.fetch(query);

	// Calculate stats for each meta-category
	const enrichedMetaCategories = metaCategories.map((mc: any) => {
		const filmCount = mc.films?.length || 0;
		const totalMinutes = mc.films?.reduce((sum: number, film: any) => sum + (film?.length || 0), 0) || 0;

		return {
			...mc,
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
