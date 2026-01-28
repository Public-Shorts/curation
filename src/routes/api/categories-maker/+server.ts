import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';
import { sanityClient } from '$lib/server/sanity';

const execPromise = promisify(exec);

export async function POST({ request, url }) {
    const { action, ...params } = await request.json();

    try {
        switch (action) {
            case 'create-category': {
                const doc = {
                    _type: 'category',
                    name: params.name,
                    slug: { _type: 'slug', current: params.name.toLowerCase().replace(/\s+/g, '-') },
                    keywords: []
                };
                const result = await sanityClient.create(doc);
                return json({ success: true, result });
            }

            case 'update-category': {
                const result = await sanityClient.patch(params.id)
                    .set({ name: params.name })
                    .commit();
                return json({ success: true, result });
            }

            case 'delete-category': {
                await sanityClient.delete(params.id);
                // Also unassign all videos in this category
                const videos = await sanityClient.fetch(`*[_type == "submission" && assignedCategory._ref == $id]._id`, { id: params.id });
                if (videos.length > 0) {
                    const transaction = sanityClient.transaction();
                    videos.forEach((vidId: string) => {
                        transaction.patch(vidId, (p) => p.unset(['assignedCategory']));
                    });
                    await transaction.commit();
                }
                return json({ success: true });
            }

            case 'assign-video': {
                const result = await sanityClient.patch(params.videoId)
                    .set({ assignedCategory: { _type: 'reference', _ref: params.clusterId } })
                    .commit();
                return json({ success: true, result });
            }

            case 'unassign-video': {
                const result = await sanityClient.patch(params.videoId)
                    .unset(['assignedCategory'])
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
