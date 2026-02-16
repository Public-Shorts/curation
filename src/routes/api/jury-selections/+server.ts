import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

async function verifyAccess(curatorId: string) {
	return sanityClient.fetch(
		`*[_type == "curator" && _id == $curatorId][0]{ jury, admin, name }`,
		{ curatorId }
	);
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.curatorId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const curator = await verifyAccess(locals.curatorId);
	if (!curator?.jury && !curator?.admin) {
		return json({ error: 'Only jury members can view selections' }, { status: 403 });
	}

	const selections = await sanityClient.fetch(
		`*[_type == "jurySelection"] | order(savedAt desc) {
			_id,
			name,
			savedAt,
			filterMode,
			activeFilmCount,
			"savedByName": savedBy->name
		}`
	);

	return json({ selections });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.curatorId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const curator = await verifyAccess(locals.curatorId);
	if (!curator?.jury && !curator?.admin) {
		return json({ error: 'Only jury members can save selections' }, { status: 403 });
	}

	const body = await request.json();
	const { name, filterMode, enabledMetaCategories, enabledClusters, enabledTags, activeFilmIds } =
		body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	try {
		const doc = await sanityClient.create({
			_type: 'jurySelection',
			name: name.trim(),
			savedBy: { _type: 'reference', _ref: locals.curatorId },
			savedAt: new Date().toISOString(),
			filterMode: filterMode || 'union',
			enabledMetaCategories: enabledMetaCategories || [],
			enabledClusters: enabledClusters || [],
			enabledTags: enabledTags || [],
			activeFilmIds: activeFilmIds || [],
			activeFilmCount: (activeFilmIds || []).length,
		});

		return json({ success: true, id: doc._id });
	} catch (error) {
		console.error('Failed to save jury selection:', error);
		return json({ error: 'Failed to save selection' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.curatorId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const curator = await verifyAccess(locals.curatorId);
	if (!curator?.jury && !curator?.admin) {
		return json({ error: 'Only jury members can delete selections' }, { status: 403 });
	}

	const body = await request.json();
	const { id } = body;

	if (!id || typeof id !== 'string') {
		return json({ error: 'Invalid selection ID' }, { status: 400 });
	}

	try {
		await sanityClient.delete(id);
		return json({ success: true });
	} catch (error) {
		console.error('Failed to delete jury selection:', error);
		return json({ error: 'Failed to delete selection' }, { status: 500 });
	}
};
