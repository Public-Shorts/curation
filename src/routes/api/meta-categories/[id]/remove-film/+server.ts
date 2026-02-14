import {json, error} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {sanityClient} from '$lib/server/sanity';

export const POST: RequestHandler = async ({params, request, locals}) => {
	// Check if user is admin
	if (!locals.curatorId) {
		throw error(401, 'Unauthorized');
	}

	const curator = await sanityClient.fetch(
		`*[_type == "curator" && _id == $curatorId][0]{admin}`,
		{curatorId: locals.curatorId}
	);

	if (!curator?.admin) {
		throw error(403, 'Admin access required');
	}

	// Parse request body
	const {filmId} = await request.json();

	if (!filmId) {
		throw error(400, 'filmId is required');
	}

	const metaCategoryId = params.id;

	try {
		// Fetch current meta-category
		const metaCategory = await sanityClient.fetch(
			`*[_type == "metaCategory" && _id == $metaCategoryId][0]{films, locked}`,
			{metaCategoryId}
		);

		if (!metaCategory) {
			throw error(404, 'Meta-category not found');
		}

		if (metaCategory.locked) {
			throw error(403, 'This meta-category is locked. Films cannot be removed.');
		}

		// Filter out the film to remove
		const currentFilms = metaCategory.films || [];
		const updatedFilms = currentFilms.filter(
			(ref: any) => ref._ref !== filmId && ref !== filmId
		);

		// Check if film was actually removed
		if (updatedFilms.length === currentFilms.length) {
			throw error(404, 'Film not found in this meta-category');
		}

		// Update the meta-category with the new films array
		await sanityClient
			.patch(metaCategoryId)
			.set({
				films: updatedFilms.map((ref: any) =>
					typeof ref === 'string' ? {_type: 'reference', _ref: ref} : ref
				),
			})
			.commit();

		return json({
			success: true,
			message: 'Film removed from meta-category',
			removedFilmId: filmId,
		});
	} catch (e: any) {
		console.error('Error removing film from meta-category:', e);

		if (e.status) {
			throw e;
		}

		throw error(500, 'Failed to remove film from meta-category');
	}
};
