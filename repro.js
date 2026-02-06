const fs = require('fs');
const path = require('path');

// Load data
const clustersPath = path.join(__dirname, 'src/lib/data/clusters.json');
let selectionPath = path.join(__dirname, 'src/lib/data/selection.json');

console.log('Reading files...');
const clustersData = JSON.parse(fs.readFileSync(clustersPath, 'utf8'));
let selectionData = {
    lastUpdated: null,
    summary: '',
    highlights: [],
    unanimous: [],
    selected: [],
    maybe: []
};

try {
    selectionData = JSON.parse(fs.readFileSync(selectionPath, 'utf8'));
} catch (e) {
    console.log('selection.json not found or invalid');
}

async function test() {
    try {
        console.log('Starting test...');

        // 1. Clusters logic
        console.log('Testing Clusters logic...');
        const movies = clustersData.movies;
        if (!movies) throw new Error('movies missing in clusters.json');

        const formattedClusters = clustersData.clusters
            .map((c) => {
                if (!c.highlightedMovieIds) {
                    console.error('Cluster missing highlightedMovieIds:', c.id);
                    return null;
                }
                if (!c.relevantMovieIds) {
                    console.error('Cluster missing relevantMovieIds:', c.id);
                    return null;
                }

                const highlightedMovies = c.highlightedMovieIds.map((id) => movies[id]).filter(Boolean);
                const relevantMovies = c.relevantMovieIds.map((id) => movies[id]).filter(Boolean);

                const allMovies = [...highlightedMovies, ...relevantMovies];

                const highlightedMinutes = highlightedMovies.reduce((sum, m) => sum + (m.length || 0), 0);
                const relevantMinutes = relevantMovies.reduce((sum, m) => sum + (m.length || 0), 0);
                const totalMinutes = allMovies.reduce((sum, m) => sum + (m.length || 0), 0);

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
            .filter((c) => c && c.highlightedMovies.length > 0)
            .sort((a, b) => b.count - a.count);

        console.log('Clusters processed. Count:', formattedClusters.length);

        // 2. Selection logic
        console.log('Testing Selection logic...');
        const allIds = [
            ...selectionData.highlights.map((f) => f._id),
            ...(selectionData.unanimous || []).map((f) => f._id),
            ...selectionData.selected.map((f) => f._id),
            ...selectionData.maybe.map((f) => f._id)
        ];
        console.log('Selection IDs collected:', allIds.length);

        // 3. Stats logic
        console.log('Testing Stats logic...');
        const totalVideosInClusters = new Set(formattedClusters.flatMap((c) => [
            ...c.highlightedMovies.map((m) => m._id),
            ...c.relevantMovies.map((m) => m._id)
        ])).size;
        console.log('Total videos in clusters:', totalVideosInClusters);

        const uniqueHighlightedInClusters = new Set(
            formattedClusters.flatMap((c) => c.highlightedMovies.map((m) => m._id))
        ).size;
        console.log('Unique highlighted in clusters:', uniqueHighlightedInClusters);

        console.log('DONE: No errors found in synchronous logic.');

    } catch (e) {
        console.error('CRASHED:', e);
    }
}

test();
