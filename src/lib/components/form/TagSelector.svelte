<script lang="ts">
	type Tag = { label: string; value: string };

	let {
		allTags,
		selectedTags = $bindable([]),
		name = 'tags'
	}: {
		allTags: Tag[];
		selectedTags: Tag[];
		name?: string;
	} = $props();

	let search = $state('');
	let isOpen = $state(false);

	const filteredTags = $derived(
		allTags
			.filter((t) => !selectedTags.some((s) => s.value === t.value))
			.filter((t) => (search ? t.label.toLowerCase().includes(search.toLowerCase()) : true))
			.slice(0, 50)
	);

	function addTag(tag: Tag) {
		if (!selectedTags.some((t) => t.value === tag.value)) {
			selectedTags.push(tag);
		}
		search = '';
		isOpen = false;
	}

	function addNewTagFromSearch() {
		const label = search.trim();
		if (!label) return;
		const value = label.toLowerCase().replace(/\W/g, '-');
		if (!selectedTags.some((t) => t.value === value)) {
			selectedTags.push({ label, value });
		}
		search = '';
		isOpen = false;
	}

	function removeTag(tag: Tag) {
		const i = selectedTags.findIndex((t) => t.value === tag.value);
		if (i !== -1) selectedTags.splice(i, 1);
	}

	const hasExactMatch = $derived.by(() => {
		if (!search.trim()) return false;
		const searchLower = search.toLowerCase();
		return allTags.some((t) => t.label.toLowerCase() === searchLower);
	});
	const canCreateNew = $derived(search.trim() !== '' && !hasExactMatch);
</script>

<div
	class="rounded-lg border border-gray-300 bg-white p-2 focus-within:ring-1 focus-within:ring-black focus-within:border-black"
>
	<div class="flex flex-wrap gap-2 mb-2">
		{#each selectedTags as tag}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800"
			>
				{tag.label}
				<button
					type="button"
					onclick={() => removeTag(tag)}
					class="ml-1 text-gray-500 hover:text-black focus:outline-none"
				>
					×
				</button>
			</span>
			<input type="hidden" name="tags" value={tag.label} />
		{/each}
	</div>

	<div class="relative">
		<input
			id="tagsInput"
			type="text"
			placeholder={selectedTags.length ? 'Add another tag...' : 'Search or create tags...'}
			class="w-full border-0 p-0 text-sm focus:ring-0 placeholder:text-gray-400"
			bind:value={search}
			onfocus={() => (isOpen = true)}
			onblur={() => setTimeout(() => (isOpen = false), 150)}
			autocomplete="off"
		/>

		{#if isOpen && (filteredTags.length > 0 || canCreateNew)}
			<ul
				class="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
			>
				{#each filteredTags as tag}
					<li>
						<button
							type="button"
							class="w-full text-left px-4 py-2 hover:bg-gray-100"
							onmousedown={() => addTag(tag)}
						>
							{tag.label}
						</button>
					</li>
				{/each}
				{#if canCreateNew}
					<li>
						<button
							type="button"
							class="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium"
							onmousedown={addNewTagFromSearch}
						>
							Create "{search}"
						</button>
					</li>
				{/if}
			</ul>
		{/if}
	</div>
</div>
