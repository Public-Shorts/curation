<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		type GraphData,
		type GraphNode,
		type DisplayOptions,
		type LabelMode,
		dimColor,
	} from './graphUtils';

	interface Props {
		graphData: GraphData;
		displayOptions: DisplayOptions;
		onNodeHover: (node: GraphNode | null, pos: { x: number; y: number }) => void;
		onNodeClick: (node: GraphNode) => void;
	}

	let { graphData, displayOptions, onNodeHover, onNodeClick }: Props = $props();

	let containerEl = $state<HTMLDivElement>();
	let graph: any = $state(null);
	let highlightedNodeIds = $state<Set<string>>(new Set());

	// Track the last set of node IDs to detect structural vs visibility-only changes
	let lastNodeIdSet = new Set<string>();

	onMount(async () => {
		const module = await import('force-graph');
		const ForceGraph = module.default;
		initGraph(ForceGraph);
	});

	onDestroy(() => {
		if (graph) {
			graph._destructor?.();
			graph = null;
		}
	});

	function initGraph(ForceGraph: any) {
		if (!containerEl) return;
		graph = ForceGraph()(containerEl)
			.graphData({ nodes: [], links: [] })
			.nodeId('id')
			.nodeVal('val')
			.nodeLabel('')
			.backgroundColor('#1c1917')
			.nodeVisibility((node: any) => node.visible !== false)
			.linkVisibility((link: any) => {
				const srcId = typeof link.source === 'object' ? link.source.id : link.source;
				const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
				const currentData = graph?.graphData();
				if (!currentData) return true;
				const srcNode = currentData.nodes.find((n: any) => n.id === srcId);
				const tgtNode = currentData.nodes.find((n: any) => n.id === tgtId);
				if (srcNode?.visible === false || tgtNode?.visible === false) return false;
				// Hide links to group nodes that are toggled off
				if (srcNode?.type !== 'film' && srcNode?.active === false) return false;
				if (tgtNode?.type !== 'film' && tgtNode?.active === false) return false;
				return true;
			})
			.linkColor((link: any) => {
				const srcId = typeof link.source === 'object' ? link.source.id : link.source;
				const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
				const srcNode = graphData.nodes.find((n) => n.id === srcId);
				const tgtNode = graphData.nodes.find((n) => n.id === tgtId);
				const bothActive = srcNode?.active !== false && tgtNode?.active !== false;

				if (highlightedNodeIds.size > 0) {
					if (highlightedNodeIds.has(srcId) && highlightedNodeIds.has(tgtId)) {
						return linkColorByType(link.type, 0.6);
					}
					return 'rgba(255,255,255,0.02)';
				}
				return linkColorByType(link.type, bothActive ? 0.35 : 0.06);
			})
			.linkWidth((link: any) => {
				if (highlightedNodeIds.size > 0) {
					const srcId = typeof link.source === 'object' ? link.source.id : link.source;
					const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
					if (highlightedNodeIds.has(srcId) && highlightedNodeIds.has(tgtId)) return 1.5;
					return 0.2;
				}
				return 0.5;
			})
			.nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
				drawNode(node, ctx, globalScale);
			})
			.nodePointerAreaPaint(
				(node: any, color: string, ctx: CanvasRenderingContext2D) => {
					const radius = getNodeRadius(node) + 2;
					ctx.beginPath();
					ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
					ctx.fillStyle = color;
					ctx.fill();
				}
			)
			.onNodeHover((node: any) => {
				if (containerEl) containerEl.style.cursor = node ? 'pointer' : 'default';
				if (node) {
					// Highlight hovered node + its connections
					const connected = new Set<string>([node.id]);
					const data = graph.graphData();
					for (const link of data.links) {
						const srcId = typeof link.source === 'object' ? link.source.id : link.source;
						const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
						if (srcId === node.id) connected.add(tgtId);
						if (tgtId === node.id) connected.add(srcId);
					}
					highlightedNodeIds = connected;

					const canvas = containerEl?.querySelector('canvas');
					if (canvas) {
						const rect = canvas.getBoundingClientRect();
						const coords = graph.graph2ScreenCoords(node.x, node.y);
						onNodeHover(node, {
							x: rect.left + coords.x,
							y: rect.top + coords.y,
						});
					}
				} else {
					highlightedNodeIds = new Set();
					onNodeHover(null, { x: 0, y: 0 });
				}
			})
			.onNodeClick((node: any) => {
				onNodeClick(node);
			})
			.onBackgroundClick(() => {
				highlightedNodeIds = new Set();
			})
			.warmupTicks(0)
			.cooldownTicks(400)
			.d3AlphaDecay(0.04)
			.d3VelocityDecay(0.6);

		graph.d3Force('charge').strength(-60);
		graph.d3Force('link').distance(50);

		// Custom gravity: pulls all nodes toward center, keeps orphans from drifting
		const gravity = createGravityForce(0.06);
		graph.d3Force('gravity', gravity);

		if (graphData.nodes.length > 0) {
			lastNodeIdSet = new Set(graphData.nodes.map((n) => n.id));
			graph.graphData({ nodes: graphData.nodes, links: graphData.links });
			setTimeout(() => graph.zoomToFit(400, 60), 500);
		}

		const observer = new ResizeObserver(() => {
			if (graph && containerEl) {
				graph.width(containerEl.clientWidth).height(containerEl.clientHeight);
			}
		});
		observer.observe(containerEl!);

		return () => observer.disconnect();
	}

	function createGravityForce(strength: number) {
		let nodes: any[] = [];
		function force(alpha: number) {
			for (const node of nodes) {
				node.vx -= node.x * strength * alpha;
				node.vy -= node.y * strength * alpha;
			}
		}
		force.initialize = (n: any[]) => { nodes = n; };
		return force;
	}

	function linkColorByType(type: string, opacity: number): string {
		switch (type) {
			case 'film-meta':
				return `rgba(255, 116, 17, ${opacity})`;
			case 'film-cluster':
				return `rgba(168, 85, 247, ${opacity})`;
			case 'film-tag':
				return `rgba(120, 113, 108, ${opacity})`;
			case 'film-screening':
				return `rgba(234, 179, 8, ${opacity})`;
			default:
				return `rgba(255, 255, 255, ${opacity})`;
		}
	}

	function getNodeRadius(node: any): number {
		return Math.sqrt(node.val || 2) * 3;
	}

	function drawNode(node: any, ctx: CanvasRenderingContext2D, globalScale: number) {
		const radius = getNodeRadius(node);
		const isActive = node.active !== false;
		const isHighlighted =
			highlightedNodeIds.size === 0 || highlightedNodeIds.has(node.id);
		const dimmed = !isActive || !isHighlighted;
		const color = dimmed ? dimColor(node.color, 0.2) : node.color;

		ctx.beginPath();

		if (node.type === 'meta-category') {
			drawRoundedRect(ctx, node.x - radius, node.y - radius, radius * 2, radius * 2, 3);
		} else if (node.type === 'cluster') {
			drawDiamond(ctx, node.x, node.y, radius);
		} else if (node.type === 'screening') {
			drawTriangle(ctx, node.x, node.y, radius);
		} else {
			ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
		}

		ctx.fillStyle = color;
		ctx.fill();

		// Glow for active group nodes
		if (!dimmed && (node.type === 'meta-category' || node.type === 'cluster' || node.type === 'screening')) {
			ctx.shadowColor = node.color;
			ctx.shadowBlur = 8;
			ctx.fill();
			ctx.shadowBlur = 0;
		}

		// Labels
		const labelMode: LabelMode = displayOptions.labelMode;
		const showLabel =
			labelMode === 'always' ||
			(labelMode === 'hover' &&
				(highlightedNodeIds.has(node.id) || node.type !== 'film'));

		if (showLabel) {
			const fontSize = Math.max(9, 11 / globalScale);
			ctx.font = `${fontSize}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'top';
			ctx.fillStyle = dimmed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)';
			ctx.fillText(node.label, node.x, node.y + radius + 3 / globalScale);
		}
	}

	function drawRoundedRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		w: number,
		h: number,
		r: number
	) {
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + w - r, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + r);
		ctx.lineTo(x + w, y + h - r);
		ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		ctx.lineTo(x + r, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
	}

	function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
		ctx.moveTo(x, y - r);
		ctx.lineTo(x + r, y);
		ctx.lineTo(x, y + r);
		ctx.lineTo(x - r, y);
		ctx.closePath();
	}

	function drawTriangle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
		ctx.moveTo(x, y - r);
		ctx.lineTo(x + r * 0.866, y + r * 0.5);
		ctx.lineTo(x - r * 0.866, y + r * 0.5);
		ctx.closePath();
	}

	// React to graph data changes — use visibility for toggle changes, full update for structural changes
	$effect(() => {
		if (!graph || !graphData) return;

		const newNodeIdSet = new Set(graphData.nodes.map((n) => n.id));
		const isStructuralChange = newNodeIdSet.size !== lastNodeIdSet.size ||
			[...newNodeIdSet].some((id) => !lastNodeIdSet.has(id));

		if (isStructuralChange) {
			// Structural change (initial load, sizeMode change, etc.) — full graphData update
			const currentData = graph.graphData();
			const posMap = new Map<string, { x: number; y: number }>();
			for (const node of currentData.nodes) {
				if (node.x != null && node.y != null) {
					posMap.set(node.id, { x: node.x, y: node.y });
				}
			}

			const newNodes = graphData.nodes.map((n: any) => {
				const pos = posMap.get(n.id);
				if (pos) {
					// Preserve position, zero velocity to prevent lurching
					return { ...n, x: pos.x, y: pos.y, vx: 0, vy: 0 };
				}
				// New node: place near a connected neighbor
				const connectedLink = graphData.links.find((l) => {
					const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
					const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
					return s === n.id || t === n.id;
				});
				if (connectedLink) {
					const s = typeof connectedLink.source === 'string' ? connectedLink.source : (connectedLink.source as any).id;
					const t = typeof connectedLink.target === 'string' ? connectedLink.target : (connectedLink.target as any).id;
					const neighborId = s === n.id ? t : s;
					const neighborPos = posMap.get(neighborId);
					if (neighborPos) {
						const angle = Math.random() * 2 * Math.PI;
						return { ...n, x: neighborPos.x + Math.cos(angle) * 30, y: neighborPos.y + Math.sin(angle) * 30, vx: 0, vy: 0 };
					}
				}
				return { ...n };
			});

			lastNodeIdSet = newNodeIdSet;
			graph.graphData({ nodes: newNodes, links: graphData.links });
			// graphData() already calls alpha(1) internally — don't call d3ReheatSimulation
		} else {
			// Visibility/active-only change — mutate nodes in-place, no simulation restart
			const currentData = graph.graphData();
			const newNodeMap = new Map(graphData.nodes.map((n) => [n.id, n]));

			for (const node of currentData.nodes) {
				const updated = newNodeMap.get(node.id);
				if (updated) {
					node.visible = updated.visible;
					node.active = updated.active;
					node.val = updated.val;
					node.color = updated.color;
				}
			}

			// Trigger redraw without simulation restart
			graph.nodeVisibility(graph.nodeVisibility());
			graph.linkVisibility(graph.linkVisibility());
		}
	});

	// React to force strength changes
	$effect(() => {
		if (graph) {
			graph.d3Force('charge').strength(-60 * displayOptions.forceStrength);
			graph.d3ReheatSimulation();
		}
	});

	// React to highlight changes — force re-render
	$effect(() => {
		if (graph) {
			highlightedNodeIds;
			graph.nodeColor(graph.nodeColor());
		}
	});

	export function zoomToFit() {
		if (graph) graph.zoomToFit(400, 60);
	}
</script>

<div bind:this={containerEl} class="w-full h-full"></div>
