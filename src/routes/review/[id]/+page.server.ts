import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const { id } = params;
	const curatorId = locals.curatorId;

	const data = await sanityClient.fetch(
		`{
      "submission": *[_type == "submission" && _id == $id][0]{
        _id,
        directorName,
        socialMedia,
        website,
        originalTitle,
        englishTitle,
        yearOfCompletion,
        length,
        filmLanguage,
        synopsis,
        categories,
        categoryOther,
        explicit,
        explicitDetails,
        aiUsed,
        aiExplanation,
        additionalInfo,
        previousScreenings,
        previousScreeningLocations,
        linkToWatch,
        linkToDownload,
        screenshots,
        poster,
        castAndCrew,
        thanks,
        specialRequirements
      },
      "myReview": *[_type == "review" && film._ref == $id && curator._ref == $curatorId][0],
      "otherReviews": *[_type == "review" && film._ref == $id && curator._ref != $curatorId]{
        _id,
        selection,
        rating,
        curator->{
          _id,
          name
        }
      }
    }`,
		{ id, curatorId }
	);

	if (!data.submission) throw redirect(303, '/');

	return data;
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!locals.curatorId) throw redirect(303, '/login');
		const form = await request.formData();

		const selection = form.get('selection')?.toString() || null;
		const rating = form.get('rating') ? Number(form.get('rating')) : null;
		const tags = form.getAll('tags').map((t) => t.toString());
		const additionalComments = form.get('additionalComments')?.toString() || '';

		const filmId = params.id;
		const curatorId = locals.curatorId;

		// Upsert review: check if one exists
		const existing = await sanityClient.fetch(
			`*[_type == "review" && film._ref == $filmId && curator._ref == $curatorId][0]{ _id }`,
			{ filmId, curatorId }
		);

		if (existing?._id) {
			await sanityClient
				.patch(existing._id)
				.set({
					selection,
					rating,
					tags,
					additionalComments
				})
				.commit();
		} else {
			await sanityClient.create({
				_type: 'review',
				film: { _type: 'reference', _ref: filmId },
				curator: { _type: 'reference', _ref: curatorId },
				selection,
				rating,
				tags,
				additionalComments
			});
		}

		return { ok: true };
	}
};
