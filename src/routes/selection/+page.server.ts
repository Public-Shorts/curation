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
		filmLanguage,
		length,
		categories,
		categoryOther,
		_createdAt,
		
		// NEW: Fetch submission-level flags
		explicit,
		explicitDetails,
		aiUsed,
		aiExplanation,
		
		"reviews": *[_type == "review" && film._ref == ^._id]{
			selection, 
			rating,
			tags,
			contentNotes // NEW: Fetch curator content notes
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
		const curatorTags = Array.from(new Set(reviews.flatMap((r: any) => (r.tags || []).map((t: any) => t.label || t))))
			.filter((t) => typeof t === 'string')
			.sort();

		// --- NEW: Process Flags ---
		const flags = [];

		// 1. Explicit Content (Submitter declared)
		if (s.explicit) {
			flags.push({
				type: 'explicit',
				label: 'EXPLICIT',
				details: s.explicitDetails || 'Contains explicit content',
				color: 'text-red-700 bg-red-50 border-red-200'
			});
		}

		// 2. AI Usage (Submitter declared)
		if (s.aiUsed) {
			flags.push({
				type: 'ai',
				label: 'AI',
				details: s.aiExplanation || 'AI tools were used',
				color: 'text-purple-700 bg-purple-50 border-purple-200'
			});
		}

		// 3. Content Notes (Curator declared)
		// Aggregate all unique notes from all reviews, excluding 'none'
		const rawNotes = reviews.flatMap((r: any) => r.contentNotes || []);
		const uniqueNotes = Array.from(new Set(rawNotes)).filter((n: any) => n && n !== 'none');
		
		if (uniqueNotes.length > 0) {
			flags.push({
				type: 'content',
				label: 'WARNINGS',
				details: uniqueNotes.join(', '), // "Violence, Strong Language"
				color: 'text-orange-700 bg-orange-50 border-orange-200'
			});
		}

		return {
			...s,
			reviewsCount: totalReviews,
			approvalRate,
			averageRating,
			displayCategories,
			curatorTags,
			flags // Add to object
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
