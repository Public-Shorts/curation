// src/lib/utils/sanityImage.ts
import { createImageUrlBuilder } from '@sanity/image-url'; // Use named export
import { publicClient } from '$lib/sanity.client'; // Adjust path to your client
import type { SanityImageSource } from '@sanity/image-url';

const builder = createImageUrlBuilder(publicClient);

export function urlFor(source: SanityImageSource) {
	return builder.image(source);
}
