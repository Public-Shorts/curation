import type { PageServerLoad } from './$types';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch all vetoed submissions with full details
	const query = `{
		"vetoedSubmissions": *[_type == "festivalSettings"][0].vetoedSubmissions[]{
			_key,
			vetoedFromCinema,
			vetoedFromTV,
			reason,
			vetoedAt,
			"vetoedBy": vetoedBy->{_id, name},
			"submission": submission->{
				_id,
				englishTitle,
				directorName,
				length,
				categories,
				synopsis,
				"poster": poster{asset->{url}},
				"screenshots": screenshots[]{asset->{url}}
			}
		},
		"isAdmin": *[_type == "curator" && _id == $curatorId][0].admin
	}`;

	const { vetoedSubmissions, isAdmin } = await sanityClient.fetch(query, {
		curatorId: locals.curatorId || ''
	});

	// Filter out entries with null submissions (deleted submissions)
	const validVetoes = (vetoedSubmissions || []).filter((v: any) => v.submission !== null);

	return {
		vetoedSubmissions: validVetoes,
		isAdmin: isAdmin || false
	};
};
