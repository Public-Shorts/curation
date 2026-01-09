// src/routes/curator/[id]/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const { id } = params;
	// We use the ID from the URL to fetch that specific curator's data
	const curatorId = id;

	// Fetch the curator and only the submissions they have reviewed
	// We join the specific review they left on that submission
	const data = await sanityClient.fetch(
		`{
            "curator": *[_type == "curator" && _id == $curatorId][0]{ _id, name },
            
            // Fetch submissions that have been reviewed by this curator
            // We assume the review references the submission via the 'film' or similar field, 
            // but references(^._id) is safer if the field name varies.
            "reviewedSubmissions": *[_type == "submission" && count(*[_type == "review" && references(^._id) && curator._ref == $curatorId]) > 0] | order(_createdAt desc) {
                _id,
                englishTitle,
                length,
                _createdAt,
                // Get the specific review by this curator for this submission
                "myReview": *[_type == "review" && references(^._id) && curator._ref == $curatorId][0]{
                    _id,
                    selection,
                    rating,
                    _createdAt
                }
            }
        }`,
		{ curatorId }
	);

	if (!data.curator) throw redirect(303, '/curator'); // Handle not found

	const submissions = data.reviewedSubmissions || [];

	// Calculate stats in JavaScript
	const totalReviews = submissions.length;
	const approvedReviews = submissions.filter(
		(s: any) => s.myReview?.selection === 'selected'
	).length;

	// Calculate total minutes (assuming 'length' is in minutes)
	const totalMinutes = submissions.reduce((acc: number, val: any) => acc + (val.length || 0), 0);

	// Format time display (e.g., "12h 30m")
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	const timeDisplay = `${hours}h ${minutes}m`;

	const approvalRate = totalReviews > 0 ? Math.round((approvedReviews / totalReviews) * 100) : 0;

	return {
		curator: data.curator,
		reviews: submissions, // This list is now pre-filtered to only their reviews
		stats: {
			total: totalReviews,
			approved: approvedReviews,
			approvalRate,
			totalMinutes,
			timeDisplay
		}
	};
};
