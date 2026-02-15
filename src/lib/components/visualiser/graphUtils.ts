export type NodeType = 'film' | 'meta-category' | 'cluster' | 'tag';
export type LinkType = 'film-meta' | 'film-cluster' | 'film-tag';
export type SizeMode = 'fixed' | 'score';
export type LabelMode = 'always' | 'hover' | 'never';
export type FilterMode = 'union' | 'intersection';

export interface GraphToggles {
	metaCategories: Record<string, boolean>;
	clusters: Record<string, boolean>;
	tags: Record<string, boolean>;
}

export interface DisplayOptions {
	sizeMode: SizeMode;
	labelMode: LabelMode;
	forceStrength: number;
	filterMode: FilterMode;
}

export interface GraphNode {
	id: string;
	type: NodeType;
	label: string;
	val: number;
	color: string;
	active: boolean;
	data: any;
}

export interface GraphLink {
	source: string;
	target: string;
	type: LinkType;
}

export interface GraphData {
	nodes: GraphNode[];
	links: GraphLink[];
	activeFilmIds: Set<string>;
}

export interface FilmNodeData {
	_id: string;
	englishTitle: string;
	directorName: string;
	length: number;
	score: number;
	tags: string[];
	[key: string]: any;
}

export interface MetaCategoryNodeData {
	_id: string;
	name: string;
	description: string;
	type: string;
	filmCount: number;
}

export interface ClusterNodeData {
	_id: string;
	name: string;
	description: string;
	keywords: string[];
	filmCount: number;
}

export interface TagNodeData {
	name: string;
	count: number;
}

const NODE_TYPE_COLORS: Record<NodeType, string> = {
	film: '#94a3b8',
	'meta-category': '#ff7411',
	cluster: '#a855f7',
	tag: '#78716c',
};

function getScoreColor(score: number): string {
	const s = Math.max(0, Math.min(100, score));
	if (s < 50) {
		const t = s / 50;
		const r = Math.round(239 + (245 - 239) * t);
		const g = Math.round(68 + (158 - 68) * t);
		const b = Math.round(68 + (11 - 68) * t);
		return `rgb(${r},${g},${b})`;
	}
	const t = (s - 50) / 50;
	const r = Math.round(245 + (34 - 245) * t);
	const g = Math.round(158 + (197 - 158) * t);
	const b = Math.round(11 + (94 - 11) * t);
	return `rgb(${r},${g},${b})`;
}

function getFilmSize(film: FilmNodeData, sizeMode: SizeMode): number {
	if (sizeMode === 'score') {
		return Math.max(1, film.score / 15);
	}
	return 2;
}

function hasAnyEnabled(toggleMap: Record<string, boolean>): boolean {
	return Object.values(toggleMap).some(Boolean);
}

/**
 * Compute which film IDs are "active" based on enabled toggles and filter mode.
 * - Union: film matches ANY enabled item across all groups
 * - Intersection: film must match at least one enabled item in EACH group that has enabled items
 * If no toggles are enabled at all, all films are active.
 */
export function computeActiveFilmIds(
	films: FilmNodeData[],
	metaCategories: { _id: string; filmIds: { filmId: string }[] }[],
	clusters: { _id: string; highlightedFilmIds: string[]; relevantFilmIds: string[] }[],
	toggles: GraphToggles,
	filterMode: FilterMode
): Set<string> {
	const hasMc = hasAnyEnabled(toggles.metaCategories);
	const hasCl = hasAnyEnabled(toggles.clusters);
	const hasTag = hasAnyEnabled(toggles.tags);

	if (!hasMc && !hasCl && !hasTag) {
		return new Set(films.map((f) => f._id));
	}

	// Collect per-group sets
	const groupSets: Set<string>[] = [];

	if (hasMc) {
		const mcSet = new Set<string>();
		for (const mc of metaCategories) {
			if (!toggles.metaCategories[mc._id]) continue;
			for (const entry of mc.filmIds) mcSet.add(entry.filmId);
		}
		groupSets.push(mcSet);
	}

	if (hasCl) {
		const clSet = new Set<string>();
		for (const cluster of clusters) {
			if (!toggles.clusters[cluster._id]) continue;
			for (const id of [...cluster.highlightedFilmIds, ...cluster.relevantFilmIds]) {
				clSet.add(id);
			}
		}
		groupSets.push(clSet);
	}

	if (hasTag) {
		const tagSet = new Set<string>();
		for (const film of films) {
			for (const tag of film.tags) {
				const normalized = tag.toLowerCase().trim();
				if (toggles.tags[normalized]) {
					tagSet.add(film._id);
					break;
				}
			}
		}
		groupSets.push(tagSet);
	}

	if (filterMode === 'intersection') {
		// Film must appear in ALL group sets
		const [first, ...rest] = groupSets;
		const result = new Set<string>();
		for (const id of first) {
			if (rest.every((s) => s.has(id))) result.add(id);
		}
		return result;
	}

	// Union: film appears in ANY group set
	const result = new Set<string>();
	for (const s of groupSets) {
		for (const id of s) result.add(id);
	}
	return result;
}

