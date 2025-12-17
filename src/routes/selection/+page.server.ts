import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const query = `{
      "submissions": *[_type == "submission"]|order(englishTitle asc){
        _id,
        englishTitle,
        filmLanguage,
        length,
        categories,
        categoryOther,
        _createdAt,
        
        "reviews": *[_type == "review" && film._ref == ^._id]{
            selection, 
            rating,
            tags
        }
      }
    }`;

	const data = await sanityClient.fetch(query);

	const movies = data.submissions.map((s: any) => {
		const reviews = s.reviews || [];
		const totalReviews = reviews.length;

		const selectedCount = reviews.filter((r: any) => r.selection === 'selected').length;
		const approvalRate = totalReviews > 0 ? (selectedCount / totalReviews) * 100 : 0;
		const totalRating = reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
		const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

		const displayCategories = [
			...(s.categories || []),
			...(s.categories?.includes('other') && s.categoryOther ? [s.categoryOther] : [])
		].filter((c) => c !== 'other');

		// FIXED: Extract the 'label' from the tag objects
		const curatorTags = Array.from(
			new Set(
				reviews.flatMap(
					(r: any) => (r.tags || []).map((t: any) => t.label || t) // Handle object or string
				)
			)
		)
			.filter((t) => typeof t === 'string')
			.sort();

		return {
			...s,
			reviewsCount: totalReviews,
			approvalRate,
			averageRating,
			displayCategories,
			curatorTags
		};
	});

	const allCategories = Array.from(new Set(movies.flatMap((m: any) => m.displayCategories))).sort();
	const allCuratorTags = Array.from(new Set(movies.flatMap((m: any) => m.curatorTags))).sort();

	return {
		movies,
		allCategories,
		allCuratorTags
	};
};
