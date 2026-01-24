import type { PageServerLoad } from './$types';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async () => {
    // Fetch all curators with their highlights
    const curators = await sanityClient.fetch(
        `*[_type == "curator" && defined(highlights) && count(highlights) > 0] {
      _id,
      name,
      highlights[]->{
        _id,
        englishTitle,
        originalTitle,
        directorName,
        length,
        categories,
        yearOfCompletion,
        synopsis,
        "screenshots": screenshots[]{
          asset->{
            _id,
            url
          }
        },
        "poster": poster{
          asset->{
            _id,
            url
          }
        }
      }
    }`
    );

    // Aggregate highlights: create a map of submission -> curators who highlighted it
    const highlightMap = new Map<string, any>();

    curators.forEach((curator: any) => {
        curator.highlights?.forEach((submission: any) => {
            if (!submission) return; // Skip if reference is broken

            if (!highlightMap.has(submission._id)) {
                highlightMap.set(submission._id, {
                    submission,
                    curators: []
                });
            }

            highlightMap.get(submission._id).curators.push({
                _id: curator._id,
                name: curator.name
            });
        });
    });

    // Convert map to array and sort by number of curators (most highlighted first)
    const highlights = Array.from(highlightMap.values()).sort(
        (a, b) => b.curators.length - a.curators.length
    );

    // Calculate stats
    const stats = {
        totalHighlights: highlights.length,
        totalCurators: curators.length,
        mostHighlighted: highlights[0] || null,
        averageHighlightsPerVideo:
            highlights.length > 0
                ? (
                    highlights.reduce((sum, h) => sum + h.curators.length, 0) / highlights.length
                ).toFixed(1)
                : 0
    };

    return {
        highlights,
        stats
    };
};
