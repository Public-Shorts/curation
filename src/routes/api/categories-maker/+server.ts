import { json } from '@sveltejs/kit';
import { createClient } from '@sanity/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

const execPromise = promisify(exec);
dotenv.config();

const client = createClient({
    projectId: process.env.PUBLIC_SANITY_PROJECT_ID || '0ome5qpf',
    dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
    token: process.env.SANITY_API_TOKEN, // Needs to be a token with write access
    useCdn: false,
    apiVersion: '2023-05-03',
});

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
                const result = await client.create(doc);
                return json({ success: true, result });
            }

            case 'update-category': {
                const result = await client.patch(params.id)
                    .set({ name: params.name })
                    .commit();
                return json({ success: true, result });
            }

            case 'delete-category': {
                await client.delete(params.id);
                // Also unassign all videos in this category
                const videos = await client.fetch(`*[_type == "submission" && assignedCategory._ref == $id]._id`, { id: params.id });
                if (videos.length > 0) {
                    const transaction = client.transaction();
                    videos.forEach((vidId: string) => {
                        transaction.patch(vidId, (p) => p.unset(['assignedCategory']));
                    });
                    await transaction.commit();
                }
                return json({ success: true });
            }

            case 'assign-video': {
                const result = await client.patch(params.videoId)
                    .set({ assignedCategory: { _type: 'reference', _ref: params.clusterId } })
                    .commit();
                return json({ success: true, result });
            }

            case 'unassign-video': {
                const result = await client.patch(params.videoId)
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
