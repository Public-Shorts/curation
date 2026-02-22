import type { CuratorStats, Review, Movie } from './types';
import { generateFlags } from './flags';

export type CuratorVoteWeights = {
	selected: number;
	maybe: number;
	rejected: number;
};

/**
 * Calculates the average approval rate across all curators.
 */
function getAverageApprovalRate(statsMap: Record<string, CuratorStats>): number {
	const curators = Object.values(statsMap);
	if (curators.length === 0) return 0.5;
	const totalApproved = curators.reduce((sum, s) => sum + s.approvedCount, 0);
	const totalReviews = curators.reduce((sum, s) => sum + s.totalReviews, 0);
	return totalReviews > 0 ? totalApproved / totalReviews : 0.5;
}

/**
 * Calculates asymmetric weights for each curator's vote types.
 *
 * The correction is based on how the curator's approval rate compares to the average:
 * - If a curator approves more than average, their approvals count less, rejections count more
 * - If a curator approves less than average, their approvals count more, rejections count less
 */
export function calculateCuratorWeights(
	statsMap: Record<string, CuratorStats>,
	volumeExponent: number,
	tendencyPenalty: number
): Record<string, CuratorVoteWeights> {
	const weights: Record<string, CuratorVoteWeights> = {};
	const avgRate = getAverageApprovalRate(statsMap);

	for (const [id, stats] of Object.entries(statsMap)) {
		// Volume Score: Logarithmic scale to reward experience but prevent dominance
		const baseWeight = Math.log10(stats.totalReviews + 1) * volumeExponent;

		// Deviation from average: positive = approves more than average
		const deviation = stats.approvalRate - avgRate;

		// Asymmetric correction:
		// - Selected weight reduced if curator approves a lot (deviation > 0)
		// - Rejected weight increased if curator approves a lot (their rejections are rare/meaningful)
		const selectedMultiplier = Math.max(0.1, 1 - deviation * tendencyPenalty);
		const rejectedMultiplier = Math.max(0.1, 1 + deviation * tendencyPenalty);

		weights[id] = {
			selected: baseWeight * selectedMultiplier,
			maybe: baseWeight, // neutral, no correction
			rejected: baseWeight * rejectedMultiplier
		};
	}

	return weights;
}

/**
 * Processes movies to calculate weighted scores and attach flags.
 */
export function scoreMovies(
	movies: any[],
	curatorWeights: Record<string, CuratorVoteWeights>
): Movie[] {
	return movies.map((movie) => {
		const allReviews = movie.reviews || [];
		const reviews = allReviews.filter((r: Review) => !r.isJury);
		let weightedSum = 0;
		let totalWeight = 0;

		reviews.forEach((r: Review) => {
			const weights = curatorWeights[r.curatorId];
			if (!weights) return;

			let val = 0;
			let w = 0;

			if (r.selection === 'selected') {
				val = 1;
				w = weights.selected;
			} else if (r.selection === 'maybe') {
				val = 0.5;
				w = weights.maybe;
			} else {
				val = 0;
				w = weights.rejected;
			}

			weightedSum += val * w;
			totalWeight += w;
		});

		const score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

		return {
			...movie,
			score,
			reviewsCount: reviews.length,
			flags: generateFlags(movie, allReviews)
		};
	});
}

/**
 * Simple scoring: equal weight for all curators (no volume/bias adjustments).
 * Each vote counts equally: selected=1, maybe=0.5, rejected=0
 */
export function scoreMoviesSimple(movies: any[]): Movie[] {
	return movies.map((movie) => {
		const allReviews = movie.reviews || [];
		const reviews = allReviews.filter((r: Review) => !r.isJury);
		let sum = 0;
		let count = 0;

		reviews.forEach((r: Review) => {
			if (r.selection === 'selected') {
				sum += 1;
			} else if (r.selection === 'maybe') {
				sum += 0.5;
			}
			// rejected = 0
			count++;
		});

		const score = count > 0 ? (sum / count) * 100 : 0;

		return {
			...movie,
			score,
			reviewsCount: reviews.length,
			flags: generateFlags(movie, allReviews)
		};
	});
}

