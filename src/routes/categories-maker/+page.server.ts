import { sanityClient } from '$lib/server/sanity';
import type { PageServerLoad } from './$types';
import fs from 'fs';
import path from 'path';
import { dev } from '$app/environment';

export const load: PageServerLoad = async () => {
    // Fetch all submissions
    const submissionsPromise = sanityClient.fetch(`
        *[_type == "submission"] {
            _id,
            englishTitle,
            tags,
            poster { asset->{_id, url} },
            length,
            assignedCategory
        }
    `);

    // Fetch all categories
    const clustersPromise = sanityClient.fetch(`
        *[_type == "category"] {
            _id,
            name,
            description,
            keywords
        }
    `);

    // Fetch highlights from curators
    const curatorsPromise = sanityClient.fetch(`
        *[_type == "curator"] {
            highlights[]->{_id}
        }
    `);

    const [submissions, clusters, curators] = await Promise.all([
        submissionsPromise,
        clustersPromise,
        curatorsPromise
    ]);

    // Identify highlighted movie IDs
    const highlightedIds = new Set(
        curators.flatMap((c: any) => c.highlights?.map((h: any) => h._id) || [])
    );

    // Load suggestions if they exist
    let suggestions = {};
    const suggestionsPath = path.resolve('src/lib/data/suggestions.json');
    if (fs.existsSync(suggestionsPath)) {
        try {
            suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf-8'));
        } catch (e) {
            console.error('Error parsing suggestions.json:', e);
        }
    }

    return {
        submissions: submissions.map((s: any) => ({
            ...s,
            isHighlighted: highlightedIds.has(s._id)
        })),
        clusters,
        suggestions,
        isDev: dev
    };
};
