// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const curatorId = event.cookies.get('jury_session');

	if (curatorId) {
		event.locals.curatorId = curatorId;
	}

	const isAuthRoute = event.url.pathname === '/login' || event.url.pathname.startsWith('/api/auth');

	if (!curatorId && !isAuthRoute) {
		return Response.redirect(new URL('/login', event.url), 303);
	}

	return resolve(event);
};
