import type { PageServerLoad } from './$types';
import data from '$lib/data/clusters.json';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async () => {

    // Filter clusters to have at least 1 movie (or keep as is)
    const movies = data.movies as Record<string, any>;
    const formattedClusters = data.clusters
        .map((c: any) => {
            const highlightedMovies = c.highlightedMovieIds.map((id: string) => movies[id]).filter(Boolean);
            const relevantMovies = c.relevantMovieIds.map((id: string) => movies[id]).filter(Boolean);

            const allMovies = [...highlightedMovies, ...relevantMovies];

            const highlightedMinutes = highlightedMovies.reduce((sum: number, m: any) => sum + (m.length || 0), 0);
            const relevantMinutes = relevantMovies.reduce((sum: number, m: any) => sum + (m.length || 0), 0);
            const totalMinutes = allMovies.reduce((sum: number, m: any) => sum + (m.length || 0), 0);

            return {
                ...c,
                highlightedMovies,
                relevantMovies,
                count: allMovies.length,
                highlightedMinutes,
                relevantMinutes,
                totalMinutes,
                totalHours: Math.floor(totalMinutes / 60),
                totalMins: totalMinutes % 60
            };
        })
        .filter((c: any) => c.highlightedMovies.length > 0) // Only show clusters with at least one highlight
        .sort((a: any, b: any) => b.count - a.count);

    // Calculate total videos in clusters
    const totalVideosInClusters = new Set(formattedClusters.flatMap((c: any) => [
        ...c.highlightedMovies.map((m: any) => m._id),
        ...c.relevantMovies.map((m: any) => m._id)
    ])).size;

    // Get unique highlighted films in clusters
    const uniqueHighlightedInClusters = new Set(
        formattedClusters.flatMap((c: any) => c.highlightedMovies.map((m: any) => m._id))
    ).size;

    // Query Sanity for total highlights count
    const totalHighlights = await sanityClient.fetch<number>(
        `count(*[_type == "curator" && defined(highlights)].highlights[])`
    );

    const stats = {
        totalClusters: formattedClusters.length,
        avgCategorySize: formattedClusters.length > 0
            ? Math.round(totalVideosInClusters / formattedClusters.length)
            : 0,
        highlightCoverage: totalHighlights > 0
            ? Math.round((uniqueHighlightedInClusters / totalHighlights) * 100)
            : 0
    };

    return {
        clusters: formattedClusters,
        stats,
        lastUpdated: data.lastUpdated
    };
};
