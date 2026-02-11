import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const SANITY_CONFIG = {
	projectId: process.env.PUBLIC_SANITY_PROJECT_ID || "0ome5qpf",
	dataset: process.env.PUBLIC_SANITY_DATASET || "production",
	token: process.env.SANITY_TOKEN,
	useCdn: false,
	apiVersion: "2023-05-03",
};

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "gemma3:4b";

const client = createClient(SANITY_CONFIG);

async function getSuggestionsFromLLM(screenings: any[], allTags: string[]) {
	const prompt = `You are a strict film festival curator. Map tags to screening titles with HIGH precision.

RULES - BE HARSH:
- Only include tags with DIRECT, OBVIOUS relevance to the screening title
- Maximum 3-5 tags per screening - quality over quantity
- Skip generic tags that could apply to anything
- The screening TITLE is the PRIMARY signal - match tags that clearly relate to it
- Tags from already-assigned videos are only hints, don't blindly include them

SCREENINGS:
${screenings.map(s => `- "${s.title}"${s.assignedTags?.length ? ` (assigned videos have: ${s.assignedTags.join(', ')})` : ''}`).join('\n')}

AVAILABLE TAGS:
${allTags.join(', ')}

Return JSON: screening titles as keys, arrays of 3-5 highly relevant tags as values.
Be selective. If a tag isn't clearly relevant, exclude it.

Example (notice the strict selection):
{
  "weird tech": ["glitch", "digital", "technology"],
  "body": ["dance", "physical", "movement"]
}

Only use tags from the list. Return valid JSON only.`;

	try {
		const response = await fetch(OLLAMA_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				model: MODEL,
				messages: [{ role: "user", content: prompt }],
				stream: false,
				format: "json",
			}),
		});

		const data = await response.json();
		if (data.message && data.message.content) {
			return JSON.parse(data.message.content);
		}
		throw new Error("Unexpected LLM response format");
	} catch (error) {
		console.error("Error communicating with LLM:", error);
		return {};
	}
}

async function main() {
	console.log("Fetching data from Sanity...");

	// Fetch screenings with their assigned videos
	const screenings = await client.fetch(`
		*[_type == "screening"] {
			_id,
			title
		}
	`);

	// Fetch all submissions with their assigned screening
	const submissions = await client.fetch(`
		*[_type == "submission"] {
			_id,
			assignedScreening
		}
	`);

	// Fetch all reviews with tags (curator-assigned tags)
	const reviews = await client.fetch(`
		*[_type == "review" && defined(tags)] {
			film->{_id},
			tags
		}
	`);

	// Build a map of submission ID -> curator tags
	const submissionTags: Record<string, string[]> = {};
	for (const review of reviews) {
		if (!review.film?._id || !review.tags) continue;
		const filmId = review.film._id;
		const tags = Array.isArray(review.tags)
			? review.tags.map((t: any) => typeof t === 'string' ? t : t.label || t.value).filter(Boolean)
			: [];
		if (!submissionTags[filmId]) submissionTags[filmId] = [];
		submissionTags[filmId].push(...tags);
	}

	// Dedupe tags per submission
	for (const id of Object.keys(submissionTags)) {
		submissionTags[id] = [...new Set(submissionTags[id])];
	}

	// Collect all unique tags
	const allTags = [...new Set(Object.values(submissionTags).flat())].filter(Boolean);

	// For each screening, find tags from already-assigned videos
	const screeningsWithTags = screenings.map((screening: any) => {
		const assignedSubmissions = submissions.filter(
			(s: any) => s.assignedScreening?._ref === screening._id
		);
		const assignedTags = [...new Set(
			assignedSubmissions.flatMap((s: any) => submissionTags[s._id] || [])
		)];
		return {
			...screening,
			assignedTags
		};
	});

	if (screenings.length === 0) {
		console.warn("No screenings found. Please create some first.");
		return;
	}

	if (allTags.length === 0) {
		console.warn("No curator tags found in reviews. Curators need to tag some videos first.");
		return;
	}

	console.log(`Found ${screenings.length} screenings and ${allTags.length} unique curator tags.`);
	console.log(`Tags: ${allTags.slice(0, 20).join(', ')}${allTags.length > 20 ? '...' : ''}`);
	console.log(`\nAsking LLM (${MODEL}) to map tags to screenings...`);

	const suggestions = await getSuggestionsFromLLM(screeningsWithTags, allTags);

	const outputPath = path.resolve("src/lib/data/suggestions.json");
	fs.writeFileSync(outputPath, JSON.stringify(suggestions, null, 2));

	console.log(`\nSaved suggestions to ${outputPath}`);
	console.log("Suggestions:", JSON.stringify(suggestions, null, 2));
}

main().catch(console.error);
