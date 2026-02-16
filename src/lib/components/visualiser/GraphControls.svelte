<script lang="ts">
	import { Search, Maximize2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Settings2 } from 'lucide-svelte';
	import type { GraphToggles, DisplayOptions, SizeMode, LabelMode, FilterMode } from './graphUtils';

	interface ToggleItem {
		id: string;
		label: string;
		count?: number;
	}

	interface Props {
		toggles: GraphToggles;
		displayOptions: DisplayOptions;
		searchQuery: string;
		onToggleChange: (toggles: GraphToggles) => void;
		onDisplayChange: (options: DisplayOptions) => void;
		onSearchChange: (query: string) => void;
		onZoomToFit: () => void;
		metaCategoryItems: ToggleItem[];
		clusterItems: ToggleItem[];
		tagItems: ToggleItem[];
	}

	let {
		toggles,
		displayOptions,
		searchQuery,
		onToggleChange,
		onDisplayChange,
		onSearchChange,
		onZoomToFit,
		metaCategoryItems,
		clusterItems,
		tagItems,
	}: Props = $props();

	let collapsed = $state(false);
	let mobileOpen = $state(false);

	let mcExpanded = $state(false);
	let clExpanded = $state(false);
	let tagExpanded = $state(false);

	function setDisplay<K extends keyof DisplayOptions>(key: K, value: DisplayOptions[K]) {
		onDisplayChange({ ...displayOptions, [key]: value });
	}

	function toggleItem(section: 'metaCategories' | 'clusters' | 'tags', id: string) {
		const updated = { ...toggles[section], [id]: !toggles[section][id] };
		onToggleChange({ ...toggles, [section]: updated });
	}

	function toggleAll(section: 'metaCategories' | 'clusters' | 'tags', items: ToggleItem[], enable: boolean) {
		const updated: Record<string, boolean> = {};
		for (const item of items) {
			updated[item.id] = enable;
		}
		onToggleChange({ ...toggles, [section]: updated });
	}

	function enabledCount(section: Record<string, boolean>): number {
		return Object.values(section).filter(Boolean).length;
	}

	function allEnabled(section: Record<string, boolean>, items: ToggleItem[]): boolean {
		return items.length > 0 && items.every((item) => section[item.id]);
	}

	function noneEnabled(section: Record<string, boolean>): boolean {
		return !Object.values(section).some(Boolean);
	}

	const sizeOptions: { value: SizeMode; label: string }[] = [
		{ value: 'connections', label: 'Connections' },
		{ value: 'fixed', label: 'Fixed' },
		{ value: 'score', label: 'Score' },
	];

	const labelOptions: { value: LabelMode; label: string }[] = [
		{ value: 'always', label: 'Always' },
		{ value: 'hover', label: 'Hover' },
		{ value: 'never', label: 'Never' },
	];
</script>

<!-- Mobile toggle button -->
<button
	class="md:hidden fixed top-16 left-3 z-50 rounded-lg bg-gallery-800 p-2 text-gallery-300 shadow-lg"
	onclick={() => (mobileOpen = !mobileOpen)}
>
	<Settings2 class="h-5 w-5" />
</button>

<!-- Sidebar -->
<aside
	class="
		shrink-0 overflow-y-auto border-r border-gallery-800 bg-gallery-900 text-gallery-300
		transition-all duration-200
		{collapsed ? 'w-0 md:w-10' : 'w-72'}
		{mobileOpen ? 'fixed inset-y-0 left-0 z-40 w-72' : 'hidden md:block'}
	"
