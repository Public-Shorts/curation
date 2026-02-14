import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG
const SANITY_CONFIG = {
	projectId: '0ome5qpf',
	dataset: 'production',
	apiVersion: '2025-12-10',
	useCdn: false,
	token:
		'skZobMkCaSnrhX51E7cD40Gs7qBiHR8XTK1x2E0XsEgtW0isaJhMBMjP4znGUlDcGYcdePw203XZqowwsrfDSWGVpb0SnqXcOZ90Un7RJGmfQRThv4clIbgrV7LN846mZKuUWVYtMLTJasCgcbFta6u8NhNH5e2Vi6QGrm9Exofap3mmhxNY'
};

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL = 'gemma3:4b';

const client = createClient(SANITY_CONFIG);

// --- Scoring logic (mirrors src/lib/utils/scoring.ts) ---

function getAverageApprovalRate(
	statsMap: Record<string, { totalReviews: number; approvedCount: number; approvalRate: number }>
): number {
	const curators = Object.values(statsMap);
	if (curators.length === 0) return 0.5;
	const totalApproved = curators.reduce((sum, s) => sum + s.approvedCount, 0);
	const totalReviews = curators.reduce((sum, s) => sum + s.totalReviews, 0);
	return totalReviews > 0 ? totalApproved / totalReviews : 0.5;
}

function calculateCuratorWeights(
	statsMap: Record<string, { totalReviews: number; approvedCount: number; approvalRate: number }>,
	volumeExponent: number,
	tendencyPenalty: number
): Record<string, { selected: number; maybe: number; rejected: number }> {
	const weights: Record<string, { selected: number; maybe: number; rejected: number }> = {};
	const avgRate = getAverageApprovalRate(statsMap);

	for (const [id, stats] of Object.entries(statsMap)) {
		const baseWeight = Math.log10(stats.totalReviews + 1) * volumeExponent;
		const deviation = stats.approvalRate - avgRate;
		const selectedMultiplier = Math.max(0.1, 1 - deviation * tendencyPenalty);
		const rejectedMultiplier = Math.max(0.1, 1 + deviation * tendencyPenalty);

		weights[id] = {
			selected: baseWeight * selectedMultiplier,
			maybe: baseWeight,
			rejected: baseWeight * rejectedMultiplier
		};
	}
	return weights;
}

function scoreMovie(
	movie: any,
	curatorWeights: Record<string, { selected: number; maybe: number; rejected: number }>
) {
	const reviews = movie.reviews || [];
	let weightedSum = 0;
	let totalWeight = 0;

	reviews.forEach((r: any) => {
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

	return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
}

// --- Data fetching ---

async function fetchAllData() {
	console.log('Fetching data from Sanity...');
	const query = `{
		"submissions": *[_type == "submission"]|order(englishTitle asc){
			_id,
			englishTitle,
			directorName,
			length,
			explicit,
			explicitDetails,
			aiUsed,
			aiExplanation,
			"poster": poster{ asset->{ _id, url } },
			"screenshots": screenshots[]{ asset->{ _id, url } },
			"reviews": *[_type == "review" && film._ref == ^._id]{
				_id,
				selection,
				rating,
				tags,
				contentNotes,
				"curatorId": curator._ref,
				"curatorName": curator->name
			}
		},
		"curators": *[_type == "curator" && defined(highlights) && count(highlights) > 0] {
			_id,
			name,
			highlights[]->{ _id }
		},
		"allReviews": *[_type == "review"]{
			"curatorId": curator._ref,
			selection
		},
		"settings": *[_type == "festivalSettings"][0]{
			selectedThreshold, maybeThreshold, volumeExponent, tendencyPenalty,
			vetoedSubmissions
		}
	}`;
	return await client.fetch(query);
}

// --- Ollama summary ---

async function generateSummary(data: {
	totalSubmissions: number;
	highlights: any[];
	selected: any[];
	maybe: any[];
	tagDistribution: Record<string, number>;
	totalRuntime: number;
	avgScore: number;
	selectedThreshold: number;
	maybeThreshold: number;
}) {
	console.log(`Asking Ollama (${MODEL}) to generate editorial summary...`);

	const topTags = Object.entries(data.tagDistribution)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 30)
		.map(([tag, count]) => `${tag} (${count})`)
		.join(', ');

	const highlightTitles = data.highlights
		.slice(0, 15)
		.map((h: any) => `"${h.title}" by ${h.director} (${h.length}min, score ${h.score}%)`)
		.join('; ');
	const selectedTitles = data.selected
		.slice(0, 10)
		.map((s: any) => `"${s.title}" by ${s.director} (${s.length}min, score ${s.score}%)`)
		.join('; ');

	const prompt = `You are writing an internal editorial brief for a short film festival jury. Use 'we' as you are writing on behalf of the curation team. Based on the data below, write a 2-3 paragraph summary that describes what has been submitted and what the curators have selected. Be factual, analytical, and concise — not promotional. Describe thematic patterns, formal tendencies, and notable characteristics. Don't be over empahtic or use flowery. Stay close to the facts. Mention specific films only if they exemplify a broader trend.

DATA:
- Total submissions: ${data.totalSubmissions}
- Curator highlights: ${data.highlights.length} films (${data.highlights.reduce((s: number, h: any) => s + (h.length || 0), 0)} min total)
- Selected (score >=${data.selectedThreshold}%): ${data.selected.length} films
- Maybe (${data.maybeThreshold}-${data.selectedThreshold}%): ${data.maybe.length} films
- Average weighted score across all reviewed films: ${data.avgScore.toFixed(1)}%
- Total runtime of highlights + selected: ${data.totalRuntime} minutes
- Most frequent curator tags: ${topTags}
- Top highlights: ${highlightTitles}
- Top selected: ${selectedTitles}

Return ONLY a JSON object: { "summary": "your 2-3 paragraph text here" }`;

	try {
		const response = await fetch(OLLAMA_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: MODEL,
				messages: [{ role: 'user', content: prompt }],
				stream: false,
				format: 'json'
			})
		});

		const result = await response.json();
		if (result.message?.content) {
			const parsed = JSON.parse(result.message.content);
			return parsed.summary || parsed.text || result.message.content;
		} else if (result.response) {
			const parsed = JSON.parse(result.response);
			return parsed.summary || parsed.text || result.response;
		}
		throw new Error('Unexpected Ollama response format');
	} catch (error) {
		console.error('Error generating summary:', error);
		return 'Summary generation failed. Run the update script again with Ollama running locally.';
	}
}

