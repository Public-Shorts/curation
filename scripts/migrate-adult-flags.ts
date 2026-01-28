
import { createClient } from '@sanity/client';

// CONFIG
const SANITY_CONFIG = {
    projectId: "0ome5qpf",
    dataset: "production",
    apiVersion: '2025-12-10',
    useCdn: false,
    token: "skZobMkCaSnrhX51E7cD40Gs7qBiHR8XTK1x2E0XsEgtW0isaJhMBMjP4znGUlDcGYcdePw203XZqowwsrfDSWGVpb0SnqXcOZ90Un7RJGmfQRThv4clIbgrV7LN846mZKuUWVYtMLTJasCgcbFta6u8NhNH5e2Vi6QGrm9Exofap3mmhxNY"
};

const client = createClient(SANITY_CONFIG);

async function main() {
    console.log("Fetching submissions and their reviews...");

    // Fetch all submissions and their associated reviews' contentNotes
    const query = `*[_type == "submission"] {
        _id,
        englishTitle,
        adult,
        explicit,
        "reviews": *[_type == "review" && film._ref == ^._id] {
            contentNotes
        }
    }`;

    const submissions = await client.fetch(query);
    console.log(`Checking ${submissions.length} submissions...`);

    const adultTriggerNotes = [
        'drugAlcoholUse',
        'horrorDisturbingImages',
        'sexualContent',
        'strongLanguage'
    ];

    let updatedCount = 0;

    for (const sub of submissions) {
        const anyReviewHasAdultFlag = sub.reviews?.some((r: any) =>
            r.contentNotes?.some((note: string) => adultTriggerNotes.includes(note))
        );

        // If it should be adult but isn't, or if it shouldn't be adult but IS (based on reviews)
        // Note: Manual adult flag is preserved because we don't have a way to distinguish manual vs automatic in the past,
        // but we assume if reviews don't have it, and user didn't check it, it shouldn't be there.
        // Actually, the requirement is "ALL videos that have been flagged ... should automatically get marked as adult".
        // It doesn't say "if NOT flagged, unmark". But usually it's implied for consistency.

        const shouldBeAdult = anyReviewHasAdultFlag || sub.explicit === true || sub.adult === true;

        if (shouldBeAdult && !sub.adult) {
            console.log(`Marking "${sub.englishTitle}" as adult (Explicit: ${sub.explicit || 'false'})...`);
            await client.patch(sub._id).set({ adult: true }).commit();
            updatedCount++;
        }
    }

    console.log(`Migration complete. Updated ${updatedCount} submissions.`);
}

main().catch(console.error);
