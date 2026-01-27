import type { PageServerLoad } from './$types';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async () => {
    const query = `{
    "curators": *[_type == "curator" && defined(highlights) && count(highlights) > 0] {
      highlights[]->{
        _id,
        englishTitle,
        length,
        "poster": poster{
          asset->{
            _id,
            url
          }
        },
        "screenshots": screenshots[]{
          asset->{
            _id,
            url
          }
        },
        "reviews": *[_type == "review" && film._ref == ^._id]{
          tags
        }
      }
    }
  }`;

    const { curators } = await sanityClient.fetch(query);

    // 1. Flatten all highlighted movies
    const highlightMap = new Map<string, any>();
    curators.forEach((c: any) => {
        c.highlights?.forEach((m: any) => {
            if (!m) return;
            if (!highlightMap.has(m._id)) {
                highlightMap.set(m._id, m);
            }
        });
    });
    const movies = Array.from(highlightMap.values());

    // 2. Define Clusters and Mapping Logic
    const clusters = [
        {
            id: 'visual-innovations',
            name: 'Visual Innovations & Experimental Media',
            description: 'Focus on form, texture, animation, and mixed media techniques.',
            keywords: ['animation', 'experimental', 'digital', 'mixed-media', 'vfx', 'collage', 'abstract', 'texture', 'glitch', 'stop-motion', '3d', 'visual', 'aesthetic'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'political-power',
            name: 'Political Echoes & Power Dynamics',
            description: 'Explorations of activism, protest, police, internet culture, and societal structures.',
            keywords: ['political', 'police', 'protest', 'internet', 'essay', 'violence', 'power', 'activism', 'society', 'war', 'surveillance', 'justice', 'news'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'human-connections',
            name: 'Human Connections & Emotional Landscapes',
            description: 'Intimate portrayals of grief, loneliness, family, memory, and relationships.',
            keywords: ['urban', 'grief', 'loneliness', 'letter', 'longing', 'absence', 'memory', 'family', 'home', 'love', 'relationship', 'personal', 'diary', 'intimate', 'heart'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'corporeal-studies',
            name: 'Corporeal Studies & Physicality',
            description: 'The body in space, physical movement, sensory experiences, and intimacy.',
            keywords: ['body', 'presence', 'balance', 'physical', 'dance', 'movement', 'sensory', 'skin', 'touch', 'breath', 'performance'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'atmospheric-expressions',
            name: 'Atmospheric & Abstract Expressions',
            description: 'Slow-paced, minimalist, or highly atmospheric works focusing on landscape and mood.',
            keywords: ['slow', 'minimalist', 'landscape', 'mood', 'texture', 'ambient', 'dream', 'nightmare', 'liminal', 'space', 'quiet', 'contemplative'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'technological-frontiers',
            name: 'Technological Frontiers',
            description: 'AI, future visions, computer-mediated reality, and the impact of technology.',
            keywords: ['ai', 'future', 'computer', 'technology', 'cyber', 'data', 'algorithm', 'sci-fi', 'dystopian', 'virtual', 'machine', 'code'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'nature-ecology',
            name: 'Nature, Ecology & Environment',
            description: 'Exploring the relationship between humans and the natural world.',
            keywords: ['ecology', 'nature', 'landscape', 'environment', 'earth', 'climate', 'animals', 'water', 'green', 'wild'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'narrative-fictions',
            name: 'Narrative Fictions & Storytelling',
            description: 'More conventional storytelling or character-driven works.',
            keywords: ['story', 'character', 'fiction', 'narrative', 'drama', 'comedy', 'dialogue', 'tension'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'sound-landscapes',
            name: 'Sound Landscapes & Auditory Depth',
            description: 'Focus on sound design, music, and voice.',
            keywords: ['sound', 'audio', 'music', 'voice', 'listening', 'silence', 'noise', 'sonic'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'identities-margins',
            name: 'Identities & Margins',
            description: 'Exploration of gender, queer themes, and marginalized voices.',
            keywords: ['lgbtqia', 'gender', 'queer', 'identity', 'margin', 'subculture', 'represent', 'woman', 'feminist', 'trans'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        },
        {
            id: 'absurd-humor',
            name: 'Absurdism & Dark Humor',
            description: 'Surreal, funny, or intentionally weird works.',
            keywords: ['absurd', 'funny', 'humor', 'weird', 'surreal', 'comedy', 'strange', 'irony'],
            tags: new Set<string>(),
            movieIds: new Set<string>()
        }
    ];

    // 3. Process tags and assign to clusters
    movies.forEach((movie) => {
        const movieTags = (movie.reviews || []).flatMap((r: any) => r.tags || []);
        movieTags.forEach((tag: any) => {
            const label = tag.label.toLowerCase().replace(/^#/, '').trim();

            for (const cluster of clusters) {
                if (cluster.keywords.some((k) => label.includes(k) || k.includes(label))) {
                    cluster.tags.add(tag.label);
                    cluster.movieIds.add(movie._id);
                }
            }
        });
    });

    // 4. Finalize data for the UI
    const formattedClusters = clusters
        .filter((c) => c.movieIds.size >= 4) // Minimum 4 videos as requested
        .map((c) => {
            const clusterMovies = Array.from(c.movieIds).map((id) => highlightMap.get(id));
            const totalMinutes = clusterMovies.reduce((sum, m) => sum + (m.length || 0), 0);

            return {
                ...c,
                tags: Array.from(c.tags),
                movies: clusterMovies.map(m => ({
                    _id: m._id,
                    title: m.englishTitle,
                    poster: m.poster,
                    screenshots: m.screenshots,
                    length: m.length
                })),
                count: c.movieIds.size,
                totalMinutes,
                totalHours: Math.floor(totalMinutes / 60),
                totalMins: totalMinutes % 60
            };
        })
        .sort((a, b) => b.count - a.count);

    const stats = {
        totalClusters: formattedClusters.length,
        totalVideosInClusters: new Set(formattedClusters.flatMap(c => c.movies.map(m => m._id))).size,
        totalTimeAcrossClusters: formattedClusters.reduce((sum, c) => sum + c.totalMinutes, 0)
    };

    return {
        clusters: formattedClusters,
        stats
    };
};
