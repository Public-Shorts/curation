import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.curatorId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const curator = await sanityClient.fetch(
		`*[_type == "curator" && _id == $curatorId][0]{ jury, admin }`,
		{ curatorId: locals.curatorId }
	);

	if (!curator?.jury && !curator?.admin) {
		return json({ error: 'Only jury members can view selections' }, { status: 403 });
	}

	const selection = await sanityClient.fetch(
		`*[_type == "jurySelection" && _id == $id][0]{
			_id,
			name,
			savedAt,
			filterMode,
			enabledMetaCategories,
			enabledClusters,
			enabledTags,
			activeFilmIds,
			activeFilmCount,
			"savedByName": savedBy->name
		}`,
		{ id: params.id }
	);

	if (!selection) {
		return json({ error: 'Selection not found' }, { status: 404 });
	}

	return json({ selection });
};
