import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const { id } = params;
	const curatorId = locals.curatorId;

	const data = await sanityClient.fetch(
		`{
            "submission": *[_type == "submission" && _id == $id][0]{
                _id,
                _createdAt,
                directorName,
                socialMedia[]{ _key, platform, url, label },
                website[]{ _key, platform, url, label },
                originalTitle,
                englishTitle,
                yearOfCompletion,
                length,
                filmLanguage,
                synopsis,
                categories,
                categoryOther,
                explicit,
                adult,
                explicitDetails,
                aiUsed,
                aiExplanation,
                additionalInfo,
                previousScreenings,
                previousScreeningLocations,
                linkToWatch,
                linkPassword,
                linkToDownload,
                screenshots,
                poster,
                castAndCrew,
                thanks,
                specialRequirements,
                "posterUrl": poster.asset->url,

            },
            "myReview": *[_type == "review" && film._ref == $id && curator._ref == $curatorId][0]{
                _id,
                selection,
                rating,
                tags,
                suggestedGenre,
                contentNotes,
                additionalComments
            },
             "allReviews": *[_type == "review" && film._ref == $id]{
                _id,
                selection,
                rating,
                tags[] { label, value },
                suggestedGenre,
                contentNotes,
                additionalComments,
                curator->{
                    _id,
                    name
                },
                "isJury": curator->jury == true
            },
            "allTags": array::unique(
                *[_type == "review" && defined(tags)].tags[]{
                    label,
                    value
                }
            ),
            "highlightedBy": *[_type == "curator" && $id in highlights[]._ref]{
                _id,
                name
            }
        }`,
		{ id, curatorId }
	);

	if (!data.submission) throw redirect(303, '/');

	return data;
};

export const actions: Actions = {
	saveReview: async ({ request, params, locals }) => {
		if (!locals.curatorId) throw redirect(303, '/login');

		try {
			const form = await request.formData();

			const selection = form.get('selection')?.toString() || null;
			const ratingRaw = form.get('rating');
			const rating = ratingRaw && ratingRaw.toString().trim() !== '' ? Number(ratingRaw) : null;

			const tagsRaw = form.getAll('tags');
			const tags = tagsRaw.map((tag) => {
				const tagStr = tag.toString();
				return {
					_type: 'tag',
					_key: crypto.randomUUID(),
					label: tagStr,
					value: tagStr.toLowerCase().replace(/\W/g, '-')
				};
			});

			const additionalComments = form.get('additionalComments')?.toString() || '';
			const suggestedGenre = form.get('suggestedGenre')?.toString() || '';

			const contentNotes = form.getAll('contentNotes').map((v) => v.toString());
			const contentNotesValue = contentNotes.length > 0 ? contentNotes : ['none'];

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
						suggestedGenre,
						contentNotes: contentNotesValue,
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
					suggestedGenre,
					contentNotes: contentNotesValue,
					additionalComments
				});
			}

			return {
				success: true,
				message: 'Review saved.'
			};
		} catch (error) {
			console.error('Error saving review', error);

			return {
				success: false,
				message: 'Could not save review. Please try again.'
			};
		}
	},

	toggleAdult: async ({ request, params, locals }) => {
		if (!locals.curatorId) throw redirect(303, '/login');

		try {
			const form = await request.formData();
			const isAdult = form.get('adult') === 'on';

			await sanityClient.patch(params.id).set({ adult: isAdult }).commit();

			return {
				success: true,
				message: isAdult ? 'Marked as adult content.' : 'Adult content flag removed.'
			};
		} catch (error) {
			console.error('Error toggling adult flag', error);
			return { success: false, message: 'Could not update adult flag.' };
		}
	}
};
