// src/lib/server/sanity.ts
import { createClient } from '@sanity/client';
import { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } from '$env/static/public';
import { SANITY_TOKEN } from '$env/static/private';

export const sanityClient = createClient({
	projectId: PUBLIC_SANITY_PROJECT_ID,
	dataset: PUBLIC_SANITY_DATASET,
	apiVersion: '2025-12-10', // or another fixed date
	useCdn: false,
	token: SANITY_TOKEN
});
