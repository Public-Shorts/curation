import type { CuratorStats, Review, Movie } from './types';
import { generateFlags } from './flags';

/**
 * Calculates a weight (multiplier) for each curator based on their activity and approval habits.
 */
export function calculateCuratorWeights(
    statsMap: Record<string, CuratorStats>,
    volumeExponent: number,
    tendencyPenalty: number
): Record<string, number> {
    const weights: Record<string, number> = {};

    for (const [id, stats] of Object.entries(statsMap)) {
        // Volume Score: Logarithmic scale to reward experience but prevent dominance
        const volumeScore = Math.log10(stats.totalReviews + 1) * volumeExponent;

        // Tendency Score: Penalize extremes (0% or 100% approval). Peak at 50%.
        const deviation = Math.pow(stats.approvalRate - 0.5, 2);
        // Formula: 1 - ((rate - 0.5)^2 * penalty)
        const tendencyScore = Math.max(0.1, 1 - deviation * tendencyPenalty);

        weights[id] = volumeScore * tendencyScore;
    }

    return weights;
}

/**
 * Processes movies to calculate weighted scores and attach flags.
 */
export function scoreMovies(
    movies: any[],
    curatorWeights: Record<string, number>
): Movie[] {
    return movies.map((movie) => {
        const reviews = movie.reviews || [];
        let weightedSum = 0;
        let totalWeight = 0;

        reviews.forEach((r: Review) => {
            const w = curatorWeights[r.curatorId] || 0;
            // Default check for safety, though mapped reviews should have selection
            let val = 0;
            if (r.selection === 'selected') val = 1;
            else if (r.selection === 'maybe') val = 0.5;
            // rejected = 0

            weightedSum += val * w;
            totalWeight += w;
        });

        const score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

        return {
            ...movie,
            score,
            reviewsCount: reviews.length,
            flags: generateFlags(movie, reviews)
        };
    });
}