export function buildGraphData(
	films: FilmNodeData[],
	metaCategories: { _id: string; name: string; description: string; type: string; filmIds: { filmId: string; score: number }[] }[],
	clusters: { _id: string; name: string; description: string; keywords: string[]; highlightedFilmIds: string[]; relevantFilmIds: string[] }[],
	toggles: GraphToggles,
	displayOptions: DisplayOptions
): GraphData {
	const nodes: GraphNode[] = [];
	const links: GraphLink[] = [];
	const filmIdSet = new Set(films.map((f) => f._id));

	const activeFilmIds = computeActiveFilmIds(films, metaCategories, clusters, toggles, displayOptions.filterMode);

	// Film nodes — always present, marked active/inactive
	for (const film of films) {
		const active = activeFilmIds.has(film._id);
		nodes.push({
			id: film._id,
			type: 'film',
			label: film.englishTitle,
			val: getFilmSize(film, displayOptions.sizeMode),
			color: getScoreColor(film.score),
			active,
			data: film,
		});
	}

	// Meta-category nodes + links — only shown when enabled
	for (const mc of metaCategories) {
		if (!toggles.metaCategories[mc._id]) continue;
		const validFilmIds = mc.filmIds.filter((e) => filmIdSet.has(e.filmId));
		if (validFilmIds.length === 0) continue;

		nodes.push({
			id: `mc-${mc._id}`,
			type: 'meta-category',
			label: mc.name,
			val: 6,
			color: NODE_TYPE_COLORS['meta-category'],
			active: true,
			data: {
				_id: mc._id,
				name: mc.name,
				description: mc.description,
				type: mc.type,
				filmCount: validFilmIds.length,
			} as MetaCategoryNodeData,
		});

		for (const entry of validFilmIds) {
			links.push({
				source: entry.filmId,
				target: `mc-${mc._id}`,
				type: 'film-meta',
			});
		}
	}

	// Cluster nodes + links — only shown when enabled
	for (const cluster of clusters) {
		if (!toggles.clusters[cluster._id]) continue;
		const allFilmIds = [
			...cluster.highlightedFilmIds,
			...cluster.relevantFilmIds,
		].filter((id) => filmIdSet.has(id));
		const uniqueFilmIds = [...new Set(allFilmIds)];
		if (uniqueFilmIds.length === 0) continue;

		nodes.push({
			id: `cl-${cluster._id}`,
			type: 'cluster',
			label: cluster.name,
			val: 5,
			color: NODE_TYPE_COLORS.cluster,
			active: true,
			data: {
				_id: cluster._id,
				name: cluster.name,
				description: cluster.description,
				keywords: cluster.keywords,
				filmCount: uniqueFilmIds.length,
			} as ClusterNodeData,
		});

		for (const filmId of uniqueFilmIds) {
			links.push({
				source: filmId,
				target: `cl-${cluster._id}`,
				type: 'film-cluster',
			});
		}
	}

	// Tag nodes + links — only shown when individually enabled
	if (hasAnyEnabled(toggles.tags)) {
		const tagFilms = new Map<string, string[]>();
		for (const film of films) {
			for (const tag of film.tags) {
				const normalized = tag.toLowerCase().trim();
				if (!normalized) continue;
				if (!tagFilms.has(normalized)) tagFilms.set(normalized, []);
				tagFilms.get(normalized)!.push(film._id);
			}
		}

		for (const [tag, filmIds] of tagFilms) {
			if (filmIds.length < 2) continue;
			if (!toggles.tags[tag]) continue;

			nodes.push({
				id: `tag-${tag}`,
				type: 'tag',
				label: tag,
				val: Math.max(0.5, Math.min(3, filmIds.length / 10)),
				color: NODE_TYPE_COLORS.tag,
				active: true,
				data: { name: tag, count: filmIds.length } as TagNodeData,
			});

			for (const filmId of filmIds) {
				links.push({
					source: filmId,
					target: `tag-${tag}`,
					type: 'film-tag',
				});
			}
		}
	}

	return { nodes, links, activeFilmIds };
}

/** Collect all unique tags used in 2+ films */
export function collectTags(films: FilmNodeData[]): { name: string; count: number }[] {
	const tagCounts = new Map<string, number>();
	for (const film of films) {
		for (const tag of film.tags) {
			const normalized = tag.toLowerCase().trim();
			if (!normalized) continue;
			tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
		}
	}
	return [...tagCounts.entries()]
		.filter(([, count]) => count >= 2)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
}

export function dimColor(hex: string, amount = 0.15): string {
	if (hex.startsWith('rgb')) {
		const match = hex.match(/(\d+)/g);
		if (match) {
			const [r, g, b] = match.map(Number);
			return `rgba(${r},${g},${b},${amount})`;
		}
	}
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r},${g},${b},${amount})`;
}

export function formatDuration(minutes: number): string {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	if (h === 0) return `${m}m`;
	return `${h}h ${m}m`;
}
