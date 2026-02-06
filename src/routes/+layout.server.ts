import type { LayoutServerLoad } from './$types';
import { sanityClient } from '$lib/server/sanity';

export const load: LayoutServerLoad = async ({ url, locals }) => {
	// Fetch curator admin and jury status
	let isAdmin = false;
	let isJury = false;
	if (locals.curatorId) {
		const curator = await sanityClient.fetch(
			`*[_type == "curator" && _id == $curatorId][0]{admin, jury}`,
			{ curatorId: locals.curatorId }
		);
		isAdmin = curator?.admin || false;
		isJury = curator?.jury || false;
	}

	return {
		currentPath: url.pathname,
		isAdmin,
		isJury
	};
};
