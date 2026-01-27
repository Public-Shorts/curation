
import { createClient } from '@sanity/client';

const client = createClient({
    projectId: "0ome5qpf",
    dataset: "production",
    apiVersion: '2025-12-10',
    useCdn: false,
    token: "skZobMkCaSnrhX51E7cD40Gs7qBiHR8XTK1x2E0XsEgtW0isaJhMBMjP4znGUlDcGYcdePw203XZqowwsrfDSWGVpb0SnqXcOZ90Un7RJGmfQRThv4clIbgrV7LN846mZKuUWVYtMLTJasCgcbFta6u8NhNH5e2Vi6QGrm9Exofap3mmhxNY"
});

async function main() {
    const query = `{
        "highlights": *[_type == "curator" && defined(highlights) && count(highlights) > 0] {
            highlights[]->{
                _id,
                englishTitle,
                "reviews": *[_type == "review" && film._ref == ^._id]{
                  tags
                }
            }
        },
        "allTags": *[_type == "review"] { tags }
    }`;

    const data = await client.fetch(query);

    const highlightTags = new Set();
    data.highlights.forEach(c => {
        c.highlights?.forEach(m => {
            m.reviews?.forEach(r => {
                r.tags?.forEach(t => highlightTags.add(t.label));
            });
        });
    });

    const allTags = new Set();
    data.allTags.forEach(r => {
        r.tags?.forEach(t => allTags.add(t.label));
    });

    console.log("Highlighted Tags Count:", highlightTags.size);
    console.log("Highlighted Tags:", Array.from(highlightTags).sort());
    console.log("Total Unique Tags Count:", allTags.size);
}

main().catch(console.error);
