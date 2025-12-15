import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	// must match the options you used when setting the cookie
	cookies.delete('jury_session', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true
	});

	throw redirect(303, '/login');
};
