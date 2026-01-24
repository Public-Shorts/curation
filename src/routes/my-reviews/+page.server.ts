import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.curatorId) throw redirect(303, '/login');

    const curatorId = locals.curatorId;

    // Fetch curator info (including highlights) and strict count of their reviews
    const data = await sanityClient.fetch(
        `{
      "curator": *[_type == "curator" && _id == $curatorId][0]{ 
        _id, 
        name, 
        highlights[]->{_id} 
      },
      "myReviews": *[_type == "review" && curator._ref == $curatorId] {
        _id,
        selection,
        rating,
        "submission": film->{
            _id,
            englishTitle,
            originalTitle,
            length,
            filmLanguage,
            categories,
            categoryOther,
            _createdAt
        }
      }
    }`,
        { curatorId }
    );

    const totalReviews = data.myReviews.length;
    const maxHighlights = Math.floor(totalReviews * 0.1);
    const highlightedIds = data.curator?.highlights?.map((h: any) => h._id) || [];
    const remainingQuota = Math.max(0, maxHighlights - highlightedIds.length);

    const nextHighlightThreshold = (highlightedIds.length + 1) * 10;
    const additionalReviewsNeeded = Math.max(0, nextHighlightThreshold - totalReviews);

    // Sort reviews: by selection status (selected > maybe > rejected), then by rating (highest first)
    const selectionOrder = { selected: 0, maybe: 1, rejected: 2 };
    const sortedReviews = data.myReviews.sort((a: any, b: any) => {
        const aOrder = selectionOrder[a.selection as keyof typeof selectionOrder] ?? 3;
        const bOrder = selectionOrder[b.selection as keyof typeof selectionOrder] ?? 3;

        if (aOrder !== bOrder) return aOrder - bOrder;

        // If same selection status, sort by rating (highest first)
        const aRating = a.rating ?? -1;
        const bRating = b.rating ?? -1;
        return bRating - aRating;
    });

    return {
        curator: data.curator,
        myReviews: sortedReviews,
        stats: {
            totalReviews,
            maxHighlights,
            remainingQuota,
            additionalReviewsNeeded
        }
    };
};

export const actions: Actions = {
    toggleHighlight: async ({ request, locals }) => {
        if (!locals.curatorId) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const submissionId = formData.get('submissionId') as string;

        if (!submissionId) return fail(400, { error: 'Missing submissionId' });

        const curatorId = locals.curatorId;

        // Fetch current state to validate
        const curator = await sanityClient.fetch(
            `*[_type == "curator" && _id == $curatorId][0]{ 
                _id, 
                highlights[]->{_id} 
            }`,
            { curatorId }
        );

        const highlightedIds = curator.highlights?.map((h: any) => h._id) || [];
        const isHighlighted = highlightedIds.includes(submissionId);

        if (isHighlighted) {
            // Remove from highlights
            await sanityClient
                .patch(curatorId)
                .unset([`highlights[_ref == "${submissionId}"]`])
                // Note: removing from array by reference usually requires specific index or exact match.
                // Sanity unset with match: .unset(['highlights[]._ref == "..."']) ? No, unset takes path.
                // Better: use .pull? Sanity doesn't have pull.
                // We can re-write the array filter in the patch?
                // Or easier: use unset with index if we knew it?
                // Actually `unset(['highlights[_ref=="ID"]'])` is not valid path syntax usually.
                // Standard way to remove from array ref in Sanity patch:
                .unset([`highlights[_ref=="${submissionId}"]`]) // This might not work directly.
            // Valid way: .insert('replace', ...) or fetch, filter, set.
            // Let's try .unset with a query-like path if supported, or just read-modify-write logic is safer for complex array ops if simple patch fails.
            // Wait, Sanity supports `unset(['highlights[2]'])` but finding index is hard in one go.
            // Actually there is `patch.remove(items)`? No.
            // `patch.unset(paths)`
            // Let's use `client.patch(id).unset(['highlights[_ref == "' + id + '"]'])`. Wait, does Sanity patch support filtered path assignment?
            // Documentation says: `unset` takes array of string paths.
            // `highlights[_key == "abc"]` works for keyed arrays. References in arrays usually don't have keys unless added.
            // Standard reference array in Sanity is `[{_type: 'reference', _ref: '...', _key: '...'}]`. Sanity adds _key auto-magically if using GUI but programmatic?
            // The schema: `of: [{type: 'reference', ...}]`.
            // Best practice: Fetch the array, filter it in JS, set it back. It is safe enough given low concurrency.

            const newHighlights = (curator.highlights || []).filter((h: any) => h._id !== submissionId);
            // We need to pass objects with _key if they had one, or references.
            // Since we fetched `->{_id}`, we lost the original reference objects (keys etc).
            // Retrying fetch without expansion to get raw array
        }

        // Re-fetch raw highlights to handle update correctly
        const rawCurator = await sanityClient.fetch(
            `*[_type == "curator" && _id == $curatorId][0]{ highlights }`,
            { curatorId }
        );
        const currentRaw = rawCurator.highlights || [];

        // We check if submission is in there by _ref
        const existsIndex = currentRaw.findIndex((h: any) => h._ref === submissionId);

        if (existsIndex >= 0) {
            // Remove
            // To ensure atomic-ish safety, we could just rewrite the array without that item
            // Or use `unset` with explicit index? Index might change race condition.
            // Safest: set the new array.
            const updated = currentRaw.filter((_: any, i: number) => i !== existsIndex);
            await sanityClient.patch(curatorId).set({ highlights: updated }).commit();
            return { success: true, status: 'removed' };
        } else {
            // Add
            // Check quota again (server side authoritative check)
            const totalReviewsCount = await sanityClient.fetch(`count(*[_type == "review" && curator._ref == $curatorId])`, { curatorId });
            const max = Math.floor(totalReviewsCount * 0.1);

            if (currentRaw.length >= max) {
                return fail(403, {
                    error: 'Quota exceeded',
                    message: `You can only highlight 10% of videos you reviewed. Watch ${10 - (totalReviewsCount % 10)} more videos to earn a slot.`
                    // Calculation: 
                    // Needed: (current + 1) * 10 - totalReviews
                    // Or simpler logic shown before.
                });
            }

            // Add reference
            await sanityClient
                .patch(curatorId)
                .setIfMissing({ highlights: [] })
                .append('highlights', [{ _type: 'reference', _ref: submissionId, _key: crypto.randomUUID() }])
                .commit();
            return { success: true, status: 'added' };
        }
    }
};
