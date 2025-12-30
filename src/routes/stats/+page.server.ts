// src/routes/stats/+page.server.ts
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
        "selected": count(*[_type == "review" && curator._ref == ^._id && selection == "selected"]),
        
        // 1. FETCH THE RAW LENGTHS INSTEAD OF SUMMING
        // We get an array of lengths for all films this curator reviewed
        "filmLengths": *[_type == "review" && curator._ref == ^._id].film->length
      },
      "overall": {
        "total": count(*[_type == "review"]),
        "selected": count(*[_type == "review" && selection == "selected"]),
        "maybe": count(*[_type == "review" && selection == "maybe"]),
        "notSelected": count(*[_type == "review" && selection == "notSelected"]),
        "totalSubmissions": count(*[_type == "submission"]),
        "reviewedSubmissions": count(*[_type == "submission" && count(*[_type == "review" && film._ref == ^._id]) > 0]),
        "reviewedAtLeastTwice": count(*[_type == "submission" && count(*[_type == "review" && film._ref == ^._id]) >= 2])
      },
      "submissions": *[_type == "submission"]|order(_createdAt asc){
        _createdAt,
        categories,
        categoryOther,
        length
      },
      "flagged": *[_type == "review" && defined(contentNotes) && count(contentNotes) > 0 && contentNotes[0] != "none"]{
        _id,
        contentNotes,
        "filmTitle": film->englishTitle,
        "filmId": film->_id,
        "curatorName": curator->name
      }
    }`;

	const data = await sanityClient.fetch(query);

	// Calculate Global Total Duration in JS
	const totalMinutes = data.submissions.reduce((acc: number, curr: any) => {
		return acc + (Number(curr.length) || 0);
	}, 0);

	// Process Leaderboard
	const leaderboard = data.leaderboard
		.map((c: any) => {
			// 2. CALCULATE SUM IN JS
			// Sum up the filmLengths array we fetched
			const curatorTotalMinutes = (c.filmLengths || []).reduce(
				(acc: number, len: any) => acc + (Number(len) || 0),
				0
			);

			return {
				...c,
				totalMinutes: curatorTotalMinutes,
				approvalRate: c.total > 0 ? (c.selected / c.total) * 100 : 0
			};
		})
		.sort((a: any, b: any) => b.total - a.total);

	// ... (Rest of your processing logic for categories, timeline, flagged remains unchanged) ...
	// Process Categories
	const categoryCounts: Record<string, number> = {};
	data.submissions.forEach((s: any) => {
		const cats = s.categories || [];
		cats.forEach((cat: string) => {
			categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
		});
	});

	const categoriesStats = Object.entries(categoryCounts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);

	// Process Timeline Data
	const submissionsByDate: Record<string, number> = {};
	data.submissions.forEach((s: any) => {
		const date = new Date(s._createdAt).toISOString().split('T')[0];
		submissionsByDate[date] = (submissionsByDate[date] || 0) + 1;
	});

	const timelineStats = Object.entries(submissionsByDate)
		.map(([date, count]) => ({ date, count }))
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	// Process Flagged
	const flaggedByReason: Record<string, any[]> = {};
	data.flagged.forEach((review: any) => {
		review.contentNotes.forEach((note: string) => {
			if (note === 'none') return;
			const label = note
				.replace(/([A-Z])/g, ' $1')
				.replace(/^./, (str) => str.toUpperCase())
				.replace('Horror Disturbing Images', 'Horror / Disturbing Images')
				.trim();

			if (!flaggedByReason[label]) flaggedByReason[label] = [];
			flaggedByReason[label].push({
				title: review.filmTitle || 'Untitled',
				id: review.filmId,
				curator: review.curatorName
			});
		});
	});

	const flaggedStats = Object.entries(flaggedByReason)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([reason, items]) => ({ reason, items }));

	return {
		leaderboard,
		overall: {
			...data.overall,
			totalMinutes,
			approvalRate: data.overall.total > 0 ? (data.overall.selected / data.overall.total) * 100 : 0
		},
		categoriesStats,
		flaggedStats,
		timelineStats
	};
};
