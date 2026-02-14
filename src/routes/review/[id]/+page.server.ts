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
                tags[] { label, value }, // explicitly fetch tags array
                suggestedGenre,           // fetch genre
                contentNotes,             // fetch content notes
                additionalComments,       // fetch comments
                curator->{
                    _id,
                    name
                }
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
	default: async ({ request, params, locals }) => {
		if (!locals.curatorId) throw redirect(303, '/login');

		try {
			const form = await request.formData();

			const selection = form.get('selection')?.toString() || null;
			const ratingRaw = form.get('rating');
			const rating = ratingRaw && ratingRaw.toString().trim() !== '' ? Number(ratingRaw) : null;

			// tags should instead be an array of objects with label and value
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

			// contentNotes as array of strings
			const contentNotes = form.getAll('contentNotes').map((v) => v.toString());
			const contentNotesValue = contentNotes.length > 0 ? contentNotes : ['none'];

			const filmId = params.id;
			const curatorId = locals.curatorId;

			const adultTriggerNotes = [
				'drugAlcoholUse',
				'horrorDisturbingImages',
				'sexualContent',
				'strongLanguage'
			];

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

			// After updating the review, check ALL reviews for this film to determine adult status
			const allReviews = await sanityClient.fetch(
				`*[_type == "review" && film._ref == $filmId]{ contentNotes }`,
				{ filmId }
			);

			const manualAdult = form.get('adult') === 'on';
			const anyReviewHasAdultFlag = allReviews.some((r: any) =>
				r.contentNotes?.some((note: string) => adultTriggerNotes.includes(note))
			);

			const isAdult = manualAdult || anyReviewHasAdultFlag;

			// Update submission adult status
			await sanityClient.patch(filmId).set({ adult: isAdult }).commit();

			// success payload for use:enhance
			return {
				success: true,
				message: 'Review saved.'
			};
		} catch (error) {
			console.error('Error saving review', error);

			// failure payload for use:enhance
			return {
				success: false,
				message: 'Could not save review. Please try again.'
			};
		}
	}
};
