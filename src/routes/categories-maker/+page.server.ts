import { sanityClient } from '$lib/server/sanity';
import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import suggestions from '$lib/data/suggestions.json';

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

    return {
        submissions: (submissions as any[]).map((s: any) => ({
            ...s,
            isHighlighted: highlightedIds.has(s._id)
        })),
        clusters,
        suggestions,
        isDev: dev
    };
};
