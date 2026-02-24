<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { GraphNode } from './graphUtils';

	interface Props {
		node: GraphNode | null;
		x: number;
		y: number;
	}

	let { node, x, y }: Props = $props();

	let tooltipEl = $state<HTMLDivElement>();

	let position = $derived.by(() => {
		const offset = 16;
		const pad = 12;
		let left = x + offset;
		let top = y + offset;

		if (typeof window !== 'undefined' && tooltipEl) {
			const rect = tooltipEl.getBoundingClientRect();
			if (left + rect.width + pad > window.innerWidth) {
				left = x - rect.width - offset;
			}
			if (top + rect.height + pad > window.innerHeight) {
				top = y - rect.height - offset;
			}
		}

		return { left, top };
	});
</script>

{#if node}
	<div
		bind:this={tooltipEl}
		class="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-gallery-700 bg-gallery-900 p-3 shadow-xl"
		style="left: {position.left}px; top: {position.top}px;"
		transition:fade={{ duration: 80 }}
	>
		{#if node.type === 'film'}
			{@const film = node.data as any}
			<p class="text-sm font-semibold text-gallery-100">{film.englishTitle}</p>
			<p class="text-xs text-gallery-400">{film.directorName}</p>
			<div class="mt-1.5 flex items-center gap-3 text-[11px] text-gallery-300">
				<span>{film.length} min</span>
				<span>Score: {Math.round(film.score)}%</span>
				<span>{(film.reviews || []).length} reviews</span>
			</div>
			{#if film.tags.length > 0}
				<div class="mt-2 flex flex-wrap gap-1">
					{#each film.tags.slice(0, 6) as tag}
						<span class="rounded bg-gallery-800 px-1.5 py-0.5 text-[10px] text-gallery-400">
							{tag}
						</span>
					{/each}
					{#if film.tags.length > 6}
						<span class="text-[10px] text-gallery-500">+{film.tags.length - 6}</span>
					{/if}
				</div>
			{/if}
		{:else if node.type === 'meta-category'}
			{@const mc = node.data as any}
			<div class="flex items-center gap-2">
				<span class="inline-block h-2.5 w-2.5 rounded-sm" style="background: #ff7411"></span>
				<p class="text-sm font-semibold text-gallery-100">{mc.name}</p>
				<span class="rounded bg-gallery-800 px-1.5 py-0.5 text-[10px] text-gallery-400">
					{mc.type}
				</span>
			</div>
			{#if mc.description}
				<p class="mt-1 text-xs text-gallery-400">
					{mc.description.length > 120 ? mc.description.slice(0, 120) + '...' : mc.description}
				</p>
			{/if}
			<p class="mt-1.5 text-[11px] text-gallery-500">{mc.filmCount} films</p>
		{:else if node.type === 'cluster'}
			{@const cl = node.data as any}
			<div class="flex items-center gap-2">
				<span class="inline-block h-2.5 w-2.5 rotate-45 rounded-sm" style="background: #a855f7"></span>
				<p class="text-sm font-semibold text-gallery-100">{cl.name}</p>
			</div>
			{#if cl.description}
				<p class="mt-1 text-xs text-gallery-400">
					{cl.description.length > 120 ? cl.description.slice(0, 120) + '...' : cl.description}
				</p>
			{/if}
			{#if cl.keywords?.length > 0}
				<div class="mt-2 flex flex-wrap gap-1">
					{#each cl.keywords.slice(0, 6) as kw}
						<span class="rounded bg-highlight-900/40 px-1.5 py-0.5 text-[10px] text-highlight-300">
							{kw}
						</span>
					{/each}
				</div>
			{/if}
			<p class="mt-1.5 text-[11px] text-gallery-500">{cl.filmCount} films</p>
		{:else if node.type === 'tag'}
			{@const tag = node.data as any}
			<p class="text-sm font-semibold text-gallery-100">{tag.name}</p>
			<p class="mt-1 text-[11px] text-gallery-400">Used in {tag.count} films</p>
		{:else if node.type === 'screening'}
			{@const sc = node.data as any}
			<div class="flex items-center gap-2">
				<svg class="h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10">
					<polygon points="5,0 10,8.66 0,8.66" fill="#eab308" />
				</svg>
				<p class="text-sm font-semibold text-gallery-100">{sc.name}</p>
			</div>
			<p class="mt-1.5 text-[11px] text-gallery-500">{sc.filmCount} films</p>
		{/if}
	</div>
{/if}
