import type { PageServerLoad } from './$types';
import fs from 'fs';
import path from 'path';

export const load: PageServerLoad = async () => {
    const dataPath = path.resolve('src/lib/data/clusters.json');

    if (!fs.existsSync(dataPath)) {
        return {
            clusters: [],
            stats: { totalClusters: 0, totalVideosInClusters: 0, totalTimeAcrossClusters: 0 },
            error: "Clusters not yet generated. Please run 'pnpm update-clusters'."
        };
    }

    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Filter clusters to have at least 1 movie (or keep as is)
    const formattedClusters = data.clusters
        .map((c: any) => {
            const highlightedMovies = c.highlightedMovieIds.map((id: string) => data.movies[id]).filter(Boolean);
            const relevantMovies = c.relevantMovieIds.map((id: string) => data.movies[id]).filter(Boolean);

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

    const stats = {
        totalClusters: formattedClusters.length,
        totalVideosInClusters: new Set(formattedClusters.flatMap((c: any) => [
            ...c.highlightedMovies.map((m: any) => m._id),
            ...c.relevantMovies.map((m: any) => m._id)
        ])).size,
        totalTimeAcrossClusters: formattedClusters.reduce((sum: number, c: any) => sum + c.totalMinutes, 0)
    };

    return {
        clusters: formattedClusters,
        stats,
        lastUpdated: data.lastUpdated
    };
};
