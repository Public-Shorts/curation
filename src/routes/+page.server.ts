import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const curatorId = locals.curatorId;

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
				"curatorName": curator->name
			}
		},
		"highlights": *[_type == "curator" && defined(highlights) && count(highlights) > 0]{
			_id,
			name,
			"highlightIds": highlights[]._ref
		}
	}`;

	const data = await sanityClient.fetch(query, { curatorId });

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
		selectedThreshold: data.settings?.selectedThreshold ?? 65,
		maybeThreshold: data.settings?.maybeThreshold ?? 35
	};

	return {
		curatorStats: data.curatorStats,
		submissions: data.submissions,
		highlightMap,
		settings,
		isAdmin: data.curatorStats.curator?.admin === true
	};
};
