import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const query = `{
      "leaderboard": *[_type == "curator"]|order(name asc){
        _id,
        name,
        "total": count(*[_type == "review" && curator._ref == ^._id]),
        "selected": count(*[_type == "review" && curator._ref == ^._id && selection == "selected"])
      },
      "overall": {
        "total": count(*[_type == "review"]),
        "selected": count(*[_type == "review" && selection == "selected"]),
        "maybe": count(*[_type == "review" && selection == "maybe"]),
        "rejected": count(*[_type == "review" && selection == "notSelected"])
      },
      "submissions": *[_type == "submission"]{
        categories,
        categoryOther
      }
    }`;

	const data = await sanityClient.fetch(query);

	// Process Leaderboard: add approval rate
	const leaderboard = data.leaderboard
		.map((c: any) => ({
			...c,
			approvalRate: c.total > 0 ? (c.selected / c.total) * 100 : 0
		}))
		.sort((a: any, b: any) => b.total - a.total); // Rank by total reviews by default

	// Process Categories
	const categoryCounts: Record<string, number> = {};
	data.submissions.forEach((s: any) => {
		const cats = s.categories || [];
		// If "other" is in the list, try to use the specific text, or just count "Other"
		// Adjust logic based on preference. Here I'll count all standard categories
		// and group specific "other" inputs if needed, or just count "Other" generically.
		// Assuming standard behavior: count each string in the array.
		cats.forEach((cat: string) => {
			// clean up string if needed (e.g. lowercase)
			const key = cat === 'other' && s.categoryOther ? 'Other (' + s.categoryOther + ')' : cat;
			// OR simpler: just use the raw category strings and group 'other' separately if desired.
			// Let's stick to the raw strings for consistency with the form.
			categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
		});
	});

	// Convert categoryCounts to sorted array
	const categoriesStats = Object.entries(categoryCounts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);

	return {
		leaderboard,
		overall: {
			...data.overall,
			approvalRate: data.overall.total > 0 ? (data.overall.selected / data.overall.total) * 100 : 0
		},
		categoriesStats
	};
};
