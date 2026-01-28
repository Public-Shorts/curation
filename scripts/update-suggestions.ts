import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const SANITY_CONFIG = {
    projectId: process.env.PUBLIC_SANITY_PROJECT_ID || "0ome5qpf",
    dataset: process.env.PUBLIC_SANITY_DATASET || "production",
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
    apiVersion: "2023-05-03",
};

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "gemma3:4b";

const client = createClient(SANITY_CONFIG);

async function getSuggestionsFromLLM(categories: any[], allTags: string[]) {
    const prompt = `
        You are an expert film festival curator. I have a list of categories and a list of tags from film submissions.
        Your goal is to map these tags to the most relevant categories.
        
        Categories:
        ${categories.map(c => `- ${c.name} (${c.description || ''}) - Keywords: ${c.keywords?.join(', ') || 'N/A'}`).join('\n')}
        
        Tags to map:
        ${allTags.join(', ')}
        
        Return a JSON object where keys are category names and values are arrays of relevant tags from the list provided.
        Example format:
        {
          "Category Name": ["tag1", "tag2"],
          "Another Category": ["tag3"]
        }
        
        Only use tags from the provided list. Be selective.
    `;

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
    console.log("Fetching categories and tags from Sanity...");

    // Fetch existing categories
    const categories = await client.fetch(`*[_type == "category"] { name, description, keywords }`);

    // Fetch all tags from submissions
    const submissions = await client.fetch(`*[_type == "submission"] { tags }`);
    const allTags = Array.from(new Set<string>(submissions.flatMap((s: any) => (s.tags as string[]) || []))).filter(Boolean);

    if (categories.length === 0) {
        console.warn("No categories found in Sanity. Please create some first.");
        return;
    }

    console.log(`Found ${categories.length} categories and ${allTags.length} unique tags.`);
    console.log(`Asking LLM (${MODEL}) to map tags to categories...`);

    const suggestions = await getSuggestionsFromLLM(categories, allTags);

    const outputPath = path.resolve("src/lib/data/suggestions.json");
    fs.writeFileSync(outputPath, JSON.stringify(suggestions, null, 2));

    console.log(`Saved suggestions to ${outputPath}`);
}

main().catch(console.error);
