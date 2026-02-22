import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';
import { calculateCuratorWeights } from '$lib/utils/scoring';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const curatorId = locals.curatorId;

	// Check if curator is jury and redirect to selection page
	const curator = await sanityClient.fetch(
		`*[_type == "curator" && _id == $curatorId][0]{ jury }`,
		{ curatorId }
	);
	if (curator?.jury) {
		throw redirect(303, '/visualiser');
	}

	const query = `{
		"curatorStats": {
			"curator": *[_type == "curator" && _id == $curatorId][0]{ _id, name, admin },
			"totalReviews": count(*[_type == "review" && curator._ref == $curatorId]),
			"approvedReviews": count(*[_type == "review" && curator._ref == $curatorId && selection == "selected"])
		},
		"settings": *[_type == "festivalSettings"][0]{
			selectedThreshold,
			maybeThreshold
		},
		"submissions": *[_type == "submission"] | order(_createdAt desc) {
			_id,
			englishTitle,
			directorName,
			filmLanguage,
			categories,
			categoryOther,
			length,
			_createdAt,
			explicit,
			explicitDetails,
			aiUsed,
			aiExplanation,
			"reviews": *[_type == "review" && film._ref == ^._id]{
				_id,
				selection,
				rating,
				contentNotes,
				"curatorId": curator._ref,
				"curatorName": curator->name,
				"isJury": curator->jury == true
			}
		},
		"highlights": *[_type == "curator" && defined(highlights) && count(highlights) > 0]{
			_id,
			name,
			"highlightIds": highlights[]._ref
		},
		"allReviews": *[_type == "review" && curator->jury != true]{
			"curatorId": curator._ref,
			selection
		},
		"scoringSettings": *[_type == "festivalSettings"][0]{
			volumeExponent, tendencyPenalty
		}
	}`;

	const data = await sanityClient.fetch(query, { curatorId });

	// Build curator stats and compute weights for scoring
	const curatorStatsMap: Record<string, { totalReviews: number; approvedCount: number; approvalRate: number }> = {};
	(data.allReviews || []).forEach((r: any) => {
		if (!r.curatorId) return;
		if (!curatorStatsMap[r.curatorId]) {
			curatorStatsMap[r.curatorId] = { totalReviews: 0, approvedCount: 0, approvalRate: 0 };
		}
		curatorStatsMap[r.curatorId].totalReviews++;
		if (r.selection === 'selected') curatorStatsMap[r.curatorId].approvedCount++;
	});
	Object.values(curatorStatsMap).forEach((stat) => {
		stat.approvalRate = stat.totalReviews > 0 ? stat.approvedCount / stat.totalReviews : 0;
	});

	const volumeExponent = data.scoringSettings?.volumeExponent ?? 1;
	const tendencyPenalty = data.scoringSettings?.tendencyPenalty ?? 2;
	const curatorWeights = calculateCuratorWeights(curatorStatsMap, volumeExponent, tendencyPenalty);

	// Build highlight map: submissionId -> array of curator names who highlighted it
	const highlightMap: Record<string, string[]> = {};
	(data.highlights || []).forEach((curator: { _id: string; name: string; highlightIds: string[] }) => {
		(curator.highlightIds || []).forEach((submissionId: string) => {
			if (!highlightMap[submissionId]) {
				highlightMap[submissionId] = [];
			}
			highlightMap[submissionId].push(curator.name);
		});
	});

	// Default settings if none exist in Sanity
	const settings = {
		selectedThreshold: data.settings?.selectedThreshold ?? 60,
		maybeThreshold: data.settings?.maybeThreshold ?? 35
	};

	return {
		curatorStats: data.curatorStats,
		submissions: data.submissions,
		highlightMap,
		settings,
		curatorWeights,
		isAdmin: data.curatorStats.curator?.admin === true
	};
};
