import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const submissions = await sanityClient.fetch(
		`*[_type == "submission"]
      | order(_createdAt desc){
        _id,
        englishTitle,
        filmLanguage,
        categories,
        categoryOther,
        length,
        _createdAt,
        // All reviews for this submission
        "reviews": *[_type == "review" && references(^._id)]{
          _id,
          selection,
          rating,
          curator->{
            _id,
            name
          }
        }
      }`
	);

	return { submissions };
};
