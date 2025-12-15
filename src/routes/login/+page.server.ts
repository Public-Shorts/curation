// src/routes/login/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.curatorId) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const code = data.get('code')?.toString().trim();

		if (!code) {
			return fail(400, { error: 'Please enter your code.' });
		}

		const query = `*[_type == "curator" && loginCode == $code][0]{ _id }`;
		const curator = await sanityClient.fetch(query, { code });

		if (!curator?._id) {
			return fail(401, { error: 'Invalid code.' });
		}

		cookies.set('jury_session', curator._id, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(303, '/');
	}
};
