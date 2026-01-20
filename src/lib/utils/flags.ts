import type { Movie, Review, Flag } from './types';

/**
 * Generates technical and content flags for a movie based on submission data
 * and curator reviews.
 */
export function generateFlags(movie: Movie, reviews: Review[] = []): Flag[] {
    const flags: Flag[] = [];

    // 1. Submission: Explicit Content
    if (movie.explicit) {
        flags.push({
            label: 'EXPLICIT',
            details: movie.explicitDetails || 'Explicit content flagged by submitter.',
            color: 'text-red-700 bg-red-50 border-red-200'
        });
    }

    // 2. Submission: AI Usage
    if (movie.aiUsed) {
        flags.push({
            label: 'AI',
            details: movie.aiExplanation || 'AI usage declared by submitter.',
            color: 'text-purple-700 bg-purple-50 border-purple-200'
        });
    }

    // 3. Reviews: Content Notes (Curator declared)
    // Aggregate all unique notes from all reviews, excluding 'none'
    const rawNotes = reviews.flatMap((r) => r.contentNotes || []);
    const uniqueNotes = Array.from(new Set(rawNotes)).filter(
        (n) => n && n.toLowerCase() !== 'none'
    );

    if (uniqueNotes.length > 0) {
        flags.push({
            label: 'WARNINGS',
            details: uniqueNotes.join(', '), // "Violence, Strong Language"
            color: 'text-orange-700 bg-orange-50 border-orange-200'
        });
    }

    return flags;
}
