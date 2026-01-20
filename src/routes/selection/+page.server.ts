// src/routes/selection/+page.server.ts
import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const query = `{
	  "submissions": *[_type == "submission"]|order(englishTitle asc){
		_id,
		englishTitle,
        directorName,
        poster,
		length,
		_createdAt,
		
		"reviews": *[_type == "review" && film._ref == ^._id]{
            _id,
			selection, 
			rating,
            "curatorId": curator._ref,
            "curatorName": curator->name,
			contentNotes
		}
	  },
      "allReviews": *[_type == "review"]{
        "curatorId": curator._ref,
        selection
      }
	}`;

	const data = await sanityClient.fetch(query);

	// 1. Calculate Global Curator Stats
	const curatorStats: Record<string, { totalReviews: number; approvedCount: number; approvalRate: number }> = {};

	data.allReviews.forEach((r: any) => {
		if (!r.curatorId) return;
		if (!curatorStats[r.curatorId]) {
			curatorStats[r.curatorId] = { totalReviews: 0, approvedCount: 0, approvalRate: 0 };
		}

		curatorStats[r.curatorId].totalReviews++;
		if (r.selection === 'selected') {
			curatorStats[r.curatorId].approvedCount++;
		}
	});

	// Compute rates
	Object.values(curatorStats).forEach(stat => {
		stat.approvalRate = stat.totalReviews > 0 ? stat.approvedCount / stat.totalReviews : 0;
	});

	// 2. Prepare Movies Data
	const movies = data.submissions.map((s: any) => {
		const reviews = s.reviews || [];

		return {
			...s,
			reviews, // Pass raw reviews to client for reactive calculation
		};
	});

	return {
		movies,
		curatorStats
	};
};
