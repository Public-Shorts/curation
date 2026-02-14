<script lang="ts">
	import FilmCardGrid from '$lib/components/selection/FilmCardGrid.svelte';
	import {ChevronDown, ChevronRight, Lock, X} from 'lucide-svelte';

	interface Props {
		metaCategory: any;
		isAdmin: boolean;
		collapsed: boolean;
		removingFilms?: Record<string, boolean>;
		onToggle: () => void;
		onRemoveFilm?: (metaCategoryId: string, filmId: string, filmTitle: string) => void;
		onFilmClick?: (film: any) => void;
	}

	let {
		metaCategory,
		isAdmin,
		collapsed,
		removingFilms = {},
		onToggle,
		onRemoveFilm,
		onFilmClick,
	}: Props = $props();
</script>

<section class="rounded-xl bg-white shadow-sm border border-gallery-100 overflow-hidden">
	<!-- Section Header (Always Visible) -->
	<button
		onclick={onToggle}
		class="w-full px-6 py-4 flex flex-col gap-2 hover:bg-gallery-50 transition-colors text-left"
	>
		<!-- Top row: chevron, title, lock, stats -->
		<div class="flex items-center justify-between w-full">
			<div class="flex items-center gap-3 flex-1 min-w-0">
				{#if collapsed}
					<ChevronRight class="w-5 h-5 text-gallery-500 shrink-0" />
				{:else}
					<ChevronDown class="w-5 h-5 text-gallery-500 shrink-0" />
				{/if}

				<h2 class="text-xl font-bold text-gallery-900 truncate" title={metaCategory.name}>
					{metaCategory.name}
				</h2>

				{#if metaCategory.locked}
					<Lock class="w-4 h-4 text-amber-500 shrink-0" />
				{/if}

				{#if metaCategory.type}
					<span
						class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 {metaCategory.type === 'auto'
							? 'bg-blue-50 text-blue-600'
							: 'bg-purple-50 text-purple-600'}"
					>
						{metaCategory.type}
					</span>
				{/if}
			</div>

			<div class="flex items-center gap-6 text-sm text-gallery-500 ml-4">
				<div class="text-right">
					<span class="font-semibold text-gallery-900">
						{metaCategory.filmCount || metaCategory.films?.length || 0}
					</span>
					<span class="ml-1">
						film{(metaCategory.filmCount || metaCategory.films?.length || 0) !== 1 ? 's' : ''}
					</span>
				</div>
				{#if metaCategory.totalHours !== undefined}
					<div class="text-right">
						<span class="font-semibold text-gallery-900">
							{metaCategory.totalHours}h {metaCategory.totalMins}m
						</span>
					</div>
				{/if}
				{#if metaCategory.lastUpdated}
					<div class="text-xs text-gallery-400">
						{new Date(metaCategory.lastUpdated).toLocaleDateString()}
					</div>
				{/if}
			</div>
		</div>

		<!-- Description (always visible) -->
		{#if metaCategory.description}
			<p class="text-sm text-gallery-600 line-clamp-2 ml-8">
				{metaCategory.description}
			</p>
		{/if}

		<!-- Tags (always visible) -->
		{#if metaCategory.tags && metaCategory.tags.length > 0}
			<div class="flex flex-wrap gap-1.5 ml-8">
				{#each metaCategory.tags as tag}
					<span class="text-xs px-2 py-0.5 bg-gallery-100 text-gallery-600 rounded-full">
						{tag}
					</span>
				{/each}
			</div>
		{/if}
	</button>

	<!-- Expanded Content -->
	{#if !collapsed}
		<div class="border-t border-gallery-100 bg-gallery-50/50">
			<!-- Summary -->
			{#if metaCategory.summary}
				<div class="px-6 pt-4 pb-2">
					<p class="text-sm text-gallery-700 leading-relaxed italic">
						{metaCategory.summary}
					</p>
				</div>
			{/if}

			<!-- Films Grid -->
			{#if metaCategory.films && metaCategory.films.length > 0}
				<div class="px-6 pb-6 pt-2">
					<div
						class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
					>
						{#each metaCategory.films as film}
							{@const removingKey = `${metaCategory._id}-${film._id}`}
							{@const preparedFilm = {
								...film,
								title: film.englishTitle || film.title,
								director: film.directorName || film.director,
								curatorCount: film.reviews?.length || 0,
								isVisible: true,
							}}

							<div class="relative group">
								<!-- Admin Remove Button -->
								{#if isAdmin && onRemoveFilm && !metaCategory.locked}
									<button
										onclick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											onRemoveFilm?.(
												metaCategory._id,
												film._id,
												film.englishTitle || film.title
											);
										}}
										disabled={removingFilms[removingKey]}
										class="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
										title="Remove from meta-category"
									>
										{#if removingFilms[removingKey]}
											<span class="text-xs">...</span>
										{:else}
											<X class="w-4 h-4" />
										{/if}
									</button>
								{/if}

								<FilmCardGrid
									film={preparedFilm}
									onclick={() => onFilmClick?.(film)}
								/>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="px-6 pb-6 pt-2">
					<p class="text-sm text-gallery-400 italic text-center py-8">
						No films in this category yet
					</p>
				</div>
			{/if}
		</div>
	{/if}
</section>