// --- Main ---

async function main() {
	const { submissions, curators, allReviews, settings } = await fetchAllData();
	console.log(
		`Fetched ${submissions.length} submissions, ${curators.length} curators with highlights`
	);

	// Festival selection parameters from settings (see FESTIVAL_SELECTION.md)
	const selectedThreshold = settings?.selectedThreshold || 60;
	const maybeThreshold = settings?.maybeThreshold || 35;
	const volumeExponent = settings?.volumeExponent ?? 1;
	const tendencyPenalty = settings?.tendencyPenalty ?? 2;

	// Build vetoed IDs set
	const vetoedIds = new Set<string>();
	settings?.vetoedSubmissions?.forEach((v: any) => {
		if ((v.vetoedFromCinema || v.vetoedFromTV) && v.submission?._ref) {
			vetoedIds.add(v.submission._ref);
		}
	});

	// 1. Build curator stats
	const curatorStats: Record<
		string,
		{ totalReviews: number; approvedCount: number; approvalRate: number }
	> = {};
	allReviews.forEach((r: any) => {
		if (!r.curatorId) return;
		if (!curatorStats[r.curatorId]) {
			curatorStats[r.curatorId] = { totalReviews: 0, approvedCount: 0, approvalRate: 0 };
		}
		curatorStats[r.curatorId].totalReviews++;
		if (r.selection === 'selected') curatorStats[r.curatorId].approvedCount++;
	});
	Object.values(curatorStats).forEach((stat) => {
		stat.approvalRate = stat.totalReviews > 0 ? stat.approvedCount / stat.totalReviews : 0;
	});

	const curatorWeights = calculateCuratorWeights(curatorStats, volumeExponent, tendencyPenalty);

	// 2. Build highlighted IDs set + curator map
	const highlightedIds = new Set<string>();
	const highlightCuratorMap = new Map<string, string[]>();
	curators.forEach((c: any) => {
		c.highlights?.forEach((h: any) => {
			if (!h?._id) return;
			highlightedIds.add(h._id);
			const existing = highlightCuratorMap.get(h._id) || [];
			existing.push(c.name);
			highlightCuratorMap.set(h._id, existing);
		});
	});

	// 3. Score and categorize all submissions
	// Festival Selection = (Highlighted OR Score >= Threshold) AND NOT Vetoed
	const tagDistribution: Record<string, number> = {};
	const highlights: any[] = [];
	const unanimous: any[] = [];
	const selected: any[] = [];
	const maybe: any[] = [];

	submissions.forEach((sub: any) => {
		// Skip vetoed films
		if (vetoedIds.has(sub._id)) return;

		const score = scoreMovie(sub, curatorWeights);
		const reviews = sub.reviews || [];

		// Collect tags
		const tags = reviews.flatMap((r: any) => r.tags || []);
		const uniqueTagLabels = [
			...new Set(tags.map((t: any) => t.label?.toLowerCase()).filter(Boolean))
		];
		uniqueTagLabels.forEach((tag) => {
			tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
		});

		// Compute flags
		const flags: any[] = [];
		if (sub.explicit)
			flags.push({
				label: 'EXPLICIT',
				details: sub.explicitDetails || 'Explicit content',
				color: 'text-red-700 bg-red-50 border-red-200'
			});
		if (sub.aiUsed)
			flags.push({
				label: 'AI',
				details: sub.aiExplanation || 'AI usage declared',
				color: 'text-purple-700 bg-purple-50 border-purple-200'
			});
		const contentNotes = [...new Set(reviews.flatMap((r: any) => r.contentNotes || []))].filter(
			(n: string) => n.toLowerCase() !== 'none'
		);
		if (contentNotes.length > 0)
			flags.push({
				label: 'WARNINGS',
				details: contentNotes.join(', '),
				color: 'text-orange-700 bg-orange-50 border-orange-200'
			});

		// Compute average rating
		const ratings = reviews.map((r: any) => r.rating).filter((r: any) => r != null);
		const avgRating =
			ratings.length > 0
				? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
				: null;

		const filmData = {
			_id: sub._id,
			title: sub.englishTitle,
			director: sub.directorName,
			length: sub.length,
			poster: sub.poster,
			screenshots: sub.screenshots,
			score: Math.round(score * 10) / 10,
			avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
			reviewCount: reviews.length,
			tags: uniqueTagLabels,
			flags,
			curatorCount: highlightCuratorMap.get(sub._id)?.length || 0,
			curators: highlightCuratorMap.get(sub._id) || []
		};

		if (highlightedIds.has(sub._id)) {
			highlights.push(filmData);
		}

		// Check for 100% approval (unanimous selection)
		const hasReviews = reviews.length > 0;
		const allSelected = hasReviews && reviews.every((r: any) => r.selection === 'selected');
		if (allSelected && hasReviews) {
			unanimous.push(filmData);
		}

		if (score >= selectedThreshold) {
			selected.push(filmData);
		} else if (score >= maybeThreshold) {
			maybe.push(filmData);
		}
	});

	// Sort
	highlights.sort((a, b) => b.curatorCount - a.curatorCount || b.score - a.score);
	unanimous.sort((a, b) => b.reviewCount - a.reviewCount || b.score - a.score);
	selected.sort((a, b) => b.score - a.score);
	maybe.sort((a, b) => b.score - a.score);

	console.log(
		`Highlights: ${highlights.length}, Unanimous: ${unanimous.length}, Selected: ${selected.length}, Maybe: ${maybe.length}`
	);

	// 4. Generate summary
	const totalRuntime = [...highlights, ...selected].reduce((sum, f) => sum + (f.length || 0), 0);
	const allScores = submissions
		.map((s: any) => scoreMovie(s, curatorWeights))
		.filter((s: number) => s > 0);
	const avgScore =
		allScores.length > 0
			? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length
			: 0;

	const summary = await generateSummary({
		totalSubmissions: submissions.length,
		highlights,
		selected,
		maybe,
		tagDistribution,
		totalRuntime,
		avgScore,
		selectedThreshold,
		maybeThreshold
	});

	console.log('\nGenerated summary:');
	console.log(summary);

	// 5. Build the festival selection: all selected films (highlights + score-based)
	// Festival Selection = (Highlighted OR Score >= Threshold) AND NOT Vetoed
	const allSelectedFilms = new Map<string, { score: number; method: 'highlight' | 'score' }>();
	highlights.forEach((f) => {
		allSelectedFilms.set(f._id, { score: 100, method: 'highlight' });
	});
	selected.forEach((f) => {
		if (!allSelectedFilms.has(f._id)) {
			allSelectedFilms.set(f._id, { score: f.score, method: 'score' });
		}
	});

	// 6. Persist festivalSelection to Sanity
	const generateKey = () => Math.random().toString(36).substring(2, 15);
	await client.createOrReplace({
		_id: 'festivalSelection',
		_type: 'festivalSelection',
		title: 'Festival Selection',
		computedAt: new Date().toISOString(),
		films: Array.from(allSelectedFilms.entries()).map(([id, { score, method }]) => ({
			_type: 'object',
			_key: generateKey(),
			film: { _type: 'reference', _ref: id },
			selectionScore: score,
			selectionMethod: method,
		})),
		highlightCount: highlights.length,
		scoreCount: selected.filter((f) => !highlightedIds.has(f._id)).length,
		vetoedCount: vetoedIds.size,
		totalCount: allSelectedFilms.size,
		selectedThreshold,
	});
	console.log(`\nFestival selection saved to Sanity (${allSelectedFilms.size} films)`);

	// 7. Save local JSON
	const outputData = {
		lastUpdated: new Date().toISOString(),
		summary,
		highlights,
		unanimous,
		selected,
		maybe
	};

	const outputPath = path.resolve(__dirname, '../src/lib/data/selection.json');
	fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
	console.log(`Saved selection data to ${outputPath}`);
}

main().catch(console.error);
