import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';
import { sanityClient } from '$lib/server/sanity';

const execPromise = promisify(exec);

export async function POST({ request, url }) {
    const { action, ...params } = await request.json();

    try {
        switch (action) {
            case 'create-screening': {
                const doc = {
                    _type: 'screening',
                    title: params.title,
                    slug: { _type: 'slug', current: params.title.toLowerCase().replace(/\s+/g, '-') },
                    date: params.date || new Date().toISOString(),
                    location: params.location || 'TBD',
                    juryMembers: [],
                    keywords: []
                };
                const result = await sanityClient.create(doc);
                return json({ success: true, result });
            }

            case 'update-screening': {
                const result = await sanityClient.patch(params.id)
                    .set({
                        title: params.title,
                        date: params.date,
                        location: params.location,
                        juryMembers: params.juryMembers || []
                    })
                    .commit();
                return json({ success: true, result });
            }

            case 'delete-screening': {
                // First unassign all videos referencing this screening
                const videos = await sanityClient.fetch(`*[_type == "submission" && assignedScreening._ref == $id]._id`, { id: params.id });
                if (videos.length > 0) {
                    const transaction = sanityClient.transaction();
                    videos.forEach((vidId: string) => {
                        transaction.patch(vidId, (p) => p.unset(['assignedScreening']));
                    });
                    await transaction.commit();
                }
                // Then delete the screening
                await sanityClient.delete(params.id);
                return json({ success: true });
            }

            case 'assign-video': {
                const result = await sanityClient.patch(params.videoId)
                    .set({ assignedScreening: { _type: 'reference', _ref: params.screeningId } })
                    .commit();
                return json({ success: true, result });
            }

            case 'unassign-video': {
                const result = await sanityClient.patch(params.videoId)
                    .unset(['assignedScreening'])
                    .commit();
                return json({ success: true, result });
            }

            case 'run-suggestion-script': {
                // Only allow in dev mode (or based on some check)
                if (process.env.NODE_ENV !== 'development') {
                    return json({ success: false, error: 'Not allowed in production' }, { status: 403 });
                }
                const { stdout, stderr } = await execPromise('pnpm update-suggestions');
                return json({ success: true, stdout, stderr });
            }

            default:
                return json({ success: false, error: 'Unknown action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('API Error:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}
