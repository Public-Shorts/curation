
import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG
const SANITY_CONFIG = {
    projectId: "0ome5qpf",
    dataset: "production",
    apiVersion: '2025-12-10',
    useCdn: false,
    token: "skZobMkCaSnrhX51E7cD40Gs7qBiHR8XTK1x2E0XsEgtW0isaJhMBMjP4znGUlDcGYcdePw203XZqowwsrfDSWGVpb0SnqXcOZ90Un7RJGmfQRThv4clIbgrV7LN846mZKuUWVYtMLTJasCgcbFta6u8NhNH5e2Vi6QGrm9Exofap3mmhxNY"
};

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "gemma3:4b"; // Updated to gemma3:4b per user request

const client = createClient(SANITY_CONFIG);

async function fetchAllData() {
    console.log("Fetching data from Sanity...");
    const query = `{
        "movies": *[_type == "submission"] {
            _id,
            englishTitle,
            length,
            "poster": poster{ asset->{ _id, url } },
            "screenshots": screenshots[]{ asset->{ _id, url } },
            "reviews": *[_type == "review" && film._ref == ^._id]{ tags }
        },
        "curators": *[_type == "curator" && defined(highlights) && count(highlights) > 0] {
            highlights[]->{ _id }
        }
    }`;
    return await client.fetch(query);
}

async function getClustersFromOllama(tags: string[]) {
    console.log(`Asking Ollama (${MODEL}) to generate clusters...`);

    const prompt = `
    I am organizing a short film festival. I have a list of tags from the "highlighted" videos. 
    I want you to group these tags into 10+ meaningful clusters (categories).
    For each cluster, provide:
    1. A catchy "id" (kebab-case)
    2. A beautiful "name" (e.g., "Atmospheric & Abstract Expressions")
    3. A brief "description"
    4. A list of "keywords" (including the tags that belong to it)

    Highlighted Tags:
    ${tags.join(", ")}

    Respond ONLY with a JSON array of objects with the following structure:
    [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "keywords": ["string", "string"]
      }
    ]
    Do not include any other text in your response.
    `;

    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                stream: false,
                format: "json"
            })
        });

        const data = await response.json();
        console.log("Ollama response data:", JSON.stringify(data).substring(0, 500));
        if (data.message && data.message.content) {
            const content = data.message.content;
            let parsed = JSON.parse(content);
            // Handle case where LLM returns { "clusters": [...] } instead of [...]
            if (!Array.isArray(parsed) && parsed.clusters && Array.isArray(parsed.clusters)) {
                parsed = parsed.clusters;
            }
            if (!Array.isArray(parsed)) {
                throw new Error("Parsed JSON is not an array");
            }
            return parsed;
        } else if (data.response) {
            // Some versions of Ollama use a different format or prompt was not Chat API
            return JSON.parse(data.response);
        }
        throw new Error("Unexpected Ollama response format");
    } catch (error) {
        console.error("Error communicating with Ollama:", error);
        console.log("Falling back to default clusters...");
        return [
            { id: 'visual-innovations', name: 'Visual Innovations', description: 'Focus on form, texture, and experimental techniques.', keywords: ['animation', 'experimental', 'vfx', 'collage', 'abstract', 'glitch', '3d'] },
            { id: 'human-connections', name: 'Human Connections', description: 'Intimate portrayals of relationships and memory.', keywords: ['family', 'love', 'memory', 'grief', 'loneliness', 'personal'] },
            { id: 'political-power', name: 'Political Echoes', description: 'Explorations of society, power, and activism.', keywords: ['political', 'protest', 'power', 'activism', 'society', 'war', 'justice'] },
            { id: 'atmospheric-expressions', name: 'Atmospheric Moods', description: 'Slow-paced or highly atmospheric works.', keywords: ['slow', 'landscape', 'mood', 'texture', 'ambient', 'dream', 'quiet'] },
            { id: 'technological-frontiers', name: 'Technological Frontiers', description: 'AI and the impact of technology.', keywords: ['ai', 'future', 'technology', 'cyber', 'data', 'sci-fi'] },
            { id: 'nature-ecology', name: 'Nature & Ecology', description: 'Relationship between humans and the natural world.', keywords: ['ecology', 'nature', 'landscape', 'environment', 'animals', 'water'] }
        ];
    }
}

async function main() {
    const { movies, curators } = await fetchAllData();

    const highlightedIds = new Set();
    curators.forEach((c: any) => c.highlights?.forEach((h: any) => highlightedIds.add(h._id)));

    console.log(`Found ${movies.length} movies, ${highlightedIds.size} are highlighted.`);

    const highlightedTags = new Set<string>();
    movies.forEach((m: any) => {
        if (highlightedIds.has(m._id)) {
            m.reviews?.forEach((r: any) => r.tags?.forEach((t: any) => highlightedTags.add(t.label.toLowerCase())));
        }
    });

    const clusters = await getClustersFromOllama(Array.from(highlightedTags));
    console.log(`Generated ${clusters.length} clusters.`);

    // Map ALL movies to clusters
    const clusterMap = clusters.map((cluster: any) => ({
        ...cluster,
        highlightedMovieIds: [] as string[],
        relevantMovieIds: [] as string[]
    }));

    movies.forEach((movie: any) => {
        const movieTags = (movie.reviews || []).flatMap((r: any) => r.tags || []).map((t: any) => t.label.toLowerCase());

        clusterMap.forEach((cluster: any) => {
            const hasMatch = cluster.keywords.some((k: string) =>
                movieTags.some((mt: string) => mt.includes(k.toLowerCase()) || k.toLowerCase().includes(mt))
            );

            if (hasMatch) {
                if (highlightedIds.has(movie._id)) {
                    cluster.highlightedMovieIds.push(movie._id);
                } else {
                    cluster.relevantMovieIds.push(movie._id);
                }
            }
        });
    });

    const finalData = {
        lastUpdated: new Date().toISOString(),
        clusters: clusterMap,
        movies: movies.reduce((acc: any, m: any) => {
            acc[m._id] = {
                _id: m._id,
                title: m.englishTitle,
                poster: m.poster,
                screenshots: m.screenshots,
                length: m.length,
                tags: (m.reviews || []).flatMap((r: any) => r.tags || []).map((t: any) => t.label)
            };
            return acc;
        }, {})
    };

    const outputPath = path.resolve(__dirname, '../src/lib/data/clusters.json');
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));
    console.log(`Saved cluster mapping to ${outputPath}`);
}

main().catch(console.error);
