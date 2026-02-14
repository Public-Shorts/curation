import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { sanityClient } from '$lib/server/sanity';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is logged in
	if (!locals.curatorId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user is admin
	const curator = await sanityClient.fetch(
		`*[_type == "curator" && _id == $curatorId][0]{ admin }`,
		{ curatorId: locals.curatorId }
	);

	if (!curator?.admin) {
		return json({ error: 'Only admins can veto submissions' }, { status: 403 });
	}

	// Parse request body
	const body = await request.json();
	const { submissionId, reason, vetoedFromCinema, vetoedFromTV } = body;

	// Validate required fields
	if (!submissionId || typeof submissionId !== 'string') {
		return json({ error: 'Invalid submission ID' }, { status: 400 });
	}

	if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
		return json({ error: 'Reason must be at least 5 characters' }, { status: 400 });
	}

	// Validate that at least one veto flag is true
	if (!vetoedFromCinema && !vetoedFromTV) {
		return json({ error: 'Must veto from at least cinema or TV' }, { status: 400 });
	}

	try {
		// Get festival settings and check if submission is already vetoed
		let settings = await sanityClient.fetch(
			`*[_type == "festivalSettings"][0]{
				_id,
				"existingVeto": vetoedSubmissions[submission._ref == $submissionId][0]
			}`,
			{ submissionId }
		);

		if (!settings?._id) {
			// Create festival settings if it doesn't exist
			await sanityClient.create({
				_type: 'festivalSettings',
				title: 'Festival Settings',
				selectedThreshold: 60,
				maybeThreshold: 35,
				volumeExponent: 1,
				tendencyPenalty: 2,
				vetoedSubmissions: [],
			});

			// Fetch again to get the ID
			settings = await sanityClient.fetch(`*[_type == "festivalSettings"][0]{ _id }`);
		}

		if (settings.existingVeto) {
			// Update existing veto
			await sanityClient
				.patch(settings._id)
				.set({
					[`vetoedSubmissions[submission._ref == "${submissionId}"].vetoedFromCinema`]:
						vetoedFromCinema,
					[`vetoedSubmissions[submission._ref == "${submissionId}"].vetoedFromTV`]: vetoedFromTV,
					[`vetoedSubmissions[submission._ref == "${submissionId}"].reason`]: reason.trim(),
				})
				.commit();
		} else {
			// Add new veto
			const vetoEntry = {
				_key: crypto.randomUUID(),
				submission: { _ref: submissionId, _type: 'reference' },
				vetoedFromCinema: vetoedFromCinema || false,
				vetoedFromTV: vetoedFromTV || false,
				reason: reason.trim(),
				vetoedBy: { _ref: locals.curatorId, _type: 'reference' },
				vetoedAt: new Date().toISOString(),
			};

			await sanityClient
				.patch(settings._id)
				.setIfMissing({ vetoedSubmissions: [] })
				.append('vetoedSubmissions', [vetoEntry])
				.commit();
		}

		return json({ success: true });
	} catch (error) {
		console.error('Failed to veto submission:', error);
		return json({ error: 'Failed to veto submission' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	// Check if user is logged in
	if (!locals.curatorId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user is admin
	const curator = await sanityClient.fetch(
		`*[_type == "curator" && _id == $curatorId][0]{ admin }`,
		{ curatorId: locals.curatorId }
	);

	if (!curator?.admin) {
		return json({ error: 'Only admins can remove vetos' }, { status: 403 });
	}

	// Parse request body
	const body = await request.json();
	const { submissionId } = body;

	// Validate required fields
	if (!submissionId || typeof submissionId !== 'string') {
		return json({ error: 'Invalid submission ID' }, { status: 400 });
	}

	try {
		// Get festival settings
		const settings = await sanityClient.fetch(`*[_type == "festivalSettings"][0]{ _id }`);

		if (!settings?._id) {
			return json({ error: 'No settings found' }, { status: 404 });
		}

		// Remove veto entry
		await sanityClient
			.patch(settings._id)
			.unset([`vetoedSubmissions[submission._ref == "${submissionId}"]`])
			.commit();

		return json({ success: true });
	} catch (error) {
		console.error('Failed to remove veto:', error);
		return json({ error: 'Failed to remove veto' }, { status: 500 });
	}
};
