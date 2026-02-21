import type { PageServerLoad } from './$types';
import { sanityClient } from '$lib/server/sanity';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const { isAdmin } = await parent();

	if (!isAdmin) {
		throw redirect(302, '/');
	}

	// Fetch adult submissions and TV selection film IDs in parallel
	const [adultSubmissions, tvSelection] = await Promise.all([
		sanityClient.fetch(`
			*[_type == "submission" && adult == true] | order(englishTitle asc) {
				_id,
				englishTitle,
				directorName,
				length,
				explicit,
				explicitDetails,
				categories,
				poster { asset->{_id, url} },
				screenshots[] { asset->{_id, url} },
				"reviews": *[_type == "review" && film._ref == ^._id] {
					_id,
					selection,
					rating,
					contentNotes,
					"curatorName": curator->name,
					"curatorId": curator->_id
				}
			}
		`),
		sanityClient.fetch(`
			*[_type == "tvSelection"][0] {
				"filmIds": films[].film._ref
			}
		`)
	]);

	return {
		adultSubmissions,
		tvSelectionIds: (tvSelection?.filmIds as string[]) || [],
		isAdmin
	};
};
