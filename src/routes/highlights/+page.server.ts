import type { PageServerLoad } from './$types';
import { sanityClient } from '$lib/server/sanity';
import { calculateCuratorWeights, scoreMovies } from '$lib/utils/scoring';

export const load: PageServerLoad = async ({ locals }) => {
  // 1. Fetch data needed for highlights and scoring
  const query = `{
    "curators": *[_type == "curator" && defined(highlights) && count(highlights) > 0] {
      _id,
      name,
      highlights[]->{
        _id,
        _createdAt,
        englishTitle,
        originalTitle,
        directorName,
        length,
        categories,
        yearOfCompletion,
        synopsis,
        explicit,
        explicitDetails,
        aiUsed,
        aiExplanation,
        "screenshots": screenshots[]{
          asset->{
            _id,
            url
          }
        },
        "poster": poster{
          asset->{
            _id,
            url
          }
        },
        "reviews": *[_type == "review" && film._ref == ^._id]{
          _id,
          selection,
          rating,
          tags,
          contentNotes,
          "curatorId": curator._ref,
          "curatorName": curator->name
        }
      }
    },
    "curatorStatsRaw": *[_type == "review"]{
      "curatorId": curator._ref,
      selection
    },
    "vetoedIds": *[_type == "festivalSettings"][0].vetoedSubmissions[
      vetoedFromCinema == true || vetoedFromTV == true
    ].submission->_id,
    "isAdmin": *[_type == "curator" && _id == $curatorId][0].admin
  }`;

  const { curators, curatorStatsRaw, vetoedIds, isAdmin } = await sanityClient.fetch(query, {
    curatorId: locals.curatorId || ''
  });

  // 2. Filter out vetoed submissions from curators' highlights
  const vetoedSet = new Set(vetoedIds || []);
  curators.forEach((curator: any) => {
    if (curator.highlights) {
      curator.highlights = curator.highlights.filter(
        (submission: any) => submission && !vetoedSet.has(submission._id)
      );
    }
  });

  // 3. Calculate Global Curator Stats for Weighting
  const curatorStatsMap: Record<string, { totalReviews: number; approvedCount: number; approvalRate: number }> = {};
  curatorStatsRaw.forEach((r: any) => {
    if (!r.curatorId) return;
    if (!curatorStatsMap[r.curatorId]) {
      curatorStatsMap[r.curatorId] = { totalReviews: 0, approvedCount: 0, approvalRate: 0 };
    }
    curatorStatsMap[r.curatorId].totalReviews++;
    if (r.selection === 'selected') {
      curatorStatsMap[r.curatorId].approvedCount++;
    }
  });

  Object.values(curatorStatsMap).forEach((stat) => {
    stat.approvalRate = stat.totalReviews > 0 ? stat.approvedCount / stat.totalReviews : 0;
  });

  const curatorWeights = calculateCuratorWeights(curatorStatsMap, 1, 4); // Default presets from selection page

  // 4. Aggregate highlights: create a map of submission -> curators and enriched data
  const highlightMap = new Map<string, any>();

  curators.forEach((curator: any) => {
    curator.highlights?.forEach((submission: any) => {
      if (!submission) return;

      if (!highlightMap.has(submission._id)) {
        // Use scoreMovies to calculate weighted score and flags
        const [scoredMovie] = scoreMovies([submission], curatorWeights);

        // Aggregate unique tags from all reviews
        const allTags = (submission.reviews || []).flatMap((r: any) => r.tags || []);
        const uniqueTags = Array.from(new Set(allTags.map((t: any) => t.label)))
          .map(label => allTags.find((t: any) => t.label === label));

        // Calculate average rating (unweighted as it's just for display)
        const ratings = (submission.reviews || [])
          .map((r: any) => r.rating)
          .filter((r: any) => r !== null && r !== undefined);
        const avgRating = ratings.length > 0
          ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
          : null;

        highlightMap.set(submission._id, {
          submission: scoredMovie,
          curators: [],
          avgRating,
          uniqueTags
        });
      }

      highlightMap.get(submission._id).curators.push({
        _id: curator._id,
        name: curator.name
      });
    });
  });

  // Convert map to array
  const highlights = Array.from(highlightMap.values());

  // 5. Calculate stats
  const totalMinutes = highlights.reduce((sum, h) => sum + (h.submission.length || 0), 0);
  const totalSpentByCurators = highlights.reduce((sum, h) => sum + h.curators.length, 0);

  const stats = {
    totalHighlights: highlights.length,
    totalCurators: curators.length,
    totalVideos: totalSpentByCurators,
    totalMinutes,
    totalHours: Math.floor(totalMinutes / 60),
    totalMins: totalMinutes % 60,
    mostHighlighted: [...highlights].sort((a, b) => b.curators.length - a.curators.length)[0] || null,
    averageHighlightsPerVideo:
      highlights.length > 0 ? (totalSpentByCurators / highlights.length).toFixed(1) : 0
  };

  return {
    highlights,
    stats,
    isAdmin: isAdmin || false
  };
};
