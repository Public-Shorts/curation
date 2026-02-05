import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const POST: RequestHandler = async ({ request, locals }) => {
    // Check if user is logged in
    if (!locals.curatorId) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const curator = await sanityClient.fetch(
        `*[_type == "curator" && _id == $curatorId][0]{ admin }`,
        { curatorId: locals.curatorId }
    );

    if (!curator?.admin) {
        return json({ error: 'Only admins can modify settings' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { selectedThreshold, maybeThreshold } = body;

    // Validate thresholds
    if (typeof selectedThreshold !== 'number' || typeof maybeThreshold !== 'number') {
        return json({ error: 'Invalid threshold values' }, { status: 400 });
    }

    if (selectedThreshold < 50 || selectedThreshold > 95) {
        return json({ error: 'Selected threshold must be between 50 and 95' }, { status: 400 });
    }

    if (maybeThreshold < 15 || maybeThreshold > 50) {
        return json({ error: 'Maybe threshold must be between 15 and 50' }, { status: 400 });
    }

    if (maybeThreshold >= selectedThreshold) {
        return json({ error: 'Maybe threshold must be less than selected threshold' }, { status: 400 });
    }

    try {
        // Get or create the festival settings document
        const existingSettings = await sanityClient.fetch(
            `*[_type == "festivalSettings"][0]{ _id }`
        );

        if (existingSettings?._id) {
            // Update existing settings
            await sanityClient
                .patch(existingSettings._id)
                .set({
                    selectedThreshold,
                    maybeThreshold
                })
                .commit();
        } else {
            // Create new settings document
            await sanityClient.create({
                _type: 'festivalSettings',
                title: 'Festival Settings',
                selectedThreshold,
                maybeThreshold,
                volumeExponent: 1,
                tendencyPenalty: 2
            });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Failed to save settings:', error);
        return json({ error: 'Failed to save settings' }, { status: 500 });
    }
};
