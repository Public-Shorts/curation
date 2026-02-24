export type NodeType = 'film' | 'meta-category' | 'cluster' | 'tag' | 'screening';
export type LinkType = 'film-meta' | 'film-cluster' | 'film-tag' | 'film-screening';
export type SizeMode = 'connections' | 'fixed' | 'score';
export type LabelMode = 'always' | 'hover' | 'never';
export type FilterMode = 'union' | 'intersection';

export interface GraphToggles {
	metaCategories: Record<string, boolean>;
	clusters: Record<string, boolean>;
	tags: Record<string, boolean>;
	screenings: Record<string, boolean>;
}

export interface DisplayOptions {
	sizeMode: SizeMode;
	labelMode: LabelMode;
	forceStrength: number;
	filterMode: FilterMode;
	showMetaCategories: boolean;
	showClusters: boolean;
	showTags: boolean;
	showScreenings: boolean;
}

export interface GraphNode {
	id: string;
	type: NodeType;
	label: string;
	val: number;
	color: string;
	active: boolean;
	visible: boolean;
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

export interface ScreeningNodeData {
	_id: string;
	name: string;
	filmCount: number;
}

const NODE_TYPE_COLORS: Record<NodeType, string> = {
	film: '#94a3b8',
	'meta-category': '#ff7411',
	cluster: '#a855f7',
	tag: '#78716c',
	screening: '#eab308',
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

function getFilmSize(film: FilmNodeData, sizeMode: SizeMode, connectionCount?: number): number {
	if (sizeMode === 'score') {
		return Math.max(1, film.score / 15);
	}
	if (sizeMode === 'connections' && connectionCount != null) {
		return Math.max(1, connectionCount * 0.8);
	}
	return 2;
}

function hasAnyEnabled(toggleMap: Record<string, boolean>): boolean {
	return Object.values(toggleMap).some(Boolean);
}

/**
 * Compute which film IDs are "active" based on enabled toggles and filter mode.
 * - Union: film matches ANY enabled item
 * - Intersection: each enabled item narrows the result (film must match ALL)
 * If no toggles are enabled at all, all films are active.
 */
export function computeActiveFilmIds(
	films: FilmNodeData[],
	metaCategories: { _id: string; filmIds: { filmId: string }[] }[],
	clusters: { _id: string; highlightedFilmIds: string[]; relevantFilmIds: string[] }[],
	screenings: { _id: string; filmIds: string[] }[],
	toggles: GraphToggles,
	displayOptions: DisplayOptions
): Set<string> {
	const hasMc = displayOptions.showMetaCategories && hasAnyEnabled(toggles.metaCategories);
	const hasCl = displayOptions.showClusters && hasAnyEnabled(toggles.clusters);
	const hasTag = displayOptions.showTags && hasAnyEnabled(toggles.tags);
	const hasSc = displayOptions.showScreenings && hasAnyEnabled(toggles.screenings);

	if (!hasMc && !hasCl && !hasTag && !hasSc) {
		return new Set(films.map((f) => f._id));
	}

	// Collect per-item film sets
	const itemSets: Set<string>[] = [];

	if (hasMc) for (const mc of metaCategories) {
		if (!toggles.metaCategories[mc._id]) continue;
		itemSets.push(new Set(mc.filmIds.map((e) => e.filmId)));
	}

	if (hasCl) for (const cluster of clusters) {
		if (!toggles.clusters[cluster._id]) continue;
		itemSets.push(new Set([...cluster.highlightedFilmIds, ...cluster.relevantFilmIds]));
	}

	if (hasTag) {
		const tagFilmMap = new Map<string, Set<string>>();
		for (const film of films) {
			for (const tag of film.tags) {
				const normalized = tag.toLowerCase().trim();
				if (!toggles.tags[normalized]) continue;
				if (!tagFilmMap.has(normalized)) tagFilmMap.set(normalized, new Set());
				tagFilmMap.get(normalized)!.add(film._id);
			}
		}
		for (const filmSet of tagFilmMap.values()) {
			itemSets.push(filmSet);
		}
	}

	if (hasSc) for (const screening of screenings) {
		if (!toggles.screenings[screening._id]) continue;
		itemSets.push(new Set(screening.filmIds));
	}

	if (itemSets.length === 0) {
		return new Set(films.map((f) => f._id));
	}

	if (displayOptions.filterMode === 'intersection') {
		// Film must appear in EVERY enabled item's set
		const [first, ...rest] = itemSets;
		const result = new Set<string>();
		for (const id of first) {
			if (rest.every((s) => s.has(id))) result.add(id);
		}
		return result;
	}

	// Union: film appears in ANY item's set
	const result = new Set<string>();
	for (const s of itemSets) {
		for (const id of s) result.add(id);
	}
	return result;
}

export function buildGraphData(
	films: FilmNodeData[],
	metaCategories: { _id: string; name: string; description: string; type: string; filmIds: { filmId: string; score: number }[] }[],
	clusters: { _id: string; name: string; description: string; keywords: string[]; highlightedFilmIds: string[]; relevantFilmIds: string[] }[],
	screenings: { _id: string; name: string; filmIds: string[] }[],
	toggles: GraphToggles,
	displayOptions: DisplayOptions
): GraphData {
	const nodes: GraphNode[] = [];
	const links: GraphLink[] = [];
	const filmIdSet = new Set(films.map((f) => f._id));

	const activeFilmIds = computeActiveFilmIds(films, metaCategories, clusters, screenings, toggles, displayOptions);

	// Film nodes — always present and visible, marked active/inactive
	for (const film of films) {
		const active = activeFilmIds.has(film._id);
		nodes.push({
			id: film._id,
			type: 'film',
			label: film.englishTitle,
			val: getFilmSize(film, displayOptions.sizeMode),
			color: getScoreColor(film.score),
			active,
			visible: true,
			data: film,
		});
	}

	// Meta-category nodes + links
	if (displayOptions.showMetaCategories)
	for (const mc of metaCategories) {
		const validFilmIds = mc.filmIds.filter((e) => filmIdSet.has(e.filmId));
		if (validFilmIds.length === 0) continue;
		const enabled = !!toggles.metaCategories[mc._id];

		nodes.push({
			id: `mc-${mc._id}`,
			type: 'meta-category',
			label: mc.name,
			val: 6,
			color: NODE_TYPE_COLORS['meta-category'],
			active: enabled,
			visible: true,
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

	// Cluster nodes + links
	if (displayOptions.showClusters)
	for (const cluster of clusters) {
		const allFilmIds = [
			...cluster.highlightedFilmIds,
			...cluster.relevantFilmIds,
		].filter((id) => filmIdSet.has(id));
		const uniqueFilmIds = [...new Set(allFilmIds)];
		if (uniqueFilmIds.length === 0) continue;
		const enabled = !!toggles.clusters[cluster._id];

		nodes.push({
			id: `cl-${cluster._id}`,
			type: 'cluster',
			label: cluster.name,
			val: 5,
			color: NODE_TYPE_COLORS.cluster,
			active: enabled,
			visible: true,
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

	// Tag nodes + links
	if (displayOptions.showTags) {
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
			const enabled = !!toggles.tags[tag];

			nodes.push({
				id: `tag-${tag}`,
				type: 'tag',
				label: tag,
				val: Math.max(0.5, Math.min(3, filmIds.length / 10)),
				color: NODE_TYPE_COLORS.tag,
				active: enabled,
				visible: true,
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

	// Screening nodes + links
	if (displayOptions.showScreenings)
	for (const screening of screenings) {
		const validFilmIds = screening.filmIds.filter((id) => filmIdSet.has(id));
		if (validFilmIds.length === 0) continue;
		const enabled = !!toggles.screenings[screening._id];

		nodes.push({
			id: `sc-${screening._id}`,
			type: 'screening',
			label: screening.name,
			val: 5,
			color: NODE_TYPE_COLORS.screening,
			active: enabled,
			visible: true,
			data: {
				_id: screening._id,
				name: screening.name,
				filmCount: validFilmIds.length,
			} as ScreeningNodeData,
		});

		for (const filmId of validFilmIds) {
			links.push({
				source: filmId,
				target: `sc-${screening._id}`,
				type: 'film-screening',
			});
		}
	}

	// Apply connection-based sizing if needed
	if (displayOptions.sizeMode === 'connections') {
		const connectionCounts = new Map<string, number>();
		for (const link of links) {
			const src = typeof link.source === 'string' ? link.source : (link.source as any).id;
			const tgt = typeof link.target === 'string' ? link.target : (link.target as any).id;
			connectionCounts.set(src, (connectionCounts.get(src) || 0) + 1);
			connectionCounts.set(tgt, (connectionCounts.get(tgt) || 0) + 1);
		}
		for (const node of nodes) {
			const count = connectionCounts.get(node.id) || 0;
			if (node.type === 'film') {
				node.val = getFilmSize(node.data, 'connections', count);
			} else {
				node.val = Math.max(2, count * 0.5);
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
