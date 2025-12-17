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
        
        // Fetch reviews to calculate stats
        "reviews": *[_type == "review" && film._ref == ^._id]{
            selection, 
            rating // Assuming you have a 1-10 rating field. If not, remove this.
        }
      }
    }`;

	const data = await sanityClient.fetch(query);

	// Process data to calculate stats per film
	const movies = data.submissions.map((s: any) => {
		const reviews = s.reviews || [];
		const totalReviews = reviews.length;

		// Calculate Approval Rate (Percentage of "selected")
		const selectedCount = reviews.filter((r: any) => r.selection === 'selected').length;
		const approvalRate = totalReviews > 0 ? (selectedCount / totalReviews) * 100 : 0;

		// Calculate Average Rating (if rating field exists)
		// If rating is missing, we default to 0.
		const totalRating = reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 0), 0);
		const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

		// Flatten categories for easier filtering
		const allCategories = [
			...(s.categories || []),
			...(s.categories?.includes('other') && s.categoryOther ? [s.categoryOther] : [])
		].filter((c) => c !== 'other'); // Remove generic 'other' string if specific exists

		return {
			...s,
			reviewsCount: totalReviews,
			approvalRate,
			averageRating,
			displayCategories: allCategories
		};
	});

	// Extract all unique tags/categories for the filter UI
	const allTags = Array.from(new Set(movies.flatMap((m: any) => m.displayCategories))).sort();

	return {
		movies,
		allTags
	};
};
