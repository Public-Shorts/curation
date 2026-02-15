import { json } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

function generateKey(): string {
	return Math.random().toString(36).substring(2, 15);
}

async function recomputeTags(metaCategoryId: string) {
	const result = await sanityClient.fetch(
		`*[_type == "metaCategory" && _id == $id][0]{
			"allTags": films[].film->{
				"reviewTags": *[_type == "review" && film._ref == ^._id].tags
			}
		}`,
		{ id: metaCategoryId }
	);

	const allTags = (result?.allTags || []).flatMap((film: any) =>
		(film.reviewTags || []).flatMap((tags: any) =>
			Array.isArray(tags)
				? tags.map((t: any) => (typeof t === 'string' ? t : t.label || t.value)).filter(Boolean)
				: []
		)
	);

	const uniqueTags = [...new Set(allTags)];
	await sanityClient.patch(metaCategoryId).set({ tags: uniqueTags }).commit();
}

export async function POST({ request }) {
	const { action, ...params } = await request.json();

	try {
		switch (action) {
			case 'assign-film': {
				// Fetch current films array and locked status
				const metaCategory = await sanityClient.fetch(
					`*[_type == "metaCategory" && _id == $id][0] { films, locked }`,
					{ id: params.metaCategoryId }
				);

				if (metaCategory?.locked) {
					return json({ success: false, error: 'This meta-category is locked.' }, { status: 403 });
				}

				const currentFilms = metaCategory?.films || [];
				const filmRefs = currentFilms.map((f: any) => f.film?._ref || f._ref);

				// Add film if not already present
				if (!filmRefs.includes(params.filmId)) {
					const result = await sanityClient
						.patch(params.metaCategoryId)
						.setIfMissing({ films: [] })
						.append('films', [
							{
								_type: 'object',
								_key: generateKey(),
								film: { _type: 'reference', _ref: params.filmId },
							},
						])
						.set({ lastUpdated: new Date().toISOString() })
						.commit();
					await recomputeTags(params.metaCategoryId);
					return json({ success: true, result });
				}
				return json({ success: true, message: 'Film already assigned' });
			}

			case 'unassign-film': {
				// Fetch current films array and locked status
				const metaCategory = await sanityClient.fetch(
					`*[_type == "metaCategory" && _id == $id][0] { films, locked }`,
					{ id: params.metaCategoryId }
				);

				if (metaCategory?.locked) {
					return json({ success: false, error: 'This meta-category is locked.' }, { status: 403 });
				}

				const currentFilms = metaCategory?.films || [];

				// Filter out the film to remove
				const updatedFilms = currentFilms
					.filter((f: any) => (f.film?._ref || f._ref) !== params.filmId)
					.map((f: any) => ({
						_type: 'object',
						_key: f._key || generateKey(),
						film: { _type: 'reference', _ref: f.film?._ref || f._ref },
						...(f.score != null && { score: f.score }),
						...(f.metric && { metric: f.metric }),
					}));

				const result = await sanityClient
					.patch(params.metaCategoryId)
					.set({
						films: updatedFilms,
						lastUpdated: new Date().toISOString()
					})
					.commit();

				await recomputeTags(params.metaCategoryId);
				return json({ success: true, result });
			}

			default:
				return json({ success: false, error: 'Unknown action' }, { status: 400 });
		}
	} catch (error: any) {
		console.error('API Error:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
}