>
	{#if !collapsed}
		<div class="flex flex-col gap-4 p-4">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h2 class="text-xs font-bold uppercase tracking-wider text-gallery-400">Graph Controls</h2>
				<button
					class="hidden md:block text-gallery-500 hover:text-gallery-300"
					onclick={() => (collapsed = true)}
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
			</div>

			<!-- Search -->
			<div class="relative">
				<Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gallery-500" />
				<input
					type="text"
					placeholder="Search nodes..."
					value={searchQuery}
					oninput={(e) => onSearchChange(e.currentTarget.value)}
					class="w-full rounded-md border border-gallery-700 bg-gallery-800 py-2 pl-8 pr-3 text-xs text-gallery-200 placeholder-gallery-500 outline-none focus:border-gallery-600"
				/>
			</div>

			<!-- Filter Mode -->
			<section>
				<h3 class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gallery-500">
					Filter Mode
				</h3>
				<div class="flex gap-1">
					<button
						class="flex flex-1 items-center justify-center gap-2 rounded px-2.5 py-1.5 text-[11px] font-medium transition-colors
							{displayOptions.filterMode === 'union'
							? 'bg-gallery-600 text-white'
							: 'bg-gallery-800 text-gallery-400 hover:bg-gallery-700 hover:text-gallery-300'}"
						onclick={() => setDisplay('filterMode', 'union')}
						title="A film matches if it belongs to ANY active group"
					>
						<!-- Union Venn: both circles filled -->
						<svg viewBox="0 0 28 18" class="h-4 w-7 shrink-0" aria-hidden="true">
							<circle cx="10" cy="9" r="7.5" fill="currentColor" opacity="0.5" />
							<circle cx="18" cy="9" r="7.5" fill="currentColor" opacity="0.5" />
						</svg>
						Union
					</button>
					<button
						class="flex flex-1 items-center justify-center gap-2 rounded px-2.5 py-1.5 text-[11px] font-medium transition-colors
							{displayOptions.filterMode === 'intersection'
							? 'bg-gallery-600 text-white'
							: 'bg-gallery-800 text-gallery-400 hover:bg-gallery-700 hover:text-gallery-300'}"
						onclick={() => setDisplay('filterMode', 'intersection')}
						title="A film matches only if it belongs to ALL active groups"
					>
						<!-- Intersection Venn: only overlap filled -->
						<svg viewBox="0 0 28 18" class="h-4 w-7 shrink-0" aria-hidden="true">
							<defs>
								<clipPath id="clip-left">
									<circle cx="10" cy="9" r="7.5" />
								</clipPath>
							</defs>
							<circle cx="10" cy="9" r="7.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4" />
							<circle cx="18" cy="9" r="7.5" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4" />
							<circle cx="18" cy="9" r="7.5" fill="currentColor" opacity="0.5" clip-path="url(#clip-left)" />
						</svg>
						Inter.
					</button>
				</div>
				<p class="mt-1.5 text-[10px] text-gallery-600">
					{displayOptions.filterMode === 'union'
						? 'Match any active criteria'
						: 'Match all active criteria'}
				</p>
			</section>

			<!-- Node Types -->
			<section>
				<h3 class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gallery-500">
					Node Types
				</h3>
				<div class="flex flex-col gap-0.5">
					{@render nodeTypeToggle('Meta Categories', '#ff7411', 'square', displayOptions.showMetaCategories, () => setDisplay('showMetaCategories', !displayOptions.showMetaCategories))}
					{@render nodeTypeToggle('Clusters', '#a855f7', 'diamond', displayOptions.showClusters, () => setDisplay('showClusters', !displayOptions.showClusters))}
					{@render nodeTypeToggle('Tags', '#78716c', 'circle', displayOptions.showTags, () => setDisplay('showTags', !displayOptions.showTags))}
				</div>
			</section>

			<!-- Meta Categories -->
			{#if displayOptions.showMetaCategories}
				{@render toggleSection(
					'Meta Categories',
					'#ff7411',
					'square',
					mcExpanded,
					() => (mcExpanded = !mcExpanded),
					toggles.metaCategories,
					metaCategoryItems,
					'metaCategories'
				)}
			{/if}

			<!-- Clusters -->
			{#if displayOptions.showClusters}
				{@render toggleSection(
					'Clusters',
					'#a855f7',
					'diamond',
					clExpanded,
					() => (clExpanded = !clExpanded),
					toggles.clusters,
					clusterItems,
					'clusters'
				)}
			{/if}

			<!-- Tags -->
			{#if displayOptions.showTags}
				{@render toggleSection(
					'Tags',
					'#78716c',
					'circle',
					tagExpanded,
					() => (tagExpanded = !tagExpanded),
					toggles.tags,
					tagItems,
					'tags'
				)}
			{/if}

			<!-- Node Size -->
			<section>
				<h3 class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gallery-500">
					Node Size
				</h3>
				<div class="flex flex-wrap gap-1">
					{#each sizeOptions as opt}
						<button
							class="rounded px-2.5 py-1 text-[11px] font-medium transition-colors
								{displayOptions.sizeMode === opt.value
								? 'bg-gallery-600 text-white'
								: 'bg-gallery-800 text-gallery-400 hover:bg-gallery-700 hover:text-gallery-300'}"
							onclick={() => setDisplay('sizeMode', opt.value)}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</section>

			<!-- Labels -->
			<section>
				<h3 class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gallery-500">
					Labels
				</h3>
				<div class="flex flex-wrap gap-1">
					{#each labelOptions as opt}
						<button
							class="rounded px-2.5 py-1 text-[11px] font-medium transition-colors
								{displayOptions.labelMode === opt.value
								? 'bg-gallery-600 text-white'
								: 'bg-gallery-800 text-gallery-400 hover:bg-gallery-700 hover:text-gallery-300'}"
							onclick={() => setDisplay('labelMode', opt.value)}
						>
							{opt.label}
						</button>
					{/each}
				</div>
			</section>

			<!-- Spacing -->
			<section>
				<h3 class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gallery-500">
					Spacing
				</h3>
				<div class="flex items-center gap-2">
					<input
						type="range"
						min="0.2"
						max="20"
						step="0.1"
						value={displayOptions.forceStrength}
						oninput={(e) => setDisplay('forceStrength', parseFloat(e.currentTarget.value))}
						class="w-full accent-gallery-500"
					/>
					<span class="min-w-8 text-right text-[10px] text-gallery-500">
						{displayOptions.forceStrength.toFixed(1)}
					</span>
				</div>
			</section>

			<!-- Actions -->
			<section>
				<button
					class="flex w-full items-center justify-center gap-2 rounded-md border border-gallery-700 bg-gallery-800 px-3 py-2 text-xs font-medium text-gallery-300 hover:border-gallery-600 hover:text-gallery-200"
					onclick={onZoomToFit}
				>
					<Maximize2 class="h-3.5 w-3.5" />
					Zoom to Fit
				</button>
			</section>
		</div>
	{:else}
		<div class="flex h-full flex-col items-center pt-3">
			<button
				class="text-gallery-500 hover:text-gallery-300"
				onclick={() => (collapsed = false)}
			>
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>
	{/if}
</aside>

<!-- Mobile backdrop -->
{#if mobileOpen}
	<button
		class="fixed inset-0 z-30 bg-black/50 md:hidden"
		onclick={() => (mobileOpen = false)}
		aria-label="Close menu"
	></button>
{/if}

{#snippet nodeTypeToggle(
	label: string,
	color: string,
	shape: string,
	enabled: boolean,
	onToggle: () => void
)}
	<label class="flex cursor-pointer items-center justify-between rounded px-2 py-1 hover:bg-gallery-800 text-[11px]">
		<span class="flex items-center gap-2 text-gallery-300">
			<span
				class="inline-block h-2.5 w-2.5 shrink-0"
				class:rounded-sm={shape === 'square'}
				class:rounded-full={shape === 'circle'}
				class:rotate-45={shape === 'diamond'}
				style="background: {color}; opacity: {enabled ? 1 : 0.3}"
			></span>
			{label}
		</span>
		<input
			type="checkbox"
			checked={enabled}
			onchange={onToggle}
			class="shrink-0 accent-gallery-500"
		/>
	</label>
{/snippet}

{#snippet toggleSection(
	title: string,
	color: string,
	shape: string,
	expanded: boolean,
	onToggleExpand: () => void,
	sectionToggles: Record<string, boolean>,
	items: ToggleItem[],
	sectionKey: 'metaCategories' | 'clusters' | 'tags'
)}
	<section class="border-t border-gallery-800 pt-3">
		<!-- Section header -->
		<div class="flex items-center justify-between mb-1">
			<button
				class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gallery-500 hover:text-gallery-300"
				onclick={onToggleExpand}
			>
				<span
					class="inline-block h-2.5 w-2.5 shrink-0"
					class:rounded-sm={shape === 'square'}
					class:rounded-full={shape === 'circle'}
					class:rotate-45={shape === 'diamond'}
					style="background: {color}"
				></span>
				{title}
				<span class="text-gallery-600">
					({enabledCount(sectionToggles)}/{items.length})
				</span>
				{#if expanded}
					<ChevronUp class="h-3 w-3" />
				{:else}
					<ChevronDown class="h-3 w-3" />
				{/if}
			</button>
			<!-- Toggle all -->
			<button
				class="text-[10px] text-gallery-600 hover:text-gallery-300"
				onclick={() => {
					const shouldEnable = !allEnabled(sectionToggles, items);
					toggleAll(sectionKey, items, shouldEnable);
				}}
			>
				{allEnabled(sectionToggles, items) ? 'None' : 'All'}
			</button>
		</div>

		<!-- Individual items -->
		{#if expanded}
			<div class="flex flex-col gap-0.5 max-h-48 overflow-y-auto mt-1">
				{#each items as item}
					<label
						class="flex cursor-pointer items-center justify-between rounded px-2 py-1 hover:bg-gallery-800 text-[11px]"
					>
						<span class="truncate text-gallery-300" title={item.label}>
							{item.label}
							{#if item.count != null}
								<span class="text-gallery-600">({item.count})</span>
							{/if}
						</span>
						<input
							type="checkbox"
							checked={sectionToggles[item.id] || false}
							onchange={() => toggleItem(sectionKey, item.id)}
							class="shrink-0 accent-gallery-500"
						/>
					</label>
				{/each}
			</div>
		{/if}
	</section>
{/snippet}
