import { json } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.curatorId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const submission = await sanityClient.fetch(
		`*[_type == "submission" && _id == $id][0]{
			_id,
			_createdAt,
			englishTitle,
			originalTitle,
			directorName,
			length,
			synopsis,
			filmLanguage,
			country,
			"poster": poster{ asset->{ _id, url } },
			"screenshots": screenshots[]{ asset->{ _id, url } },
			linkToWatch,
			linkToDownload,
			linkPassword,
			"reviews": *[_type == "review" && film._ref == ^._id]{
				_id, selection, rating, tags, additionalComments, contentNotes,
				"curatorName": curator->name
			}
		}`,
		{ id: params.id }
	);

	if (!submission) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	return json(submission);
};
