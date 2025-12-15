import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.curatorId) throw redirect(303, '/login');

	const curatorId = locals.curatorId;

	const curatorStats = await sanityClient.fetch(
		`{
      "curator": *[_type == "curator" && _id == $curatorId][0]{ _id, name },
      "totalReviews": count(*[_type == "review" && curator._ref == $curatorId]),
      "approvedReviews": count(*[_type == "review" && curator._ref == $curatorId && selection == "selected"])
    }`,
		{ curatorId }
	);

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

	return { curatorStats, submissions };
};
